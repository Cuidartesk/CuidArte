/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/cuidador.controller.js
   Logica del dashboard del cuidador, portada de Django con Supabase:
   dashboard_cuidador, solicitudes_cuidador, clientes_cuidador,
   perfil_cuidador y editar_perfil_cuidador.
   ============================================================ */

const supabase = require('../config/supabase');
const { subirImagen } = require('../config/supabase');

// Edad calculada igual que en Django (perfil.edad)
function calcularEdad(fecha) {
    if (!fecha) return null;
    const f = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - f.getFullYear();
    const mes = hoy.getMonth() - f.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
}

/* ===================== DASHBOARD ===================== */

exports.dashboard = async (req, res) => {
    try {
        res.render('pages/dashboard_cuidador');
    } catch (error) {
        res.redirect('/');
    }
};

/* ===================== SOLICITUDES ===================== */

// Lista las solicitudes recibidas por el cuidador logueado
exports.solicitudes = async (req, res) => {
    try {
        const { data: solicitudes } = await supabase.from('solicitudes')
            .select('*, cliente:clients(*)').eq('cuidador', req.session.usuario.id)
            .order('created_at', { ascending: false });
        res.render('pages/solicitudes_cuidador', { solicitudes: solicitudes || [] });
    } catch (error) {
        res.render('pages/solicitudes_cuidador', { solicitudes: [] });
    }
};

// Acepta una solicitud (boton funcional extra al portarlo)
exports.aceptarSolicitud = async (req, res) => {
    try {
        await supabase.from('solicitudes').update({ estado: 'aceptada' })
            .eq('id', req.params.id).eq('cuidador', req.session.usuario.id);
        res.redirect('/solicitudes');
    } catch (error) {
        res.redirect('/solicitudes');
    }
};

// Rechaza una solicitud
exports.rechazarSolicitud = async (req, res) => {
    try {
        await supabase.from('solicitudes').update({ estado: 'rechazada' })
            .eq('id', req.params.id).eq('cuidador', req.session.usuario.id);
        res.redirect('/solicitudes');
    } catch (error) {
        res.redirect('/solicitudes');
    }
};

/* ===================== CLIENTES ===================== */

// Muestra los clientes registrados en la plataforma
exports.clientes = async (req, res) => {
    try {
        const { data: clientes } = await supabase.from('clients').select('*');
        const lista = (clientes || []).map(c => ({ ...c, edad: calcularEdad(c.fecha_nacimiento) }));
        res.render('pages/clientes_cuidador', { clientes: lista });
    } catch (error) {
        res.render('pages/clientes_cuidador', { clientes: [] });
    }
};

/* ===================== PERFIL ===================== */

exports.perfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('caregivers')
            .select('*').eq('id', req.session.usuario.id).single();
        if (!usuario) return res.redirect('/');
        usuario.edad = calcularEdad(usuario.fecha_nacimiento);
        res.render('pages/perfil_cuidador', {
            usuario,
            mensaje: req.query.ok ? '✔ Perfil actualizado correctamente' : null
        });
    } catch (error) {
        res.redirect('/');
    }
};

// Formulario para editar el perfil del cuidador
exports.formEditarPerfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('caregivers')
            .select('*').eq('id', req.session.usuario.id).single();
        if (!usuario) return res.redirect('/');
        res.render('pages/editar_perfil_cuidador', { usuario, errores: {} });
    } catch (error) {
        res.redirect('/perfil-cuidador');
    }
};

// Guarda los cambios (validaciones iguales a los formularios de Django)
exports.actualizarPerfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('caregivers')
            .select('*').eq('id', req.session.usuario.id).single();
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
            const repetido =
                (await supabase.from('caregivers').select('id').neq('id', usuario.id).eq('email', correo).maybeSingle()).data
                || (await supabase.from('administrators').select('id').eq('email', correo).maybeSingle()).data
                || (await supabase.from('clients').select('id').eq('email', correo).maybeSingle()).data;
            if (repetido) errores.correo = 'Este correo ya está registrado';
        }

        const telefono = String(v.telefono || '').trim();
        if (!/^\d{10}$/.test(telefono)) errores.telefono = 'El teléfono debe tener exactamente 10 números.';

        const cedula = String(v.cedula || '').trim().replace(/\s/g, '');
        if (cedula && !/^\d{6,10}$/.test(cedula)) {
            if (!/^\d*$/.test(cedula)) {
                errores.cedula = 'La cédula solo puede contener números (sin letras, puntos, comas ni guiones).';
            } else {
                errores.cedula = 'La cédula debe tener entre 6 y 10 números.';
            }
        }

        let fecha = usuario.fecha_nacimiento;
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
            especialidad: String(v.especialidades || '').trim(),
            especialidades: String(v.especialidades || '').trim(),
            experiencia: experiencia,
            fecha_nacimiento: fecha ? new Date(fecha).toISOString() : null
        };
        if (v.fotoData && String(v.fotoData).startsWith('data:image')) {
            const foto_url = await subirImagen(v.fotoData, 'avatars', nombre || 'cuidador');
            if (foto_url) cambios.foto_url = foto_url;
        }

        await supabase.from('caregivers').update(cambios).eq('id', usuario.id);
        res.redirect('/perfil-cuidador?ok=1');
    } catch (error) {
        console.error('Error actualizando perfil cuidador:', error);
        res.status(400).send('Error al actualizar el perfil: ' + error.message);
    }
};
