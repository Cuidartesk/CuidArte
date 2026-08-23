/* ============================================================
   ARCHIVO NUEVO COMPLETO
   router/cliente.router.js
   Rutas del cliente, portadas de Django (dashboard_cliente,
   buscar_cuidadores y mis_reservas). El portero se aplica
   RUTA POR RUTA para no bloquear rutas publicas.
   ============================================================ */

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');

// Portero que solo deja pasar a clientes (igual que soloCuidador)
function soloCliente(req, res, next) {
    if (req.session.usuario && req.session.usuario.role === 'cliente') {
        return next();
    }
    res.redirect('/ingresar');
}

router.get('/dashboard-cliente', soloCliente, clienteController.dashboard);
router.get('/buscar-cuidadores', soloCliente, clienteController.buscarCuidadores);
// INICIO MODIFICACION: ficha del cuidador, contacto y mis reservas (como Django)
router.get('/ver-cuidador/:id', soloCliente, clienteController.verCuidador);
router.post('/contactar-cuidador/:id', soloCliente, clienteController.contactarCuidador);
router.get('/mis-reservas', soloCliente, clienteController.misReservas);
// mi perfil del cliente (mi_perfil.html de Django) y mis agendas
router.get('/mi-perfil', soloCliente, clienteController.miPerfil);
router.get('/mis-agendas', soloCliente, clienteController.misAgendas);
// FIN MODIFICACION

module.exports = router;
