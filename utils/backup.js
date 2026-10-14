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
const outputPath = './backup';

// Equivalente al backupDatabase del profesor (que usaba mongodump).
// Como CuidArte usa Supabase (PostgreSQL), leemos cada tabla con su API
// y guardamos todo en un archivo .json dentro de ./backup
exports.backupDatabase = async () => {
    try {
        fs.mkdirSync(outputPath, { recursive: true });

        const respaldo = {
            base_datos: 'CuidArte (Supabase/PostgreSQL)',
            fecha: new Date().toISOString(),
            tablas: {}
        };

        for (const tabla of TABLAS) {
            const { data, error } = await supabase.from(tabla).select('*');
            if (error) {
                console.error(`Error leyendo la tabla ${tabla}: ${error.message}`);
                respaldo.tablas[tabla] = { error: error.message };
                continue;
            }
            respaldo.tablas[tabla] = data;
        }

        const nombre = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const ruta = path.join(outputPath, nombre);
        fs.writeFileSync(ruta, JSON.stringify(respaldo, null, 2), 'utf8');

        console.log(`Respaldo completado con éxito ${ruta}`);
        return ruta;
    } catch (error) {
        console.error(`Error en el respaldo: ${error.message}`);
        return null;
    }
};
