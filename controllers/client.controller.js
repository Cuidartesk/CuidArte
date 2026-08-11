const Client = require('../models/client.model');

// Obtener todos los clientes
exports.consultar = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
  }
};

// Obtener un cliente por el id
exports.consultarId = async (req, res) => {
  try {
    const clients = await Client.findOne({ _id: req.params.id });
    if (!clients) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el cliente', error: error.message });
  }
};

// Crear un nuevo cliente
exports.registrar = async (req, res) => {
  try {
    const newclients = await Client.create(req.body);
    res.status(201).json(newclients);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
  }
};

// Actualizar cliente por el id
exports.actualizar = async (req, res) => {
  try {
    const clients = await Client.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!clients) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
  }
};

// Eliminar un cliente por su id
exports.eliminar = async (req, res) => {
  try {
    const clients = await Client.findOneAndDelete({ _id: req.params.id });
    if (!clients) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json({ message: 'Cliente eliminado', clients });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
  }
};