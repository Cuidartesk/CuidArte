require('dotenv').config();
require('./config/connectiondb');
const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const app = express();
const routes = require('./router/enrutamiento.router');
const caregiverController = require('./controllers/caregiver.controller');
const Service = require('./models/service.model');
const Product = require('./models/product.model');
const productController = require('./controllers/product.controller');
const PORT = process.env.PORT || 8000;

/* ===================== INICIO MODIFICACION 1: SESIONES Y LOGIN ===================== */
// Librerias para manejar sesiones (quien esta logueado) y contrasenas cifradas
const session = require('express-session');
const bcrypt = require('bcrypt');
// INICIO MODIFICACION: cada rol vive en su propia coleccion
const Administrator = require('./models/admin.model');
const Client = require('./models/client.model');
const Caregiver = require('./models/caregiver.model');
// FIN MODIFICACION
/* ====================== FIN MODIFICACION 1: SESIONES Y LOGIN ======================= */

// Parseo de peticiones: JSON (API) y urlencoded (formularios HTML)
// INICIO MODIFICACION: limite subido a 25mb porque las imagenes viajan
// dentro del formulario como texto Base64 y el limite por defecto (100kb) las rechaza
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// FIN MODIFICACION

// Archivos estáticos (CSS, JS, imágenes del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// Permite usar PUT y DELETE desde formularios HTML con ?_method=PUT o ?_method=DELETE
app.use(methodOverride('_method'));

/* ===================== INICIO MODIFICACION 2: SESIONES ===================== */
// Activa las sesiones: cada navegador recibe una cookie con su id de sesion.
// Con eso el servidor "recuerda" quien inicio sesion entre pagina y pagina.
app.use(session({
    secret: process.env.SESSION_SECRET || 'cambiame-en-produccion',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // la sesion dura 2 horas
}));

// Pone la ruta actual a disposición de todas las vistas (para resaltar el enlace activo)
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    // INICIO MODIFICACION: formato de precios COP con puntos de miles ($12.000)
    res.locals.formatearPrecio = function (valor) {
        const n = Math.round(Number(valor) || 0);
        return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
    // FIN MODIFICACION
    // INICIO MODIFICACION: mensajes "flash" iguales al sistema de messages de Django
    if (req.session.flashMensaje) {
        res.locals.mensaje = req.session.flashMensaje;
        delete req.session.flashMensaje;
    } else {
        res.locals.mensaje = null;
    }
    // FIN MODIFICACION
    // INICIO MODIFICACION: contador del carrito en sesion, igual que el
    // context_processor de Django (se usa para el badge del menu y la tienda)
    const carrito = req.session.carrito || {};
    res.locals.carritoCount = Object.values(carrito).reduce((a, b) => a + b, 0);
    res.locals.carritoTotal = 0;
    next();
    // FIN MODIFICACION
});


// Pone el usuario logueado (si existe) disponible en TODAS las vistas EJS.
// INICIO MODIFICACION: se consulta fresco desde MongoDB en cada peticion,
// igual que request.user en Django. La sesion guarda 'origen' para saber
// en que coleccion buscar: administrators | caregivers | clients
app.use(async (req, res, next) => {
    if (req.session.usuario && req.session.usuario.id) {
        let u = null;
        if (req.session.usuario.origen === 'administrator') {
            u = await Administrator.findOne({ _id: req.session.usuario.id }).lean();
        } else if (req.session.usuario.origen === 'caregiver') {
            u = await Caregiver.findOne({ _id: req.session.usuario.id }).lean();
        } else if (req.session.usuario.origen === 'client') {
            u = await Client.findOne({ _id: req.session.usuario.id }).lean();
        }
        res.locals.usuario = u || null;
    } else {
        res.locals.usuario = null;
    }
    next();
});
// FIN MODIFICACION
/* ====================== FIN MODIFICACION 2: SESIONES ======================= */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Páginas web
app.get('/', caregiverController.home);
app.get('/contactanos', (req, res) => res.render('pages/contactanos'));
app.get('/sobre', (req, res) => res.render('pages/sobre'));
// INICIO MODIFICACION: la tienda se maneja en router/tienda.router.js
// (categorias, carrito y compra, igual al Django)
app.use(require('./router/tienda.router'));
// FIN MODIFICACION
app.get('/ingresar', (req, res) => res.render('pages/ingresar'));

