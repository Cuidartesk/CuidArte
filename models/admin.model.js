const mongoose = require('mongoose');

// INICIO MODIFICACION: modelo de administradores, coleccion 'administrators'
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    apellido: {
        type: String,
        default: '',
        trim: true
    },
    usuario: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contrasena es obligatoria']
    },
    fechaNacimiento: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['admin'],
        default: 'admin'
    }
}, {
    timestamps: true,
    collection: 'administrators'
});

module.exports = mongoose.model('Administrator', adminSchema);
// FIN MODIFICACION
