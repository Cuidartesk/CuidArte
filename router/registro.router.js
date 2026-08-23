// INICIO MODIFICACION: rutas de registro con URLs como en Django
// (/registro/cliente y /registro/cuidador), estructura profesor: router -> controller -> view
const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registro.controller');

router.get('/registro', (req, res) => res.redirect('/seleccionar-tipo'));
// pagina de seleccion de tipo de cuenta (seleccionar_tipo.html de Django)
router.get('/seleccionar-tipo', registroController.seleccionarTipo);
router.get('/registro/cliente', registroController.formCliente);
router.get('/registro/cuidador', registroController.formCuidador);
router.post('/registro/cliente', registroController.registrarCliente);
router.post('/registro/cuidador', registroController.registrarCuidador);
router.get('/captcha', registroController.refrescarCaptcha);

module.exports = router;
// FIN MODIFICACION
