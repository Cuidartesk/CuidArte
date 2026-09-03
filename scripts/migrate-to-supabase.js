require('dotenv').config();
const mongoose = require('mongoose');
const supabase = require('../config/supabase');

const URI = process.env.MONGOURI;

const BUCKET_CUIDARTE = 'cuidarte';
const BUCKET_AVATARS = 'avatars';

const mappings = {};

function normalizeMappingRow(rows) {
  const map = {};
  for (const r of rows) map[r._id] = r.id;
  return map;
}

async function uploadImage(buffer, bucket, filename, contentType) {
  const { error } = await supabase.storage.from(bucket).upload(filename, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error(`   [Storage upload ${bucket}/${filename}] ERROR:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

async function migrateTable(table, docs, mapField = '_id', imageConfig = null, columnMap = {}, lookupKey = null) {
  if (docs.length === 0) {
    console.log(`✅ ${table}: 0 registros (nada que migrar)`);
    return {};
  }

  const rows = [];
  const skipFields = new Set(['_id', '__v']);
  if (imageConfig) {
    skipFields.add(imageConfig.dataField);
    if (imageConfig.skipExtra) {
      for (const f of imageConfig.skipExtra) skipFields.add(f);
    }
  }
  for (const doc of docs) {
    const row = {};
    for (const key of Object.keys(doc)) {
      if (skipFields.has(key)) continue;
      let colName = columnMap[key] || key;

      const val = doc[key];
      if (val instanceof mongoose.Types.ObjectId) {
        row[colName] = val.toString();
        continue;
      }
      if (val instanceof Date) {
        row[colName] = val.toISOString();
        continue;
      }
      row[colName] = val;
    }

    let url = null;
    if (imageConfig) {
      const raw = doc[imageConfig.dataField];
      if (raw && typeof raw === 'string' && raw.startsWith('data:')) {
        const m = raw.match(/^data:([^;]+);base64,(.*)$/s);
        if (m) {
          const contentType = m[1];
          const base64 = m[2];
          const buffer = Buffer.from(base64, 'base64');
          const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
          const baseName = (doc.name || doc.email || Date.now())
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .toLowerCase();
          const filename = `${baseName}-${Date.now()}.${ext}`;
          url = await uploadImage(buffer, imageConfig.bucket, filename, contentType);
          if (url) row[imageConfig.urlField] = url;
        }
      }
    }

    rows.push(row);
  }

  const BATCH = 50;
  let ok = 0;
  const resultMap = {};
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const srcDocs = docs.slice(i, i + BATCH);

    const insertRows = [];
    const updatePairs = [];
    for (let j = 0; j < batch.length; j++) {
      const row = { ...batch[j] };
      const src = srcDocs[j];

      let existingId = null;
      if (lookupKey) {
        const keyVal = src[lookupKey];
        if (keyVal !== undefined) {
          const { data } = await supabase
            .from(table)
            .select('id')
            .eq(lookupKey, keyVal)
            .maybeSingle();
          if (data) existingId = data.id;
        }
      }

      if (existingId) {
        delete row.id;
        updatePairs.push({ id: existingId, row });
        if (mapField && src[mapField]) resultMap[src[mapField].toString()] = existingId;
      } else {
        insertRows.push({ ...row });
      }
    }

    if (updatePairs.length > 0) {
      for (const { id, row } of updatePairs) {
        const { error } = await supabase.from(table).update(row).eq('id', id);
        if (error) console.error(`❌ ${table} update ${id}:`, error.message);
        else ok++;
      }
    }

    if (insertRows.length > 0) {
      const { data, error } = await supabase.from(table).insert(insertRows).select('id');
      if (error) {
        console.error(`❌ ${table} (insert):`, error.message);
        continue;
      }
      let insertedIndex = 0;
      for (let j = 0; j < srcDocs.length; j++) {
        const srcId = srcDocs[j][mapField]?.toString();
        if (!srcId || resultMap[srcId]) continue;
        if (insertedIndex < data.length) {
          resultMap[srcId] = data[insertedIndex].id;
          insertedIndex++;
        }
      }
      ok += insertRows.length;
    }
  }

  console.log(`✅ ${table}: ${ok} registros migrados`);
  return resultMap;
}

async function resetTables() {
  const order = ['solicitudes', 'pedidos', 'services', 'products', 'clients', 'caregivers', 'administrators'];
  for (const t of order) {
    const { error, count } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id', { count: 'exact' });
    if (error) console.error(`⚠️ Limpieza ${t}:`, error.message);
    else console.log(`🧹 ${t} vaciada (${count || 0})`);
  }
}

async function run() {
  if (!URI) {
    console.error('MONGOURI no está definido en .env');
    process.exit(1);
  }

  console.log('Conectando a MongoDB...');
  await mongoose.connect(URI);

  const db = mongoose.connection.db;

  console.log('Conectando a Supabase...');

  console.log('\nLimpieza de tablas previas (migración idempotente)...');
  await resetTables();

  console.log('\n--- Migrando administrators ---');
  mappings.administrators = await migrateTable(
    'administrators',
    await db.collection('administrators').find({}).toArray(),
    '_id',
    null,
    { fechaNacimiento: 'fecha_nacimiento', createdAt: 'created_at', updatedAt: 'updated_at' },
    'email'
  );

  console.log('\n--- Migrando clients ---');
  const clientsDocs = await db.collection('clients').find({}).toArray();
  mappings.clients = await migrateTable(
    'clients',
    clientsDocs,
    '_id',
    {
      bucket: BUCKET_AVATARS,
      dataField: 'foto',
      urlField: 'foto_url',
      skipExtra: ['foto', 'fotoTipo'],
    },
    { fechaNacimiento: 'fecha_nacimiento', createdAt: 'created_at', updatedAt: 'updated_at' },
    'email'
  );

  console.log('\n--- Migrando caregivers ---');
  const caregiversDocs = await db.collection('caregivers').find({}).toArray();
  mappings.caregivers = await migrateTable(
    'caregivers',
    caregiversDocs,
    '_id',
    {
      bucket: BUCKET_AVATARS,
      dataField: 'foto',
      urlField: 'foto_url',
      skipExtra: ['foto', 'fotoTipo'],
    },
    { fechaNacimiento: 'fecha_nacimiento', createdAt: 'created_at', updatedAt: 'updated_at' },
    'email'
  );

  console.log('\n--- Migrando products ---');
  const productsDocs = await db.collection('products').find({}).toArray();
  mappings.products = await migrateTable(
    'products',
    productsDocs,
    '_id',
    {
      bucket: BUCKET_CUIDARTE,
      dataField: 'imageData',
      urlField: 'image_url',
      skipExtra: ['imageType', 'imageData'],
    },
    { createdAt: 'created_at', updatedAt: 'updated_at' }
  );

  console.log('\n--- Migrando services ---');
  const servicesDocs = await db.collection('services').find({}).toArray();
  mappings.services = await migrateTable(
    'services',
    servicesDocs,
    '_id',
    {
      bucket: BUCKET_CUIDARTE,
      dataField: 'imageData',
      urlField: 'image_url',
      skipExtra: ['imageType', 'imageData'],
    },
    { createdAt: 'created_at', updatedAt: 'updated_at' }
  );

  console.log('\n--- Migrando solicitudes ---');
  const solicitudesDocs = await db.collection('solicitudes').find({}).toArray();
  if (solicitudesDocs.length > 0) {
    const rows = solicitudesDocs.map((doc) => {
      const clienteId = mappings.clients[doc.cliente.toString()];
      const cuidadorId = mappings.caregivers[doc.cuidador.toString()];
      return {
        cliente: clienteId || doc.cliente.toString(),
        cuidador: cuidadorId || doc.cuidador.toString(),
        mensaje: doc.mensaje || '',
        servicio: doc.servicio || '',
        estado: doc.estado || 'pendiente',
        created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
    const { data, error } = await supabase.from('solicitudes').insert(rows).select();
    if (error) console.error('❌ solicitudes:', error.message);
    else console.log(`✅ solicitudes: ${data.length} registros migrados`);
  } else {
    console.log('✅ solicitudes: 0 registros');
  }

  console.log('\n--- Migrando pedidos ---');
  const pedidosDocs = await db.collection('pedidos').find({}).toArray();
  if (pedidosDocs.length > 0) {
    const rows = pedidosDocs.map((doc) => {
      const usuarioId = mappings.clients[doc.usuario.toString()] || mappings.caregivers[doc.usuario.toString()] || mappings.administrators[doc.usuario.toString()];
      const productoId = mappings.products[doc.producto.toString()];
      return {
        usuario: usuarioId || doc.usuario.toString(),
        producto: productoId || doc.producto.toString(),
        cantidad: doc.cantidad || 1,
        direccion_envio: doc.direccionEnvio || '',
        telefono: doc.telefono || '',
        estado: doc.estado || 'pendiente',
        created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
    const { data, error } = await supabase.from('pedidos').insert(rows).select();
    if (error) console.error('❌ pedidos:', error.message);
    else console.log(`✅ pedidos: ${data.length} registros migrados`);
  } else {
    console.log('✅ pedidos: 0 registros');
  }

  console.log('\n========================================');
  console.log('Migración completada.');
  console.log('========================================');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Error fatal:', e.message || e);
  process.exit(1);
});
