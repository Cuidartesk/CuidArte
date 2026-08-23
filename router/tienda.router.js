/* ============================================================
   ARCHIVO NUEVO COMPLETO
   router/tienda.router.js
   Tienda publica + carrito/compra que requieren sesion
   (igual a las vistas @login_required de Django)
   ============================================================ */

const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tienda.controller');

// portero generico: cualquier usuario logueado (cliente, cuidador o admin)
function soloLogueado(req, res, next) {
    if (req.session.usuario && req.session.usuario.id) {
        return next();
    }
    // igual que login_required de Django: lo manda a ingresar
    return res.redirect('/ingresar?next=/tienda');
}

router.get('/tienda', tiendaController.tienda);
router.post('/agregar-carrito/:id', soloLogueado, tiendaController.agregarCarrito);
router.get('/carrito', soloLogueado, tiendaController.verCarrito);
router.get('/quitar-carrito/:id', soloLogueado, tiendaController.quitarCarrito);
router.get('/comprar-carrito', soloLogueado, tiendaController.comprarCarrito);
router.post('/comprar-carrito', soloLogueado, tiendaController.comprarCarrito);

module.exports = router;
