const path = require('path');
const nodemailer = require('nodemailer');

// Transporte SMTP configurado por variables de entorno (.env)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Envía el archivo de respaldo como adjunto por correo
exports.enviarBackup = async (rutaArchivo) => {
    try {
        const destino = process.env.BACKUP_EMAIL || process.env.SMTP_USER;
        await transporter.sendMail({
            from: `"CuidArte Backup" <${process.env.SMTP_USER}>`,
            to: destino,
            subject: `Backup CuidArte - ${new Date().toLocaleString()}`,
            text: 'Adjunto el respaldo automatico de la base de datos de CuidArte.',
            attachments: [
                {
                    filename: path.basename(rutaArchivo),
                    path: rutaArchivo
                }
            ]
        });
        console.log(`Backup enviado por correo a ${destino}`);
    } catch (error) {
        console.error(`Error enviando el correo: ${error.message}`);
    }
};
