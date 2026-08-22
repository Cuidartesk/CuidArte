const Caregiver = require ('../models/caregiver.model');

exports.home = async (req, res) => {
    res.render ('pages/index');
}

// Obtiene a todos los cuidadores
exports.consultar = async  (req, res) => {
    try {
        const caregivers = await Caregiver.find({});
        res.status(200).json(caregivers);
    } catch (error) {
        res.status(500).json ({message: 'Error al obtener los cuidadores', error: error.message });
    }
};


// Obtener un cuidador por el id
exports.consultarId = async (req, res) => {
  try {
    const caregivers = await Caregiver.findOne({ _id: req.params.id });
    if (!caregivers) {
      return res.status(404).json({ message: 'Cuidador no encontrado' });
    }
    res.status(200).json(caregivers);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el cuidador', error: error.message });
  }
};


// Crear un nuevo cuidador
exports.registrar = async (req, res) => {
  try {
    const newcaregivers = await Caregiver.create(req.body);
    res.status(201).json(newcaregivers);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el cuidador', error: error.message });
  }
};


// Actualizar cuidador por el id
exports.actualizar = async (req, res) => {
  try {
    const caregivers = await Caregiver.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!caregivers) {
      return res.status(404).json({ message: 'Cuidador no encontrado' });
    }
    res.status(200).json(caregivers);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el cuidador', error: error.message });
  }
};


// Eliminar un cuidador por su id
exports.eliminar = async (req, res) => {
  try {
    const caregivers = await Caregiver.findOneAndDelete({ _id: req.params.id });
    if (!caregivers) {
      return res.status(404).json({ message: 'Cuidador no encontrado' });
    }
    res.status(200).json({ message: 'Cuidador eliminado', caregivers });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el cuidador', error: error.message });
  }
};