/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/admin.controller.js
   Logica del panel de administrador, siguiendo el mismo estilo
   de los demas controllers del proyecto (profe nodemongoose1):
   el router solo declara rutas y aqui va todo el trabajo.
   ============================================================ */

const supabase = require('../config/supabase');
const { subirImagen } = require('../config/supabase');

/* ===================== DASHBOARD ===================== */

// Muestra el panel principal con los contadores desde Supabase
exports.dashboard = async (req, res) => {
    try {
        const [rCli, rCare, rServ, rProd] = await Promise.all([
            supabase.from('clients').select('id', { count: 'exact', head: true }),
            supabase.from('caregivers').select('id', { count: 'exact', head: true }),
            supabase.from('services').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true })
        ]);
        const totalClientes = rCli.count || 0;
        const totalCuidadores = rCare.count || 0;
        const totalServicios = rServ.count || 0;
        const totalProductos = rProd.count || 0;
        res.render('pages/admin/dashboard', {
            totalUsuarios: totalClientes + totalCuidadores,
            totalCuidadores,
            totalServicios,
            totalProductos,
            totalMensajes: 0 // modulo de mensajes aun no existe
        });
    } catch (error) {
        res.status(500).send('Error al cargar el panel');
    }
};

/* ===================== PERFIL ===================== */

// Muestra la pagina de perfil del administrador
exports.perfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('administrators')
            .select('*').eq('id', req.session.usuario.id).single();
        res.render('pages/admin/perfil', { usuario });
    } catch (error) {
        res.redirect('/admin');
    }
};

// Formulario para editar el perfil del administrador
exports.formEditarPerfil = async (req, res) => {
    try {
        const { data: usuario } = await supabase.from('administrators')
            .select('*').eq('id', req.session.usuario.id).single();
        res.render('pages/admin/perfil_form', { usuario });
    } catch (error) {
        res.redirect('/admin/perfil');
    }
};

// Guarda los cambios del perfil (usuario, nombre, apellido, correo, fecha de nacimiento)
exports.actualizarPerfil = async (req, res) => {
    try {
        const miId = req.session.usuario.id;

        // si cambia el correo, verificar que otra cuenta no lo tenga ya
        const correoNuevo = req.body.correo.toLowerCase();
        const correoRepetido =
            (await supabase.from('administrators').select('id').neq('id', miId).eq('email', correoNuevo).maybeSingle()).data
            || (await supabase.from('clients').select('id').eq('email', correoNuevo).maybeSingle()).data
            || (await supabase.from('caregivers').select('id').eq('email', correoNuevo).maybeSingle()).data;
        if (correoRepetido) {
            const { data: actual } = await supabase.from('administrators').select('*').eq('id', miId).single();
            return res.status(400).render('pages/admin/perfil_form', {
                usuario: actual,
                error: 'Ese correo ya esta en uso por otra cuenta.'
            });
        }

        // igual que en Django: el nombre de usuario no puede repetirse
        let nuevoUsuario = (req.body.usuario || '').trim();
        if (nuevoUsuario) {
            const { data: usuarioRepetido } = await supabase.from('administrators')
                .select('id').neq('id', miId).eq('usuario', nuevoUsuario).maybeSingle();
            if (usuarioRepetido) {
                const { data: actual } = await supabase.from('administrators').select('*').eq('id', miId).single();
                return res.status(400).render('pages/admin/perfil_form', {
                    usuario: actual,
                    error: 'Ese nombre de usuario ya esta en uso.'
                });
            }
        }

        await supabase.from('administrators').update({
            usuario: nuevoUsuario || null,
            name: req.body.nombre,
            apellido: req.body.apellido || '',
            email: correoNuevo,
            fecha_nacimiento: req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento).toISOString() : null
        }).eq('id', miId);
        res.redirect('/admin/perfil');
    } catch (error) {
        res.status(400).send('Error al actualizar el perfil: ' + error.message);
    }
};

/* ===================== PRODUCTOS ===================== */

// Lista todos los productos en la tabla del admin
exports.listaProductos = async (req, res) => {
    try {
        const { data: productos } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        res.render('pages/admin/productos', { productos });
    } catch (error) {
        res.status(500).send('Error al cargar los productos');
    }
};

// Formulario vacio para crear un producto
exports.formCrearProducto = (req, res) => {
    res.render('pages/admin/producto_form', { accion: 'Crear', producto: {} });
};

