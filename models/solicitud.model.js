// INICIO MODIFICACION: modelo de solicitudes de cuidado (SolicitudCuidado de Django)
const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'El cliente es obligatorio']
    },
    cuidador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver',
        required: [true, 'El cuidador es obligatorio']
    },
    mensaje: {
        type: String,
        default: '',
        trim: true
    },
    // tipo de servicio solicitado (ej. Enfermeria, Compania)
    servicio: {
        type: String,
        default: '',
        trim: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'aceptada', 'rechazada'],
        default: 'pendiente'
    }
}, {
    timestamps: true, // createdAt hace el papel de s.fecha
    collection: 'solicitudes'
});

module.exports = mongoose.model('Solicitud', solicitudSchema);
// FIN MODIFICACION
