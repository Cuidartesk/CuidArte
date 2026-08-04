const mongoose = require('mongoose');

// Esquema del Cuidador (el personal que brinda el cuidado)
const caregiverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    email: {
      type: String,
      required: [true, 'Campo obligatorio'],
      unique: [true, 'El email debe ser unico'],
    },
    telefono: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    especialidad: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    tarifa: {
      type: Number,
      required: [true, 'Campo obligatorio'],
    },
  },
  // Agrega createdAt y updatedAt automaticamente
  { timestamps: true }
);

// Crea y exporta el modelo 'Cuidador' (coleccion: cuidadores)
module.exports = mongoose.model('Caregiver', caregiverSchema);