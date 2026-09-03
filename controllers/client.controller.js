const supabase = require('../config/supabase');

// Obtener todos los clientes
exports.consultar = async (req, res) => {
    try {
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
    }
};

// Obtener un cliente por el id
exports.consultarId = async (req, res) => {
    try {
        const { data, error } = await supabase.from('clients').select('*').eq('id', req.params.id).maybeSingle();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar el cliente', error: error.message });
    }
};

// Crear un nuevo cliente
exports.registrar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('clients').insert(req.body).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
    }
};

// Actualizar cliente por el id
exports.actualizar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('clients').update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
    }
};

// Eliminar un cliente por su id
exports.eliminar = async (req, res) => {
    try {
        const { data, error } = await supabase.from('clients').delete().eq('id', req.params.id).select().single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente eliminado', clients: data });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
    }
};
