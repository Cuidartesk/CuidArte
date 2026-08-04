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
    },

    // timestamps agrega createdAt y updatedAt automáticamente.
    { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema,)






