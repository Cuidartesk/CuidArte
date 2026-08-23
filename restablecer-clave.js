/* ============================================================
   ARCHIVO NUEVO COMPLETO
   restablecer-clave.js
   Es nuestro equivalente al "python manage.py changepassword"
   de Django. Asigna una contrasena nueva (con hash bcrypt) a
   cualquier cuenta, buscandola en las tres colecciones.

   Uso:
        node restablecer-clave.js correo@ejemplo.com NuevaClave123
   ============================================================ */

require('dotenv').config();
require('./config/connectiondb');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Administrator = require('./models/admin.model');
const Client = require('./models/client.model');
const Caregiver = require('./models/caregiver.model');

async function main() {
  const [correo, clave] = process.argv.slice(2);

  if (!correo || !clave) {
    console.error('[ERROR] Uso: node restablecer-clave.js <correo> <nuevaClave>');
    process.exit(1);
  }
  if (clave.length < 6) {
    console.error('[ERROR] La contrasena debe tener al menos 6 caracteres.');
    process.exit(1);
  }

  let i = 0;
  while (mongoose.connection.readyState !== 1 && i < 30) {
    await new Promise(r => setTimeout(r, 1000)); i++;
  }
  if (mongoose.connection.readyState !== 1) {
    console.error('[ERROR] No se pudo conectar a MongoDB.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(clave, 10);
  const emailBuscado = correo.trim().toLowerCase();

  // Busca en las tres colecciones y actualiza donde exista
  const modelos = [
    ['administrator', Administrator],
    ['caregiver', Caregiver],
    ['client', Client]
  ];
  for (const [nombre, Modelo] of modelos) {
    const cuenta = await Modelo.findOne({ email: emailBuscado });
    if (cuenta) {
      cuenta.password = hash;
      await cuenta.save();
      console.log(`[OK] Contrasena actualizada para ${emailBuscado} (coleccion: ${nombre === 'administrator' ? 'administrators' : nombre + 's'})`);
      console.log('[INFO] En la BD solo quedo el HASH, nunca la contrasena real.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  console.error(`[ERROR] No existe ninguna cuenta con el correo ${emailBuscado}.`);
  await mongoose.disconnect();
  process.exit(1);
}

main().catch(e => { console.error('ERROR FATAL:', e.message); process.exit(1); });
