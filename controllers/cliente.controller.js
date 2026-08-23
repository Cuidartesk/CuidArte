/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/cliente.controller.js
   Controlador del cliente portado de Django:
   - dashboard: las 5 tarjetas de dashboard_cliente.html
   - buscarCuidadores: filtro por especialidad (coincidencia parcial)
   - verCuidador / contactarCuidador: ficha y contacto (crea solicitud)
   - misReservas: solicitudes enviadas por el cliente
   ============================================================ */

const Client = require('../models/client.model');
const Caregiver = require('../models/caregiver.model');
const Solicitud = require('../models/solicitud.model');

// calcula la edad desde la fecha de nacimiento
function calcularEdad(fecha) {
    if (!fecha) return null;
    const f = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - f.getFullYear();
    const m = hoy.getMonth() - f.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
}

// Dashboard del cliente (igual a dashboard_cliente.html de Django)
exports.dashboard = async (req, res) => {
    try {
        const usuario = await Client.findOne({ _id: req.session.usuario.id }).lean();
        res.render('pages/dashboard_cliente', { usuario });
    } catch (error) {
        res.redirect('/');
    }
};

// Buscar cuidadores con filtro de especialidad (igual a buscar_cuidadores de Django)
// INICIO MODIFICACION: buscador funcional con coincidencia parcial
exports.buscarCuidadores = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        let filtro = {};
        if (q) {
            // icontains de Django: coincidencia parcial sin importar mayusculas
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filtro = { $or: [{ especialidades: rx }, { especialidad: rx }] };
        }
        const cuidadores = await Caregiver.find(filtro).lean();
        cuidadores.forEach(c => { c.edad = calcularEdad(c.fechaNacimiento); });
        res.render('pages/buscar_cuidadores', { cuidadores, q });
    } catch (error) {
        res.render('pages/buscar_cuidadores', { cuidadores: [], q: '' });
    }
};
// FIN MODIFICACION

// Ficha completa del cuidador (igual a ver_cuidador de Django)
exports.verCuidador = async (req, res) => {
    try {
        const cuidador = await Caregiver.findOne({ _id: req.params.id }).lean();
        if (!cuidador) return res.redirect('/buscar-cuidadores');
        cuidador.edad = calcularEdad(cuidador.fechaNacimiento);
        const yaContactado = await Solicitud.exists({
            cliente: req.session.usuario.id,
            cuidador: cuidador._id
        });
        res.render('pages/ver_cuidador', { c: cuidador, yaContactado: !!yaContactado });
    } catch (error) {
        res.redirect('/buscar-cuidadores');
    }
};

// Contactar cuidador: crea la solicitud (igual a contactar_cuidador de Django)
exports.contactarCuidador = async (req, res) => {
    try {
        const cuidador = await Caregiver.findOne({ _id: req.params.id }).lean();
        if (!cuidador) return res.redirect('/buscar-cuidadores');
        const yaExiste = await Solicitud.exists({
            cliente: req.session.usuario.id,
            cuidador: cuidador._id,
            estado: 'pendiente'
        });
        if (!yaExiste) {
            await Solicitud.create({
                cliente: req.session.usuario.id,
                cuidador: cuidador._id,
                servicio: cuidador.especialidades || cuidador.especialidad || '',
                mensaje: `Hola ${cuidador.name}, me interesa tu servicio de ${cuidador.especialidades || 'cuidado'}.`
            });
        }
        req.session.flashMensaje = { texto: `Solicitud enviada a ${cuidador.name}.`, tipo: 'ok' };
        res.redirect('/mis-reservas');
    } catch (error) {
        res.redirect('/buscar-cuidadores');
    }
};

// Mis reservas: solicitudes que el cliente ha enviado
exports.misReservas = async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ cliente: req.session.usuario.id })
            .populate('cuidador')
            .sort({ createdAt: -1 })
            .lean();
        res.render('pages/mis_reservas', { solicitudes });
    } catch (error) {
        res.render('pages/mis_reservas', { solicitudes: [] });
    }
};

// Mi perfil del cliente (igual a mi_perfil de Django)
// INICIO MODIFICACION
exports.miPerfil = async (req, res) => {
    try {
        const usuario = await Client.findOne({ _id: req.session.usuario.id }).lean();
        res.render('pages/mi_perfil', { usuario });
    } catch (error) {
        res.redirect('/dashboard-cliente');
    }
};
// FIN MODIFICACION

// Mis agendas: modulo de agenda aun no portado
// INICIO MODIFICACION
exports.misAgendas = (req, res) => {
    res.render('pages/mis_agendas');
};
// FIN MODIFICACION
