const supabase = require('../config/supabase');

exports.home = async (req, res) => {
    res.render('pages/index');
};

// Obtiene a todos los cuidadores
exports.consultar = async (req, res) => {
    try {
        const { data: caregivers, error } = await supabase.from('caregivers').select('*');
        if (error) throw error;
        res.status(200).json(caregivers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los cuidadores', error: error.message });
    }
};

// Obtener un cuidador por el id
exports.consultarId = async (req, res) => {
    try {
        const { data, error } = await supabase.from('caregivers').select('*').eq('id', req.params.id).maybeSingle();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cuidador no encontrado' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar el cuidador', error: error.message });
    }
};

// Crear un nuevo cuidador
exports.registrar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('caregivers').insert(req.body).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el cuidador', error: error.message });
    }
};

// Actualizar cuidador por el id
exports.actualizar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('caregivers').update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cuidador no encontrado' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cuidador', error: error.message });
    }
};

// Eliminar un cuidador por su id
exports.eliminar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('caregivers').delete().eq('id', req.params.id).select().single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cuidador no encontrado' });
        }
        res.status(200).json({ message: 'Cuidador eliminado', caregivers: data });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cuidador', error: error.message });
    }
};
