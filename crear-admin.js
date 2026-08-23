/* ============================================================
   ARCHIVO NUEVO COMPLETO
   crear-admin.js
   Es nuestro equivalente al "python manage.py createsuperuser"
   de Django. Crea un usuario con role 'admin' en MongoDB.

   Dos formas de usarlo:

   1) Interactivo (pregunta en la terminal):
        node crear-admin.js

   2) Con argumentos (rapido para pruebas):
        node crear-admin.js "Admin CuidArte" admin@cuidarte.com MiClave123
   ============================================================ */

require('dotenv').config();
require('./config/connectiondb');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

// INICIO MODIFICACION: los admins viven en 'administrators'; clientes y
// cuidadores tienen sus propias colecciones, ya no existe 'users'
const Administrator = require('./models/admin.model');
const Client = require('./models/client.model');
const Caregiver = require('./models/caregiver.model');
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

    let intentos = 0;
    while (mongoose.connection.readyState !== 1 && intentos < 30) {
        await new Promise(r => setTimeout(r, 1000));
        intentos++;
    }
    if (mongoose.connection.readyState !== 1) {
        console.error('[ERROR] No se pudo conectar a MongoDB.');
        process.exit(1);
    }

    // 2. Si el correo ya existe como admin, lo actualiza
    // INICIO MODIFICACION: ya no se mueve nada desde users (esa coleccion no existe)
    const existente = await Administrator.findOne({ email: correo.toLowerCase() });
    if (!existente) {
        const enClient = await Client.findOne({ email: correo.toLowerCase() });
        const enCaregiver = await Caregiver.findOne({ email: correo.toLowerCase() });
        if (enClient || enCaregiver) {
            console.error('[ERROR] Ese correo ya esta registrado como cliente o cuidador.');
            process.exit(1);
        }
    }
    if (existente) {
        existente.name = nombre;
        existente.password = await bcrypt.hash(clave, 10); // 10 = rondas de hash
        await existente.save();
        console.log(`[OK] El administrador "${correo}" ya existia y fue ACTUALIZADO.`);
    } else {
        const hash = await bcrypt.hash(clave, 10);
        await Administrator.create({
            name: nombre,
            email: correo.toLowerCase(),
            password: hash,
            role: 'admin'
        });
        console.log(`[OK] Administrador creado en 'administrators': ${nombre} <${correo}>`);
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
