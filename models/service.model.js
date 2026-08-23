const mongoose = require('mongoose');

// Esquema de servicios de cuidado que ofrece CuidArte.
const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Campo obligatorio']
        },
        description: {
            type: String,
            required: [true, 'Campo obligatorio']
        },
        price: {
            type: Number,
            required: [true, 'Campo obligatorio']
        },
        // Imagen codificada en Base64: "data:image/png;base64,iVBORw0..."
        imageData: {
            type: String,
            default: ''
        },
        imageType: {
            type: String,
            default: 'png'
        },
        // INICIO MODIFICACION: estado del taller (Activo/Inactivo), igual al Django
        activo: {
            type: Boolean,
            default: true
        }
        // FIN MODIFICACION
    },

    // timestamps agrega createdAt y updatedAt automáticamente.
    { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema,)






