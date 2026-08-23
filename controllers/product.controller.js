const Product = require('../models/product.model');

// Muestra el formulario de registro de productos
exports.formulario = (req, res) => {
  res.render('pages/registrarproducto');
};

// Crea un producto (la imagen llega como Base64 desde el navegador)
exports.registrar = async (req, res) => {
  try {
    const nuevo = await Product.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el producto', error: error.message });
  }
};
