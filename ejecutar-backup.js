// Ejecuta el backup manualmente (util para probar sin esperar la medianoche)
// Uso: node ejecutar-backup.js
require('dotenv').config();
const backup = require('./utils/backup');
const mailer = require('./utils/mailer');

(async () => {
    console.log('   INICIANDO EL RESPALDO MANUAL DE CUIDARTE       ');

    const ruta = await backup.backupDatabase();
    if (ruta) {
        console.log('\nEnviando respaldo por correo electronico...');
        await mailer.enviarBackup(ruta);
        console.log('>> Proceso completado correctamente.');
    }
    process.exit(0);
})();