// Formulario lleno para editar un producto
exports.formEditarProducto = async (req, res) => {
    try {
        const { data: producto } = await supabase.from('products')
            .select('*').eq('id', req.params.id).maybeSingle();
        if (!producto) {
            return res.redirect('/admin/productos');
        }
        res.render('pages/admin/producto_form', { accion: 'Editar', producto });
    } catch (error) {
        res.redirect('/admin/productos');
    }
};

// Guarda el producto que llega del formulario
exports.guardarProducto = async (req, res) => {
    try {
        const image_url = await subirImagen(req.body.imageData || '', 'cuidarte', req.body.name || 'producto');
        await supabase.from('products').insert({
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            stock: Number(req.body.stock),
            category: req.body.category,
            image_url,
            activo: req.body.activo === 'on'
        });
        res.redirect('/admin/productos');
    } catch (error) {
        res.status(400).send('Error al crear el producto: ' + error.message);
    }
};

// Actualiza un producto existente
exports.actualizarProducto = async (req, res) => {
    try {
        const cambios = {
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            stock: Number(req.body.stock),
            category: req.body.category,
            activo: req.body.activo === 'on'
        };
        // si vino una imagen nueva la reemplaza; si no, conserva la anterior
        if (req.body.imageData && String(req.body.imageData).startsWith('data:image')) {
            const image_url = await subirImagen(req.body.imageData, 'cuidarte', req.body.name || 'producto');
            if (image_url) cambios.image_url = image_url;
        }
        await supabase.from('products').update(cambios).eq('id', req.params.id);
        res.redirect('/admin/productos');
    } catch (error) {
        res.status(400).send('Error al actualizar el producto: ' + error.message);
    }
};

// Elimina un producto
exports.eliminarProducto = async (req, res) => {
    try {
        await supabase.from('products').delete().eq('id', req.params.id);
        res.redirect('/admin/productos');
    } catch (error) {
        res.status(500).send('Error al eliminar el producto');
    }
};

/* ===================== SERVICIOS ===================== */

// Lista todos los servicios en la tabla del admin
exports.listaServicios = async (req, res) => {
    try {
        const { data: servicios } = await supabase.from('services').select('*').order('created_at', { ascending: false });
        res.render('pages/admin/servicios', { servicios });
    } catch (error) {
        res.status(500).send('Error al cargar los servicios');
    }
};

// Formulario vacio para crear un servicio
exports.formCrearServicio = (req, res) => {
    res.render('pages/admin/servicio_form', { accion: 'Crear', servicio: {} });
};

// Formulario lleno para editar un servicio
exports.formEditarServicio = async (req, res) => {
    try {
        const { data: servicio } = await supabase.from('services')
            .select('*').eq('id', req.params.id).maybeSingle();
        if (!servicio) {
            return res.redirect('/admin/servicios');
        }
        res.render('pages/admin/servicio_form', { accion: 'Editar', servicio });
    } catch (error) {
        res.redirect('/admin/servicios');
    }
};

// Guarda el servicio que llega del formulario
exports.guardarServicio = async (req, res) => {
    try {
        const image_url = await subirImagen(req.body.imageData || '', 'cuidarte', req.body.name || 'servicio');
        await supabase.from('services').insert({
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            image_url,
            activo: req.body.activo === 'on'
        });
        res.redirect('/admin/servicios');
    } catch (error) {
        res.status(400).send('Error al crear el servicio: ' + error.message);
    }
};

// Actualiza un servicio existente
exports.actualizarServicio = async (req, res) => {
    try {
        const cambios = {
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            activo: req.body.activo === 'on'
        };
        if (req.body.imageData && String(req.body.imageData).startsWith('data:image')) {
            const image_url = await subirImagen(req.body.imageData, 'cuidarte', req.body.name || 'servicio');
            if (image_url) cambios.image_url = image_url;
        }
        await supabase.from('services').update(cambios).eq('id', req.params.id);
        res.redirect('/admin/servicios');
    } catch (error) {
        res.status(400).send('Error al actualizar el servicio: ' + error.message);
    }
};

// Elimina un servicio
exports.eliminarServicio = async (req, res) => {
    try {
        await supabase.from('services').delete().eq('id', req.params.id);
        res.redirect('/admin/servicios');
    } catch (error) {
        res.status(500).send('Error al eliminar el servicio');
    }
};
