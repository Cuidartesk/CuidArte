/* ============================================================
   ARCHIVO NUEVO COMPLETO
   restablecer-clave.js
   Es nuestro equivalente al "python manage.py changepassword"
   de Django. Asigna una contrasena nueva (con hash bcrypt) a
   cualquier cuenta, buscandola en las tres tablas.

   Uso:
        node restablecer-clave.js correo@ejemplo.com NuevaClave123
   ============================================================ */

require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('./config/supabase');

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

  const hash = await bcrypt.hash(clave, 10);
  const emailBuscado = correo.trim().toLowerCase();

  // Busca en las tres tablas y actualiza donde exista
  const tablas = [
    ['administrator', 'administrators'],
    ['caregiver', 'caregivers'],
    ['client', 'clients']
  ];
  for (const [nombre, tabla] of tablas) {
    const { data: cuenta } = await supabase.from(tabla).select('*').eq('email', emailBuscado).maybeSingle();
    if (cuenta) {
      await supabase.from(tabla).update({ password: hash }).eq('id', cuenta.id);
      console.log(`[OK] Contrasena actualizada para ${emailBuscado} (tabla: ${tabla})`);
      console.log('[INFO] En la BD solo quedo el HASH, nunca la contrasena real.');
      process.exit(0);
    }
  }

  console.error(`[ERROR] No existe ninguna cuenta con el correo ${emailBuscado}.`);
  process.exit(1);
}

main().catch(e => { console.error('ERROR FATAL:', e.message); process.exit(1); });
