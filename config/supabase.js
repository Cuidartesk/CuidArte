const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(URL, SERVICE_KEY, {
  realtime: { transport: WebSocket },
});

// Convierte una imagen en Base64 (data:image/...;base64,...) a un archivo
// subido al bucket indicado y devuelve la URL publica (o null si no hay imagen).
async function subirImagen(datosBase64, bucket, nombreBase) {
  if (!datosBase64 || typeof datosBase64 !== 'string' || !datosBase64.startsWith('data:image')) {
    return null;
  }
  const m = datosBase64.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) return null;
  const contentType = m[1];
  const buffer = Buffer.from(m[2], 'base64');
  const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const nombre = `${(nombreBase || Date.now()).toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() || 'img'}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(nombre, buffer, {
    contentType,
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(nombre);
  return data.publicUrl;
}

module.exports = supabase;
module.exports.subirImagen = subirImagen;
