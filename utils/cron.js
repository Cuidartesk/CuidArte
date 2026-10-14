const cron = require('node-cron');
const backup = require('./backup');
const mailer = require('./mailer');

// Programa el backup todos los dias a medianoche (00:00:00), igual que el profesor.
// node-cron usa 6 campos: segundo minuto hora dia mes dia-semana
exports.iniciarCron = () => {
    cron.schedule('0 0 0 * * *', async () => {
        console.log('Realizando Backup de la Base de datos');
        const ruta = await backup.backupDatabase();
        if (ruta) {
            await mailer.enviarBackup(ruta);
        }
    });
    console.log('Cron de backup programado (todos los dias a las 00:00)');
};
