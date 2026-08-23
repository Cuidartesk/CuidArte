/* ============================================================
   ARCHIVO REESCRITO (refactorizado al estilo del profe)
   router/admin.router.js
   Solo declara rutas y delega en admin.controller.
   Todas estas rutas llegan aqui protegidas por soloAdmin
   (montado en index.js con app.use('/admin', soloAdmin, ...)).
   ============================================================ */

const { Router } = require('express');
const router = Router();

const adminController = require('../controllers/admin.controller');

/* ===================== DASHBOARD ===================== */
router.get('/', adminController.dashboard);

/* ===================== PERFIL (igual al Django) ===================== */
router.get('/perfil', adminController.perfil);
router.get('/perfil/editar', adminController.formEditarPerfil);
router.put('/perfil', adminController.actualizarPerfil);

/* ===================== PRODUCTOS ===================== */
router.get('/productos', adminController.listaProductos);
router.get('/productos/nuevo', adminController.formCrearProducto);
router.get('/productos/:id/editar', adminController.formEditarProducto);
router.post('/productos', adminController.guardarProducto);
router.put('/productos/:id', adminController.actualizarProducto);
router.delete('/productos/:id', adminController.eliminarProducto);

/* ===================== SERVICIOS ===================== */
router.get('/servicios', adminController.listaServicios);
router.get('/servicios/nuevo', adminController.formCrearServicio);
router.get('/servicios/:id/editar', adminController.formEditarServicio);
router.post('/servicios', adminController.guardarServicio);
router.put('/servicios/:id', adminController.actualizarServicio);
router.delete('/servicios/:id', adminController.eliminarServicio);

module.exports = router;
