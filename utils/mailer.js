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
        const fecha = new Date().toLocaleString('es-CO');

        await transporter.sendMail({
            from: `"CuidArte" <${process.env.SMTP_USER}>`,
            to: destino,
            subject: `Backup CuidArte(${fecha})`,
            text: `Archivo json con el respaldo de la base de datos de CuidArte, se utilizó la base de datos de supabase, que es una DB relacional y no exporta los archivos uno por uno si no que se puede exportar un archivo con toda la informacion en formato JSON (${fecha}) .\n\n Santiago Grajales, envio de nuevo ya que lo envie sin haber cargado los cambios que yo hice`,
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
