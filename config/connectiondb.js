const mongoose = require ('mongoose');
const dns = require('dns');

// usa el dns de google 
dns.setServers(['8.8.8.8', '8.8.4.4']);

const URI = process.env.MONGOURI;

async function connectDB() {
  if (!URI) {
    console.error('MONGOURI no está definido en .env');
    return;
  }

  try {
    // Espera que la conexión a MongoDB se establezca, si hay error, se imprime en consola.
    await mongoose.connect(URI);
    console.log('MongoDB conectado correctamente');
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err.message || err);
  }
}

connectDB();

module.exports = mongoose;