/* ============================================================
   ARCHIVO NUEVO COMPLETO
   router/cuidador.router.js
   Rutas del dashboard del cuidador, con las mismas direcciones
   que usa Django (dashboard/cuidador, solicitudes, clientes,
   perfil-cuidador, editar-perfil-cuidador).
   ============================================================ */

const express = require('express');
const router = express.Router();
const cuidadorController = require('../controllers/cuidador.controller');

// INICIO MODIFICACION: portero que solo deja pasar a cuidadores.
// CORRECCION: se aplica RUTA POR RUTA y no con router.use() global,
// porque montado en la raiz interceptaba rutas publicas como /servicios
function soloCuidador(req, res, next) {
    if (req.session.usuario && req.session.usuario.role === 'cuidador') {
        return next();
    }
    res.redirect('/ingresar');
}

router.get('/dashboard-cuidador', soloCuidador, cuidadorController.dashboard);
router.get('/solicitudes', soloCuidador, cuidadorController.solicitudes);
router.post('/solicitudes/:id/aceptar', soloCuidador, cuidadorController.aceptarSolicitud);
router.post('/solicitudes/:id/rechazar', soloCuidador, cuidadorController.rechazarSolicitud);
router.get('/clientes', soloCuidador, cuidadorController.clientes);
router.get('/perfil-cuidador', soloCuidador, cuidadorController.perfil);
router.get('/editar-perfil-cuidador', soloCuidador, cuidadorController.formEditarPerfil);
router.post('/editar-perfil-cuidador', soloCuidador, cuidadorController.actualizarPerfil);
// FIN MODIFICACION

module.exports = router;
