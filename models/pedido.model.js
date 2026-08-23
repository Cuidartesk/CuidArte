// INICIO MODIFICACION: modelo de pedidos de productos (PedidoProducto de Django).
// Cada compra genera un pedido por producto con sus datos de envio.
const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio']
    },
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio']
    },
    cantidad: {
        type: Number,
        default: 1,
        min: 1
    },
    direccionEnvio: {
        type: String,
        default: '',
        trim: true
    },
    telefono: {
        type: String,
        default: '',
        trim: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagado', 'enviado', 'cancelado'],
        default: 'pendiente'
    }
}, {
    timestamps: true,
    collection: 'pedidos'
});

module.exports = mongoose.model('Pedido', pedidoSchema);
// FIN MODIFICACION
