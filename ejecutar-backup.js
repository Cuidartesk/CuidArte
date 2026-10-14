// Ejecuta el backup manualmente (util para probar sin esperar la medianoche)
// Uso: node ejecutar-backup.js
require('dotenv').config();
const backup = require('./utils/backup');
const mailer = require('./utils/mailer');

(async () => {
    console.log('Realizando Backup de la Base de datos');
    const ruta = await backup.backupDatabase();
    if (ruta) {
        await mailer.enviarBackup(ruta);
    }
    process.exit(0);
})();
