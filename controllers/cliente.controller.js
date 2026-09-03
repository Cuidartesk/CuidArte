/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/cliente.controller.js
   Controlador del cliente portado de Django con Supabase:
   - dashboard: las 5 tarjetas de dashboard_cliente.html
   - buscarCuidadores: filtro por especialidad (coincidencia parcial)
   - verCuidador / contactarCuidador: ficha y contacto (crea solicitud)
   - misReservas: solicitudes enviadas por el cliente
   ============================================================ */

const supabase = require('../config/supabase');

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
        const { data: usuario } = await supabase.from('clients')
            .select('*').eq('id', req.session.usuario.id).single();
        res.render('pages/dashboard_cliente', { usuario });
    } catch (error) {
        res.redirect('/');
    }
};

// Buscar cuidadores con filtro de especialidad (igual a buscar_cuidadores de Django)
exports.buscarCuidadores = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        let query = supabase.from('caregivers').select('*');
        if (q) {
            const rx = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query = query.or(`especialidades.ilike.%${rx}%,especialidad.ilike.%${rx}%`);
        }
        const { data: cuidadores } = await query;
        (cuidadores || []).forEach(c => { c.edad = calcularEdad(c.fecha_nacimiento); });
        res.render('pages/buscar_cuidadores', { cuidadores: cuidadores || [], q });
    } catch (error) {
        res.render('pages/buscar_cuidadores', { cuidadores: [], q: '' });
    }
};

// Ficha completa del cuidador (igual a ver_cuidador de Django)
exports.verCuidador = async (req, res) => {
    try {
        const { data: cuidador } = await supabase.from('caregivers')
            .select('*').eq('id', req.params.id).maybeSingle();
        if (!cuidador) return res.redirect('/buscar-cuidadores');
        cuidador.edad = calcularEdad(cuidador.fecha_nacimiento);
        const { data: exists } = await supabase.from('solicitudes')
            .select('id').eq('cliente', req.session.usuario.id).eq('cuidador', cuidador.id).maybeSingle();
        res.render('pages/ver_cuidador', { c: cuidador, yaContactado: !!exists });
    } catch (error) {
        res.redirect('/buscar-cuidadores');
    }
};

// Contactar cuidador: crea la solicitud (igual a contactar_cuidador de Django)
exports.contactarCuidador = async (req, res) => {
    try {
        const { data: cuidador } = await supabase.from('caregivers')
            .select('*').eq('id', req.params.id).maybeSingle();
        if (!cuidador) return res.redirect('/buscar-cuidadores');
        const { data: yaExiste } = await supabase.from('solicitudes')
            .select('id').eq('cliente', req.session.usuario.id)
            .eq('cuidador', cuidador.id).eq('estado', 'pendiente').maybeSingle();
        if (!yaExiste) {
            await supabase.from('solicitudes').insert({
                cliente: req.session.usuario.id,
                cuidador: cuidador.id,
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
        const { data: solicitudes } = await supabase.from('solicitudes')
            .select('*, cuidador:caregivers(*)').eq('cliente', req.session.usuario.id)
            .order('created_at', { ascending: false });
        res.render('pages/mis_reservas', { solicitudes: solicitudes || [] });
    } catch (error) {
        res.render('pages/mis_reservas', { solicitudes: [] });
    }
};

// Mi perfil del cliente (igual a mi_perfil de Django)
exports.miPerfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('clients')
            .select('*').eq('id', req.session.usuario.id).single();
        res.render('pages/mi_perfil', { usuario });
    } catch (error) {
        res.redirect('/dashboard-cliente');
    }
};

// Mis agendas: modulo de agenda aun no portado
exports.misAgendas = (req, res) => {
    res.render('pages/mis_agendas');
};
