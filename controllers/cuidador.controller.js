/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/cuidador.controller.js
   Logica del dashboard del cuidador, portada de Django:
   dashboard_cuidador, solicitudes_cuidador, clientes_cuidador,
   perfil_cuidador y editar_perfil_cuidador.
   Estilo del profe: el router solo declara rutas y aqui va todo.
   ============================================================ */

// INICIO MODIFICACION: cada rol vive en su propia coleccion
const Caregiver = require('../models/caregiver.model');
const Client = require('../models/client.model');
const Administrator = require('../models/admin.model');
const Solicitud = require('../models/solicitud.model');
// FIN MODIFICACION

// Edad calculada igual que en Django (perfil.edad)
function calcularEdad(fecha) {
    if (!fecha) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
    return edad;
}

/* ===================== DASHBOARD ===================== */

// INICIO MODIFICACION: pantalla principal del cuidador con sus 3 tarjetas
exports.dashboard = async (req, res) => {
    try {
        res.render('pages/dashboard_cuidador');
    } catch (error) {
        res.redirect('/');
    }
};
// FIN MODIFICACION

/* ===================== SOLICITUDES ===================== */

// Lista las solicitudes recibidas por el cuidador logueado
// INICIO MODIFICACION: portado de solicitudes_cuidador de Django
exports.solicitudes = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ cuidador: req.session.usuario.id })
            .populate('cliente')
            .sort({ createdAt: -1 })
            .lean();
        res.render('pages/solicitudes_cuidador', { solicitudes });
    } catch (error) {
        res.render('pages/solicitudes_cuidador', { solicitudes: [] });
    }
};

// Acepta una solicitud (boton funcional extra al portarlo)
exports.aceptarSolicitud = async (req, res) => {
    try {
        await Solicitud.findOneAndUpdate(
            { _id: req.params.id, cuidador: req.session.usuario.id },
            { estado: 'aceptada' }
        );
        res.redirect('/solicitudes');
    } catch (error) {
        res.redirect('/solicitudes');
    }
};

// Rechaza una solicitud
exports.rechazarSolicitud = async (req, res) => {
    try {
        await Solicitud.findOneAndUpdate(
            { _id: req.params.id, cuidador: req.session.usuario.id },
            { estado: 'rechazada' }
        );
        res.redirect('/solicitudes');
    } catch (error) {
        res.redirect('/solicitudes');
    }
};
// FIN MODIFICACION

/* ===================== CLIENTES ===================== */

// Muestra los clientes registrados en la plataforma
// INICIO MODIFICACION: portado de clientes_cuidador de Django
exports.clientes = async (req, res) => {
    try {
        const clientes = await Client.find().lean();
        const lista = clientes.map(c => ({ ...c, edad: calcularEdad(c.fechaNacimiento) }));
        res.render('pages/clientes_cuidador', { clientes: lista });
    } catch (error) {
        res.render('pages/clientes_cuidador', { clientes: [] });
    }
};
// FIN MODIFICACION

/* ===================== PERFIL ===================== */

// INICIO MODIFICACION: perfil profesional del cuidador, portado de perfil_cuidador.html
exports.perfil = async (req, res) => {
    try {
        const usuario = await Caregiver.findOne({ _id: req.session.usuario.id }).lean();
        if (!usuario) return res.redirect('/');
        usuario.edad = calcularEdad(usuario.fechaNacimiento);
        res.render('pages/perfil_cuidador', {
            usuario,
            mensaje: req.query.ok ? '✔ Perfil actualizado correctamente' : null
        });
    } catch (error) {
        res.redirect('/');
    }
};
// FIN MODIFICACION

// Formulario para editar el perfil del cuidador
// INICIO MODIFICACION: portado de editar_perfil_cuidador de Django
exports.formEditarPerfil = async (req, res) => {
    try {
        const usuario = await Caregiver.findOne({ _id: req.session.usuario.id }).lean();
        if (!usuario) return res.redirect('/');
        res.render('pages/editar_perfil_cuidador', { usuario, errores: {} });
    } catch (error) {
        res.redirect('/perfil-cuidador');
    }
};

