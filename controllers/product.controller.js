const supabase = require('../config/supabase');
const { subirImagen } = require('../config/supabase');

// Muestra el formulario de registro de productos
exports.formulario = (req, res) => {
    res.render('pages/registrarproducto');
};

// Crea un producto (la imagen llega como Base64 desde el navegador)
exports.registrar = async (req, res) => {
    try {
        const image_url = await subirImagen(req.body.imageData || '', 'cuidarte', req.body.name || 'producto');
        const { data, error } = await supabase.from('products').insert({
            ...req.body,
            image_url
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el producto', error: error.message });
    }
};
