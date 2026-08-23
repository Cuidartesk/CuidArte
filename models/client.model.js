const mongoose = require('mongoose');

// INICIO MODIFICACION: el cliente ahora es una cuenta completa y vive en la
// coleccion 'clients'. Se conservan los campos de la API original
const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    apellido: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Campo obligatorio'],
      unique: [true, 'El email debe ser unico'],
      lowercase: true,
    },
    password: {
      type: String,
      default: '',
    },
    telefono: {
      type: String,
      default: '',
    },
    edad: {
      type: Number,
      default: null,
    },
    direccion: {
      type: String,
      default: '',
    },
    foto: {
      type: String,
      default: '',
    },
    fotoTipo: {
      type: String,
      default: '',
    },
    fechaNacimiento: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ['cliente'],
      default: 'cliente',
    },
  },
  // Agrega createdAt y updatedAt automaticamente
  { timestamps: true, collection: 'clients' }
);

// Crea y exporta el modelo 'Client' (coleccion: clients)
module.exports = mongoose.model('Client', clientSchema);
// FIN MODIFICACION