/* ===================== INICIO MODIFICACION 5: REGISTRO ===================== */
// Registro de clientes y cuidadores con captcha SVG (igual a registro.html de Django)
const rutasRegistro = require('./router/registro.router');
app.use(rutasRegistro);
/* ====================== FIN MODIFICACION 5: REGISTRO ======================= */

/* ===================== INICIO MODIFICACION 3: LOGIN Y LOGOUT ===================== */
// Procesa el formulario de /ingresar (POST /login)
app.post('/login', async (req, res) => {
  try {
    // INICIO MODIFICACION: se recorta por si el correo se pega con espacios
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    // 1. Busca en las tres colecciones: administradores, cuidadores y clientes
    // INICIO MODIFICACION: cada rol vive en su propia coleccion
    let user = await Administrator.findOne({ email: String(email).toLowerCase() });
    let origen = 'administrator';
    if (!user) {
      user = await Caregiver.findOne({ email: String(email).toLowerCase() });
      origen = 'caregiver';
    }
    if (!user) {
      user = await Client.findOne({ email: String(email).toLowerCase() });
      origen = 'client';
    }
    if (!user) {
      return res.status(401).send('Correo o contrasena incorrectos');
    }

    // 2. Compara la contrasena escrita contra el HASH guardado en la BD
    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) {
      return res.status(401).send('Correo o contrasena incorrectos');
    }

    // 3. Guarda al usuario en la sesion (a partir de aqui esta "logueado")
    req.session.usuario = {
      id: user._id,
      name: user.name,
      role: user.role,
      origen
    };

    // 4. Redirige segun su rol, igual que Django:
    //    admin -> panel | cuidador -> su dashboard | cliente -> su dashboard
    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    // INICIO MODIFICACION: el cuidador entra a su dashboard
    if (user.role === 'cuidador') {
      return res.redirect('/dashboard-cuidador');
    }
    // FIN MODIFICACION
    // INICIO MODIFICACION: el cliente tambien entra a su dashboard (portado de Django)
    res.redirect('/dashboard-cliente');
    // FIN MODIFICACION
  } catch (error) {
    res.status(500).send('Error al iniciar sesion');
  }
});

// Cierra la sesion
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});
/* ======================= FIN MODIFICACION 3: LOGIN Y LOGOUT ====================== */

/* ===================== INICIO MODIFICACION 4: PANEL ADMIN ===================== */
// Middleware "portero": si quien visita NO es admin, lo saca.
function soloAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.role === 'admin') {
    return next();
  }
  res.redirect('/ingresar');
}

// INICIO MODIFICACION: el placeholder se reemplazo por el CRUD completo.
// Todas las rutas que empiezan con /admin pasan primero por soloAdmin
// y luego las atiende router/admin.router.js (dashboard + CRUD productos/servicios)
const rutasAdmin = require('./router/admin.router');
app.use('/admin', soloAdmin, rutasAdmin);
// FIN MODIFICACION

/* ===================== INICIO MODIFICACION 6: DASHBOARD CUIDADOR ===================== */
// Rutas del cuidador: dashboard, solicitudes, clientes y perfil (igual a Django)
const rutasCuidador = require('./router/cuidador.router');
app.use(rutasCuidador);
/* ====================== FIN MODIFICACION 6: DASHBOARD CUIDADOR ======================= */
/* ======================= FIN MODIFICACION 4: PANEL ADMIN ======================= */

// INICIO MODIFICACION: rutas del cliente (dashboard portado de Django)
const rutasCliente = require('./router/cliente.router');
app.use(rutasCliente);
// FIN MODIFICACION

app.get('/registrarproducto', productController.formulario);
app.get('/servicios', async (req, res) => {
  try {
    const servicios = await Service.find().lean();
    res.render('pages/servicios', { servicios });
  } catch (error) {
    res.status(500).send('Error al cargar los servicios');
  }
});

// API REST
app.use('/api/v1', routes);

app.listen(PORT, () => {
    console.log('Servidor en ejecución en el puerto', PORT);
    console.log(`Disponible en: http://localhost:${PORT}`);
});
