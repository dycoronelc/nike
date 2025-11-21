import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard',
  charset: 'utf8mb4'
};

async function exportDatabase() {
  let connection;
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    // Crear archivo SQL de exportación
    const exportPath = path.join(__dirname, '..', 'nike_dashboard_export.sql');
    const stream = fs.createWriteStream(exportPath, { encoding: 'utf8' });

    // Escribir header
    stream.write(`-- Nike Dashboard Database Export\n`);
    stream.write(`-- Generated: ${new Date().toISOString()}\n\n`);
    stream.write(`SET FOREIGN_KEY_CHECKS=0;\n\n`);

    console.log('📤 Exportando estructura de tablas...');
    
    // Exportar estructura de tablas
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  📋 Exportando estructura de ${tableName}...`);
      
      const [createTable] = await connection.query(`SHOW CREATE TABLE ??`, [tableName]);
      const createStatement = createTable[0]['Create Table'];
      
      stream.write(`-- Table structure for ${tableName}\n`);
      stream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
      stream.write(`${createStatement};\n\n`);
    }

    console.log('📦 Exportando datos...');
    
    // Exportar datos
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`  💾 Exportando datos de ${tableName}...`);
      
      const [rows] = await connection.query(`SELECT * FROM ??`, [tableName]);
      
      if (rows.length > 0) {
        stream.write(`-- Data for table ${tableName}\n`);
        stream.write(`LOCK TABLES \`${tableName}\` WRITE;\n`);
        
        // Obtener nombres de columnas
        const columns = Object.keys(rows[0]);
        const columnsList = columns.map(col => `\`${col}\``).join(', ');
        
        // Insertar datos en lotes
        const batchSize = 1000;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          stream.write(`INSERT INTO \`${tableName}\` (${columnsList}) VALUES\n`);
          
          const values = batch.map((row, idx) => {
            const rowValues = columns.map(col => {
              const value = row[col];
              if (value === null || value === undefined) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (value instanceof Date) {
                return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
              }
              return value;
            }).join(', ');
            return `  (${rowValues})${idx < batch.length - 1 ? ',' : ''}`;
          }).join('\n');
          
          stream.write(values);
          stream.write(i + batch.length < rows.length ? ',\n' : ';\n');
        }
        
        stream.write(`UNLOCK TABLES;\n\n`);
        console.log(`    ✅ ${rows.length} registros exportados`);
      } else {
        console.log(`    ⚪ Tabla ${tableName} está vacía`);
      }
    }

    stream.write(`SET FOREIGN_KEY_CHECKS=1;\n`);
    stream.end();

    console.log('\n✅ Exportación completada!');
    console.log(`📁 Archivo guardado en: ${exportPath}`);
    
    // Obtener tamaño del archivo
    const stats = fs.statSync(exportPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`);

  } catch (error) {
    console.error('❌ Error exportando base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar exportación
exportDatabase();

