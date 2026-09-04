const supabase = require('../config/supabase');
const { subirImagen } = require('../config/supabase');

// Muestra el formulario de registro de productos
exports.formulario = (req, res) => {
    res.render('pages/registrarproducto');
};

// Crea un producto (la imagen llega como Base64 desde el navegador)
exports.registrar = async (req, res) => {
    try {
        const { imageData, ...resto } = req.body;
        resto.price = Number(resto.price || 0);
        resto.stock = Number(resto.stock ?? 10);
        const image_url = await subirImagen(imageData || '', 'cuidarte', resto.name || 'producto');
        const { data, error } = await supabase.from('products').insert({
            ...resto,
            image_url
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el producto', error: error.message });
    }
};
