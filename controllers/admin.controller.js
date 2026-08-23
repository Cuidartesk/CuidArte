/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/admin.controller.js
   Logica del panel de administrador, siguiendo el mismo estilo
   de los demas controllers del proyecto (profe nodemongoose1):
   el router solo declara rutas y aqui va todo el trabajo.
   ============================================================ */

const Product = require('../models/product.model');
const Service = require('../models/service.model');
// INICIO MODIFICACION: cada rol vive en su propia coleccion
const Administrator = require('../models/admin.model');
const Client = require('../models/client.model');
const Caregiver = require('../models/caregiver.model');
// FIN MODIFICACION

/* ===================== DASHBOARD ===================== */

// Muestra el panel principal con los contadores desde MongoDB
exports.dashboard = async (req, res) => {
    try {
        // INICIO MODIFICACION: usuarios = clientes + cuidadores (colecciones separadas)
        const [totalClientes, totalCuidadores, totalServicios, totalProductos] =
            await Promise.all([
                Client.countDocuments(),
                Caregiver.countDocuments(),
                Service.countDocuments(),
                Product.countDocuments()
            ]);
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
// INICIO MODIFICACION: se busca en Administrator, no en User
exports.perfil = async (req, res) => {
    try {
        const usuario = await Administrator.findOne({ _id: req.session.usuario.id }).lean();
        res.render('pages/admin/perfil', { usuario });
    } catch (error) {
        res.redirect('/admin');
    }
};

// Formulario para editar el perfil del administrador
exports.formEditarPerfil = async (req, res) => {
    try {
        const usuario = await Administrator.findOne({ _id: req.session.usuario.id }).lean();
        res.render('pages/admin/perfil_form', { usuario });
    } catch (error) {
        res.redirect('/admin/perfil');
    }
};

// Guarda los cambios del perfil (usuario, nombre, apellido, correo, fecha de nacimiento)
exports.actualizarPerfil = async (req, res) => {
    try {
        // si cambia el correo, verificar que otra cuenta no lo tenga ya
        // INICIO MODIFICACION: se revisa en las tres colecciones
        const correoRepetido = await Administrator.findOne({
            email: req.body.correo.toLowerCase(),
            _id: { $ne: req.session.usuario.id }
        })
            || await Client.findOne({ email: req.body.correo.toLowerCase() })
            || await Caregiver.findOne({ email: req.body.correo.toLowerCase() });
        if (correoRepetido) {
            const actual = await Administrator.findOne({ _id: req.session.usuario.id }).lean();
            return res.status(400).render('pages/admin/perfil_form', {
                usuario: actual,
                error: 'Ese correo ya esta en uso por otra cuenta.'
            });
        }

        // igual que en Django: el nombre de usuario no puede repetirse
        let nuevoUsuario = (req.body.usuario || '').trim();
        if (nuevoUsuario) {
            const usuarioRepetido = await Administrator.findOne({
                usuario: nuevoUsuario,
                _id: { $ne: req.session.usuario.id }
            });
            if (usuarioRepetido) {
                const actual = await Administrator.findOne({ _id: req.session.usuario.id }).lean();
                return res.status(400).render('pages/admin/perfil_form', {
                    usuario: actual,
                    error: 'Ese nombre de usuario ya esta en uso.'
                });
            }
        }

        await Administrator.findOneAndUpdate(
            { _id: req.session.usuario.id },
            {
                usuario: nuevoUsuario || undefined,
                name: req.body.nombre,
                apellido: req.body.apellido || '',
                email: req.body.correo.toLowerCase(),
                fechaNacimiento: req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento) : null
            },
            { new: true }
        );
        res.redirect('/admin/perfil');
    } catch (error) {
        res.status(400).send('Error al actualizar el perfil: ' + error.message);
    }
};

/* ===================== PRODUCTOS ===================== */

// Lista todos los productos en la tabla del admin
exports.listaProductos = async (req, res) => {
    try {
        const productos = await Product.find({}).lean();
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
        const producto = await Product.findOne({ _id: req.params.id }).lean();
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
        await Product.create({
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            stock: Number(req.body.stock),
            category: req.body.category,
            imageData: req.body.imageData || '',
            imageType: req.body.imageData ? 'jpeg' : '',
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
        await Product.findOneAndUpdate(
            { _id: req.params.id },
            {
                name: req.body.name,
                description: req.body.description,
                price: Number(req.body.price),
                stock: Number(req.body.stock),
                category: req.body.category,
                // si vino una imagen nueva la reemplaza; si no, conserva la anterior
                ...(req.body.imageData ? { imageData: req.body.imageData, imageType: 'jpeg' } : {}),
                activo: req.body.activo === 'on'
            },
            { new: true }
        );
        res.redirect('/admin/productos');
    } catch (error) {
        res.status(400).send('Error al actualizar el producto: ' + error.message);
    }
};

// Elimina un producto
exports.eliminarProducto = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin/productos');
    } catch (error) {
        res.status(500).send('Error al eliminar el producto');
    }
};

/* ===================== SERVICIOS ===================== */

// Lista todos los servicios en la tabla del admin
exports.listaServicios = async (req, res) => {
    try {
        const servicios = await Service.find({}).lean();
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
        const servicio = await Service.findOne({ _id: req.params.id }).lean();
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
        await Service.create({
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            imageData: req.body.imageData || '',
            imageType: req.body.imageData ? 'jpeg' : '',
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
        await Service.findOneAndUpdate(
            { _id: req.params.id },
            {
                name: req.body.name,
                description: req.body.description,
                price: Number(req.body.price),
                ...(req.body.imageData ? { imageData: req.body.imageData, imageType: 'jpeg' } : {}),
                activo: req.body.activo === 'on'
            },
            { new: true }
        );
        res.redirect('/admin/servicios');
    } catch (error) {
        res.status(400).send('Error al actualizar el servicio: ' + error.message);
    }
};

// Elimina un servicio
exports.eliminarServicio = async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.redirect('/admin/servicios');
    } catch (error) {
        res.status(500).send('Error al eliminar el servicio');
    }
};
