const mongoose = require('mongoose');

// Esquema del Cliente (adulto mayor que recibe el cuidado)
const clientSchema = new mongoose.Schema(
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
    edad: {
      type: Number,
      required: [true, 'Campo obligatorio'],
    },
  },
  // Agrega createdAt y updatedAt automaticamente
  { timestamps: true }
);

// Crea y exporta el modelo 'Cliente' (coleccion: client)
module.exports = mongoose.model('Client', clientSchema);