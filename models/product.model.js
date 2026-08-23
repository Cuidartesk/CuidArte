const mongoose = require('mongoose');

// Esquema de productos de la tienda médica.
// La imagen se guarda DENTRO del documento en formato Base64,
// así no depende de archivos en el proyecto ni de servicios externos.
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    description: {
      type: String,
      required: [true, 'Campo obligatorio'],
    },
    price: {
      type: Number,
      required: [true, 'Campo obligatorio'],
    },
    category: {
      type: String,
      default: 'biomedicos',
    },
    stock: {
      type: Number,
      default: 0,
    },
    // Imagen codificada en Base64: "data:image/png;base64,iVBORw0..."
    imageData: {
      type: String,
      default: '',
    },
    imageType: {
      type: String,
      default: 'png',
    },
    // INICIO MODIFICACION: estado del producto (Activo/Inactivo), igual al Django
    activo: {
      type: Boolean,
      default: true,
    },
    // FIN MODIFICACION
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
