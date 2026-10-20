/* eslint-disable no-unused-vars */
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

// Tablas del proyecto CuidArte que se respaldan
const TABLAS = [
    'administrators',
    'caregivers',
    'clients',
    'products',
    'services',
    'solicitudes',
    'pedidos'
];

// Igual que en el ejemplo del profesor, el respaldo se guarda en ./backup
const outputPath = './respaldos_sistema';

// Equivalente al backupDatabase del profesor (que usaba mongodump).
// Como CuidArte usa Supabase (PostgreSQL), leemos cada tabla con su API
// y guardamos todo en un archivo .json dentro de ./backup
exports.backupDatabase = async () => {
    try {
        fs.mkdirSync(outputPath, { recursive: true });

        const respaldo = {
            sistema: 'CuidArte Web',
            desarrollador: 'Santiago Giraldo',
            motor_db: 'Supabase (PostgreSQL Cloud)',
            fecha_generacion: new Date().toLocaleString('es-CO'),
            total_tablas: TABLAS.length,
            tablas_respaldadas: {}
        };
        for (const tabla of TABLAS) {
            const { data, error } = await supabase.from(tabla).select('*');
            if (error) {
                console.error(`[ERROR] No se pudo leer ${tabla}: ${error.message}`);
                respaldo.tablas_respaldadas[tabla] = { error: error.message };
                continue;
            }
            respaldo.tablas_respaldadas[tabla] = data;
            console.log(` -> Tabla [${tabla}] respaldada: ${data.length} filas`);
        }

        const fecha = new Date();
        const fechaStr = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}_${fecha.getHours()}-${fecha.getMinutes()}`;
        const nombre = `cuidarte_backup_${fechaStr}.json`;
        const ruta = path.join(outputPath, nombre);
        fs.writeFileSync(ruta, JSON.stringify(respaldo, null, 2), 'utf8');

        console.log(`Respaldo completado con éxito ${ruta}`);
        return ruta;
    } catch (error) {
        console.error(`Error en el respaldo: ${error.message}`);
        return null;
    }
};
