/* ============================================================
   ARCHIVO NUEVO COMPLETO
   crear-admin.js
   Es nuestro equivalente al "python manage.py createsuperuser"
   de Django. Crea un usuario con role 'admin' en Supabase.

   Dos formas de usarlo:

   1) Interactivo (pregunta en la terminal):
        node crear-admin.js

   2) Con argumentos (rapido para pruebas):
        node crear-admin.js "Admin CuidArte" admin@cuidarte.com MiClave123
   ============================================================ */

require('dotenv').config();
const bcrypt = require('bcrypt');
const readline = require('readline');
const supabase = require('./config/supabase');
// INICIO MODIFICACION: File System (leer, escribir, borrar, leerPermisos)
const fileSystem = require('./utils/fileSystem');
// FIN MODIFICACION

// Pregunta por consola
function preguntar(rl, texto) {
    return new Promise(resolve => {
        rl.question(texto, respuesta => resolve(respuesta.trim()));
    });
}

async function crearAdmin(nombre, correo, clave) {
    // 1. Validaciones basicas
    if (!nombre || !correo || !clave) {
        console.error('[ERROR] Nombre, correo y contrasena son obligatorios.');
        process.exit(1);
    }
    if (clave.length < 6) {
        console.error('[ERROR] La contrasena debe tener al menos 6 caracteres.');
        process.exit(1);
    }

    // 2. Si el correo ya existe como admin, lo actualiza
    const { data: existente } = await supabase.from('administrators')
        .select('*').eq('email', correo.toLowerCase()).maybeSingle();
    if (!existente) {
        const { data: enClient } = await supabase.from('clients').select('id').eq('email', correo.toLowerCase()).maybeSingle();
        const { data: enCaregiver } = await supabase.from('caregivers').select('id').eq('email', correo.toLowerCase()).maybeSingle();
        if (enClient || enCaregiver) {
            console.error('[ERROR] Ese correo ya esta registrado como cliente o cuidador.');
            process.exit(1);
        }
    }
    if (existente) {
        const hash = await bcrypt.hash(clave, 10);
        await supabase.from('administrators').update({ name: nombre, password: hash })
            .eq('id', existente.id);
        console.log(`[OK] El administrador "${correo}" ya existia y fue ACTUALIZADO.`);
        // INICIO MODIFICACION: guarda en app.log la actualizacion del admin (File System)
        fileSystem.escribir(`Administrador actualizado: ${nombre} <${correo}>`);
        // FIN MODIFICACION
    } else {
        const hash = await bcrypt.hash(clave, 10);
        await supabase.from('administrators').insert({
            name: nombre,
            email: correo.toLowerCase(),
            password: hash,
            role: 'admin'
        });
        console.log(`[OK] Administrador creado en 'administrators': ${nombre} <${correo}>`);
        // INICIO MODIFICACION: guarda en app.log la creacion del admin (File System)
        fileSystem.escribir(`Administrador creado: ${nombre} <${correo}>`);
        // FIN MODIFICACION
    }

    console.log('[INFO] En la BD solo quedo el HASH, nunca la contrasena real.');
    process.exit(0);
}

// Decide si corre con argumentos o en modo interactivo
const args = process.argv.slice(2);
if (args.length >= 3) {
    crearAdmin(args[0], args[1], args[2]);
} else {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    (async () => {
        console.log('=== Crear administrador CuidArte ===');
        const nombre = await preguntar(rl, 'Nombre completo: ');
        const correo = await preguntar(rl, 'Correo electronico: ');
        const clave = await preguntar(rl, 'Contrasena (min 6 caracteres): ');
        rl.close();
        await crearAdmin(nombre, correo, clave);
    })();
}
