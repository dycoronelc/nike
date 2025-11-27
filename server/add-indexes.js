// Script para agregar índices a la base de datos
// Ejecutar: node server/add-indexes.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard',
  multipleStatements: true // Permitir múltiples statements
};

async function addIndexes() {
  let connection;
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'add-indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando script de índices...');
    
    // Dividir en statements individuales (MySQL no soporta CREATE INDEX IF NOT EXISTS directamente)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        // Ejecutar statement directamente (ya no tiene IF NOT EXISTS)
        await connection.query(statement);
        const indexName = statement.match(/idx_\w+/)?.[0] || 'desconocido';
        console.log(`✅ Índice creado: ${indexName}`);
      } catch (error) {
        // Si el índice ya existe, ignorar el error (código 1061 o 1062)
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 1061 || error.code === 1062) {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'desconocido';
          console.log(`⚠️  Índice ya existe (ignorado): ${indexName}`);
        } else {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'desconocido';
          console.error(`❌ Error creando índice ${indexName}: ${error.message}`);
          console.error(`   Código: ${error.code}`);
          // No lanzar error, continuar con los siguientes índices
        }
      }
    }

    console.log('✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

addIndexes();

