const Service = require('../models/service.model');

// Obtener todos los servicios
exports.consultar = async (req, res) => {
  try {
    const services = await Service.find({});
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los servicios', error: error.message });
  }
};

// Obtener un servicio por el id
exports.consultarId = async (req, res) => {
  try {
    const services = await Service.findOne({ _id: req.params.id });
    if (!services) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el servicio', error: error.message });
  }
};

// Crear un nuevo servicio
exports.registrar = async (req, res) => {
  try {
    const newservices = await Service.create(req.body);
    res.status(201).json(newservices);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el servicio', error: error.message });
  }
};

// Actualizar servicio por el id
exports.actualizar = async (req, res) => {
  try {
    const services = await Service.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!services) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el servicio', error: error.message });
  }
};

// Eliminar un servicio por su id
exports.eliminar = async (req, res) => {
  try {
    const services = await Service.findOneAndDelete({ _id: req.params.id });
    if (!services) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.status(200).json({ message: 'Servicio eliminado', services });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el servicio', error: error.message });
  }
};