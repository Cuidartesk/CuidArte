/* ============================================================
   ARCHIVO NUEVO COMPLETO
   controllers/tienda.controller.js
   Portado de las vistas de Django:
   - tienda: lista productos con filtro por categoria
   - agregarCarrito / verCarrito / quitarCarrito: carrito en sesion
   - comprarCarrito: checkout con validaciones, descuenta stock
     y crea pedidos (PedidoProducto)
   ============================================================ */

const Product = require('../models/product.model');
const Pedido = require('../models/pedido.model');

// Etiquetas de categoria, iguales a Producto.CATEGORIAS de Django
const CATEGORIAS = [
    ['biomedicos', 'Dispositivos Biom&eacute;dicos'],
    ['suministros', 'Suministros M&eacute;dicos'],
    ['movilidad', 'Movilidad y Ortopedia'],
    ['cuidado', 'Cuidado Personal'],
    ['otros', 'Otros']
];

function etiquetaCategoria(valor) {
    const found = CATEGORIAS.find(c => c[0] === valor);
    return found ? found[1].replace(/&eacute;/g, 'é') : (valor || 'Otros');
}

// GET /tienda?categoria=xxx
exports.tienda = async (req, res) => {
    try {
        const categoria = String(req.query.categoria || '');
        const filtro = { activo: true };
        // INICIO MODIFICACION: compatibilidad con categorias antiguas de la demo
        if (categoria === 'cuidado') {
            filtro.category = { $in: ['cuidado', 'cuidado personal'] };
        } else if (categoria) {
            filtro.category = categoria;
        }
        // FIN MODIFICACION
        const productos = await Product.find(filtro).lean();
        res.render('pages/tienda', {
            productos,
            categorias: CATEGORIAS,
            categoriaActual: categoria,
            etiquetaCategoria
        });
    } catch (error) {
        res.status(500).send('Error al cargar la tienda');
    }
};

// POST /agregar-carrito/:id  (igual a agregar_carrito de Django)
exports.agregarCarrito = async (req, res) => {
    try {
        const producto = await Product.findOne({ _id: req.params.id, activo: true }).lean();
        if (!producto) return res.redirect('/tienda');
        const carrito = req.session.carrito || {};
        const pid = String(producto._id);
        const cantActual = carrito[pid] || 0;
        if ((producto.stock || 0) <= 0) {
            req.session.flashMensaje = { texto: `${producto.name} está agotado.`, tipo: 'error' };
            return res.redirect('/tienda');
        }
        if (cantActual + 1 > producto.stock) {
            req.session.flashMensaje = { texto: `No hay suficiente stock. Solo quedan ${producto.stock} unidades de ${producto.name}.`, tipo: 'error' };
            return res.redirect('/tienda');
        }
        carrito[pid] = cantActual + 1;
        req.session.carrito = carrito;
        req.session.flashMensaje = { texto: `${producto.name} agregado al carrito.`, tipo: 'ok' };
        res.redirect('/tienda');
    } catch (error) {
        res.redirect('/tienda');
    }
};

// GET /carrito  (igual a ver_carrito de Django)
exports.verCarrito = async (req, res) => {
    try {
        const carrito = req.session.carrito || {};
        const items = [];
        let total = 0;
        for (const [pid, cant] of Object.entries(carrito)) {
            const p = await Product.findOne({ _id: pid, activo: true }).lean();
            if (!p) { delete carrito[pid]; continue; }
            const subtotal = p.price * cant;
            total += subtotal;
            items.push({ producto: p, cantidad: cant, subtotal });
        }
        req.session.carrito = carrito;
        res.render('pages/carrito', { items, total });
    } catch (error) {
        res.redirect('/tienda');
    }
};

// GET /quitar-carrito/:id  (igual a quitar_carrito de Django)
exports.quitarCarrito = (req, res) => {
    const carrito = req.session.carrito || {};
    delete carrito[String(req.params.id)];
    req.session.carrito = carrito;
    req.session.flashMensaje = { texto: 'Producto eliminado del carrito.', tipo: 'ok' };
    res.redirect('/carrito');
};

// GET + POST /comprar-carrito  (igual a comprar_carrito de Django)
exports.comprarCarrito = async (req, res) => {
    try {
        const carrito = req.session.carrito || {};
        if (Object.keys(carrito).length === 0) {
            req.session.flashMensaje = { texto: 'Tu carrito está vacío.', tipo: 'error' };
            return res.redirect('/tienda');
        }
        const items = [];
        let total = 0;
        for (const [pid, cant] of Object.entries(carrito)) {
            const p = await Product.findOne({ _id: pid, activo: true }).lean();
            if (!p) continue;
            if (cant > p.stock) {
                req.session.flashMensaje = { texto: `No hay suficiente stock para ${p.name}. Solo quedan ${p.stock} unidades.`, tipo: 'error' };
                return res.redirect('/carrito');
            }
            const subtotal = p.price * cant;
            total += subtotal;
            items.push({ producto: p, cantidad: cant, subtotal });
        }

        if (req.method === 'POST') {
            const telefono = String(req.body.telefono || '').trim();
            const direccion = String(req.body.direccion || '').trim();
            if (!/^\d{10}$/.test(telefono)) {
                return res.status(400).render('pages/comprar_carrito', {
                    items, total,
                    telefonoVal: telefono, direccionVal: direccion,
                    error: 'El teléfono debe tener exactamente 10 dígitos.'
                });
            }
            if (direccion.length < 5) {
                return res.status(400).render('pages/comprar_carrito', {
                    items, total,
                    telefonoVal: telefono, direccionVal: direccion,
                    error: 'La ciudad / dirección debe tener al menos 5 caracteres.'
                });
            }
            // valida stock otra vez y crea los pedidos
            for (const it of items) {
                if (it.cantidad > it.producto.stock) {
                    req.session.flashMensaje = { texto: `Stock insuficiente para ${it.producto.name}`, tipo: 'error' };
                    return res.redirect('/carrito');
                }
            }
            for (const it of items) {
                await Product.updateOne(
                    { _id: it.producto._id },
                    { $inc: { stock: -it.cantidad } }
                );
                await Pedido.create({
                    usuario: req.session.usuario.id,
                    producto: it.producto._id,
                    cantidad: it.cantidad,
                    direccionEnvio: direccion,
                    telefono: telefono,
                    estado: 'pendiente'
                });
            }
            req.session.carrito = {};
            req.session.flashMensaje = { texto: `¡Compra realizada con éxito! Total: $${total.toLocaleString('es-CO')}`, tipo: 'ok' };
            return res.redirect('/tienda');
        }

        res.render('pages/comprar_carrito', { items, total, telefonoVal: '', direccionVal: '', error: null });
    } catch (error) {
        console.error('Error en comprarCarrito:', error);
        res.redirect('/carrito');
    }
};
