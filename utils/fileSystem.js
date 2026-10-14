const fs = require('fs');

exports.leer = () => {
    fs.readFile('registro.log', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return;
        }
        console.log(data);
    });
};

exports.escribir = (accion) => {
    const logEntry = `${new Date().toISOString()} -${accion} - Usuario logueado es: \n`;
    fs.appendFile('app.log', logEntry, (err) => {
        if (err) {
            console.error('Error escribiendo log:', err.message);
            return;
        }
        console.log('Log agregado');
    });
};

exports.borrar = (ruta = 'app.log') => {
    fs.unlink(ruta, (err) => {
        if (err) {
            console.error('Error al borrar el archivo:', err.message);
            return;
        }
        console.log('Archivo borrado correctamente');
    });
};

exports.leerPermisos = (ruta = 'app.log') => {
    fs.stat(ruta, (err, stats) => {
        if (err) {
            console.error('Error al leer permisos del archivo:', err.message);
            return;
        }
        const permisosOctal = stats.mode.toString(8).slice(-3);
        console.log(`Permisos (octal): ${permisosOctal}`);
        console.log('Detalles:', stats);
    });
};

// Versión con Promises (tal como mostró el profesor)
exports.escribirPromise = async (accion) => {
    try {
        const logEntry = `${new Date().toISOString()} -${accion} - Usuario logueado es: \n`;
        await fs.promises.appendFile('app.log', logEntry);
        console.log('Log agregado');
    } catch (err) {
        console.error('Error escribiendo log:', err.message);
    }
};
