// INICIO MODIFICACION: controlador de registro (clientes y cuidadores)
// Replica las validaciones de RegistroClienteForm y RegistroCuidadorForm de Django,
// mas un captcha SVG propio guardado en la sesion.
// Cada rol se guarda en SU coleccion: clientes -> clients, cuidadores -> caregivers
const Client = require('../models/client.model');
const Caregiver = require('../models/caregiver.model');
const Administrator = require('../models/admin.model');
const bcrypt = require('bcrypt');

const ESPECIALIDADES = [
    'Geriatría', 'Enfermería', 'Psicología', 'Fisioterapia', 'Nutrición',
    'Cardiología', 'Oncología', 'Pediatría', 'Demencia',
    'Discapacidad', 'Cuidados Paliativos', 'Terapia Ocupacional',
    'Acompañamiento Terapéutico'
];

/* ---------- CAPTCHA SVG PROPIO ---------- */
// Genera un codigo de 5 caracteres y lo dibuja distorsionado en un SVG.
// La respuesta correcta queda en req.session.captcha para validarla en el servidor.
function generarCaptcha() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    for (let i = 0; i < 5; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    const colores = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let letras = '';
    let x = 22;
    for (const c of codigo) {
        const rot = Math.floor(Math.random() * 44) - 22;
        const y = 46 + Math.floor(Math.random() * 14) - 7;
        const tam = 30 + Math.floor(Math.random() * 8);
        const color = colores[Math.floor(Math.random() * colores.length)];
        letras += `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="${tam}" font-weight="bold" fill="${color}" transform="rotate(${rot} ${x} ${y})">${c}</text>`;
        x += 45;
    }
    let ruido = '';
    for (let i = 0; i < 5; i++) {
        const x1 = Math.floor(Math.random() * 250);
        const y1 = Math.floor(Math.random() * 70);
        const x2 = Math.floor(Math.random() * 250);
        const y2 = Math.floor(Math.random() * 70);
        const color = colores[Math.floor(Math.random() * colores.length)];
        ruido += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.55"/>`;
    }
    for (let i = 0; i < 10; i++) {
        ruido += `<circle cx="${Math.floor(Math.random() * 250)}" cy="${Math.floor(Math.random() * 70)}" r="${1 + Math.random() * 2}" fill="#94a3b8" opacity="0.5"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="70" viewBox="0 0 260 70" role="img" aria-label="Captcha"><rect width="100%" height="100%" rx="10" fill="#f1f5f9"/>${ruido}${letras}</svg>`;
    return { codigo, svg };
}

function prepararVista(req, res, opciones) {
    const { codigo, svg } = generarCaptcha();
    req.session.captcha = codigo; // respuesta guardada en la sesion
    const tipo = opciones.tipo || '';
    // la accion del formulario apunta a la misma URL estilo Django
    const rutaAccion = tipo === 'cuidador' ? '/registro/cuidador'
        : tipo === 'cliente' ? '/registro/cliente' : '/registro';
    res.render('pages/registro', {
        tipo,
        rutaAccion,
        valores: opciones.valores || {},
        errores: opciones.errores || {},
        captchaSvg: svg
    });
}

/* ---------- GET /seleccionar-tipo : tarjetas Busco Cuidador / Soy Cuidador ---------- */
exports.seleccionarTipo = async (req, res) => {
    try {
        res.render('pages/seleccionar');
    } catch (error) {
        res.status(500).send('Error al cargar la pagina');
    }
};

/* ---------- GET /registro/cliente y /registro/cuidador (igual que Django) ---------- */
exports.formCliente = async (req, res) => {
    try {
        await prepararVista(req, res, { tipo: 'cliente' });
    } catch (error) {
        res.status(500).send('Error al cargar el registro');
    }
};

exports.formCuidador = async (req, res) => {
    try {
        await prepararVista(req, res, { tipo: 'cuidador' });
    } catch (error) {
        res.status(500).send('Error al cargar el registro');
    }
};

/* ---------- GET /captcha : nuevo dibujo sin recargar la pagina ---------- */
exports.refrescarCaptcha = async (req, res) => {
    try {
        const { codigo, svg } = generarCaptcha();
        req.session.captcha = codigo;
        res.json({ svg });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo generar el captcha' });
    }
};

/* ---------- POST /registro/cliente y /registro/cuidador ---------- */
async function procesarRegistro(req, res, tipo) {
    try {
        const v = req.body;
        const errores = {};
        const valores = {
            nombre: v.nombre || '', apellido: v.apellido || '', correo: v.correo || '',
            telefono: v.telefono || '', fechaNacimiento: v.fechaNacimiento || '',
            especialidades: v.especialidades || '', experiencia: v.experiencia || ''
        };

        // 1. Captcha (comparacion en el servidor contra la sesion)
        const escrito = String(v.captcha || '').trim().toUpperCase();
        if (!escrito) {
            errores.captcha = 'Escribe el texto de la imagen.';
        } else if (!req.session.captcha || escrito !== String(req.session.captcha).toUpperCase()) {
            errores.captcha = 'El texto no coincide con la imagen. Intenta de nuevo.';
        }

        // 2. Nombre y apellido: minimo 3 letras, sin numeros (igual a Django)
        const nombre = String(v.nombre || '').trim();
        if (nombre.length < 3) errores.nombre = 'El nombre debe tener mínimo 3 letras.';
        else if (/\d/.test(nombre)) errores.nombre = 'El nombre no puede contener números.';

        const apellido = String(v.apellido || '').trim();
        if (apellido.length < 3) errores.apellido = 'El apellido debe tener mínimo 3 letras.';
        else if (/\d/.test(apellido)) errores.apellido = 'El apellido no puede contener números.';

        // 3. Correo: formato estricto + unico (se revisa en las tres colecciones)
        const correo = String(v.correo || '').trim().toLowerCase();
        if (!/^[A-Za-z0-9._%+-]{3,}@[A-Za-z]{3,}\.[A-Za-z]{2,}$/.test(correo)) {
            errores.correo = 'El correo debe tener mínimo 3 letras antes del @, mínimo 3 después del @, un punto y al menos 2 letras después del punto';
        } else {
            const repetido = await Administrator.findOne({ email: correo })
                || await Client.findOne({ email: correo })
                || await Caregiver.findOne({ email: correo });
            if (repetido) errores.correo = 'Este correo ya está registrado';
        }

        // 4. Fecha de nacimiento: mayor de 18 anos (igual a Django)
        let fecha = null;
        if (v.fechaNacimiento) {
            fecha = new Date(String(v.fechaNacimiento));
            if (isNaN(fecha.getTime())) {
                errores.fechaNacimiento = 'Fecha inválida.';
            } else {
                const hoy = new Date();
                let edad = hoy.getFullYear() - fecha.getFullYear();
                const mes = hoy.getMonth() - fecha.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
                if (edad < 18) errores.fechaNacimiento = 'No cuenta con el rango de edad permitido';
            }
        }

        // 5. Campos propios del cuidador
        const telefono = String(v.telefono || '').trim();
        const especialidades = String(v.especialidades || '').trim();
        const experiencia = String(v.experiencia || '').trim();
        if (tipo === 'cuidador') {
            if (!/^\d{10}$/.test(telefono)) errores.telefono = 'El teléfono debe tener exactamente 10 números.';
            if (!especialidades || !ESPECIALIDADES.includes(especialidades)) errores.especialidades = 'La especialidad es obligatoria.';
            if (experiencia.length < 5) errores.experiencia = 'La experiencia debe tener mínimo 5 caracteres.';
            else if (experiencia.length > 200) errores.experiencia = 'La experiencia no puede superar 200 caracteres.';
        }

        // 6. Contrasenas (igual a Django): numero, mayuscula, caracter especial, coincidir
        const password1 = String(v.password1 || '');
        if (!/\d/.test(password1)) errores.password1 = 'La contraseña debe tener al menos un número';
        else if (!/[A-Z]/.test(password1)) errores.password1 = 'La contraseña debe tener al menos una mayúscula';
        else if (!/[^A-Za-z0-9]/.test(password1)) errores.password1 = 'La contraseña debe tener al menos un carácter especial';

        if (String(v.password2 || '') !== password1) errores.password2 = 'Las contraseñas no son iguales';

        // 7. Terminos
        if (!v.terminos) errores.terminos = 'Debes seleccionar la casilla de términos y condiciones';

        // Si algo fallo se vuelve a mostrar el formulario con los mensajes
        if (Object.keys(errores).length > 0) {
            return await prepararVista(req, res, { tipo, errores, valores });
        }

        // 8. Se guarda SOLO como cliente o cuidador, cada uno en SU coleccion.
        //    Nunca se puede registrar un admin.
        // INICIO MODIFICACION: clientes -> clients | cuidadores -> caregivers
        const hash = await bcrypt.hash(password1, 10);
        let nuevo;
        if (tipo === 'cuidador') {
            nuevo = new Caregiver({
                name: nombre,
                apellido: apellido,
                email: correo,
                password: hash,
                role: 'cuidador',
                telefono: telefono,
                especialidad: especialidades,
                especialidades: especialidades,
                experiencia: experiencia,
                fechaNacimiento: fecha
            });
        } else {
            nuevo = new Client({
                name: nombre,
                apellido: apellido,
                email: correo,
                password: hash,
                role: 'cliente',
                fechaNacimiento: fecha
            });
        }
        await nuevo.save();

        // 9. Lo deja logueado, igual que hace Django despues del registro
        req.session.usuario = {
            id: nuevo._id,
            name: nuevo.name,
            role: tipo,
            origen: tipo === 'cuidador' ? 'caregiver' : 'client'
        };
        delete req.session.captcha;
        // INICIO MODIFICACION: cada rol entra a su dashboard, igual que en Django
        res.redirect(tipo === 'cuidador' ? '/dashboard-cuidador' : '/dashboard-cliente');
        // FIN MODIFICACION
        // FIN MODIFICACION
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).send('Error al crear la cuenta');
    }
}

exports.registrarCliente = (req, res) => procesarRegistro(req, res, 'cliente');
exports.registrarCuidador = (req, res) => procesarRegistro(req, res, 'cuidador');
// FIN MODIFICACION