// Guarda los cambios (validaciones iguales a los formularios de Django)
exports.actualizarPerfil = async (req, res) => {
    try {
        const usuario = await Caregiver.findOne({ _id: req.session.usuario.id }).lean();
        if (!usuario) return res.redirect('/');

        const v = req.body;
        const errores = {};

        // Validaciones iguales a PerfilPersonalForm / PerfilProfesionalForm
        const nombre = String(v.nombre || '').trim();
        if (nombre.length < 3) errores.nombre = 'El nombre debe tener mínimo 3 letras.';
        else if (/\d/.test(nombre)) errores.nombre = 'El nombre no puede contener números.';

        const apellido = String(v.apellido || '').trim();
        if (apellido.length < 3) errores.apellido = 'El apellido debe tener mínimo 3 letras.';
        else if (/\d/.test(apellido)) errores.apellido = 'El apellido no puede contener números.';

        const correo = String(v.correo || '').trim().toLowerCase();
        if (!/^[A-Za-z0-9._%+-]{3,}@[A-Za-z]{3,}\.[A-Za-z]{2,}$/.test(correo)) {
            errores.correo = 'Correo inválido.';
        } else {
            const repetido = await Caregiver.findOne({ email: correo, _id: { $ne: usuario._id } })
                || await Administrator.findOne({ email: correo })
                || await Client.findOne({ email: correo });
            if (repetido) errores.correo = 'Este correo ya está registrado';
        }

        const telefono = String(v.telefono || '').trim();
        if (!/^\d{10}$/.test(telefono)) errores.telefono = 'El teléfono debe tener exactamente 10 números.';

        // INICIO MODIFICACION: cedula opcional pero restringida:
        // minimo 6 y maximo 10 caracteres, unicamente numeros (0-9);
        // no se permiten letras, puntos, comas ni guiones
        const cedula = String(v.cedula || '').trim().replace(/\s/g, '');
        if (cedula && !/^\d{6,10}$/.test(cedula)) {
            if (!/^\d*$/.test(cedula)) {
                errores.cedula = 'La cédula solo puede contener números (sin letras, puntos, comas ni guiones).';
            } else {
                errores.cedula = 'La cédula debe tener entre 6 y 10 números.';
            }
        }
        // FIN MODIFICACION

        let fecha = usuario.fechaNacimiento;
        if (v.fechaNacimiento) {
            fecha = new Date(String(v.fechaNacimiento));
            if (isNaN(fecha.getTime())) errores.fechaNacimiento = 'Fecha inválida.';
        }

        const experiencia = String(v.experiencia || '').trim();
        if (experiencia.length > 0 && experiencia.length < 5) errores.experiencia = 'La experiencia debe tener mínimo 5 caracteres.';
        else if (experiencia.length > 200) errores.experiencia = 'La experiencia no puede superar 200 caracteres.';

        // si algo fallo se vuelve a mostrar el formulario con mensajes
        if (Object.keys(errores).length > 0) {
            return res.status(400).render('pages/editar_perfil_cuidador', {
                usuario: { ...usuario, ...v },
                errores
            });
        }

        // foto nueva solo si el formulario trajo una (viaje en Base64)
        const cambios = {
            name: nombre,
            apellido: apellido,
            email: correo,
            telefono: telefono,
            direccion: String(v.direccion || '').trim(),
            cedula: cedula, // ya validada (6-10 numeros)
            especialidad: String(v.especialidades || '').trim(), // se guarda en ambos campos
            especialidades: String(v.especialidades || '').trim(),
            experiencia: experiencia,
            fechaNacimiento: fecha
        };
        if (v.fotoData && String(v.fotoData).startsWith('data:image')) {
            cambios.foto = v.fotoData;
            cambios.fotoTipo = 'jpeg';
        }

        await Caregiver.findOneAndUpdate({ _id: usuario._id }, cambios);
        res.redirect('/perfil-cuidador?ok=1');
    } catch (error) {
        console.error('Error actualizando perfil cuidador:', error);
        res.status(400).send('Error al actualizar el perfil: ' + error.message);
    }
};
// FIN MODIFICACION
