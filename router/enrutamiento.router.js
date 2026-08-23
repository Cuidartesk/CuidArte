const { Router } = require('express');
const router = Router();

const clientController = require('../controllers/client.controller');
const caregiverController = require('../controllers/caregiver.controller');
const serviceController = require('../controllers/service.controller');
const productController = require('../controllers/product.controller');


router.get('/clients', clientController.consultar);
router.get('/clients/:id', clientController.consultarId);
router.post('/clients', clientController.registrar);
router.put('/clients/:id', clientController.actualizar);
router.delete('/clients/:id', clientController.eliminar);

router.get('/caregivers', caregiverController.consultar);
router.get('/caregivers/:id', caregiverController.consultarId);
router.post('/caregivers', caregiverController.registrar);
router.put('/caregivers/:id', caregiverController.actualizar);
router.delete('/caregivers/:id', caregiverController.eliminar);

router.get('/services', serviceController.consultar);
router.get('/services/:id', serviceController.consultarId);
router.post('/services', serviceController.registrar);
router.put('/services/:id', serviceController.actualizar);
router.delete('/services/:id', serviceController.eliminar);

// Products
router.post('/products', productController.registrar);
router.get('/products', async (req, res) => {
  try {
    const Product = require('../models/product.model');
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
});

module.exports = router;
