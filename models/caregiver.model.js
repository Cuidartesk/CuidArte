const mongoose = require('mongoose');

// INICIO MODIFICACION: el cuidador ahora es una cuenta completa y vive en la
// coleccion 'caregivers'. Se conservan los campos de la API original
const caregiverSchema = new mongoose.Schema(
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
    especialidad: {
      type: String,
      default: '',
    },
    // campo del formulario de registro (igual que especialidad pero con el
    // nombre que usan las vistas de Django)
    especialidades: {
      type: String,
      default: '',
    },
    tarifa: {
      type: Number,
      default: 0,
    },
    experiencia: {
      type: String,
      default: '',
    },
    cedula: {
      type: String,
      default: '',
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
      enum: ['cuidador'],
      default: 'cuidador',
    },
  },
  // Agrega createdAt y updatedAt automaticamente
  { timestamps: true, collection: 'caregivers' }
);

// Crea y exporta el modelo 'Caregiver' (coleccion: caregivers)
module.exports = mongoose.model('Caregiver', caregiverSchema);
// FIN MODIFICACION
