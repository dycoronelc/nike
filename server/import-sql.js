// Script para importar archivo SQL a Railway MySQL
// Este script puede ejecutarse desde Railway CLI una vez que el backend esté desplegado
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuración de la base de datos - usa variables de Railway si están disponibles
const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQLUSER || process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'railway',
  charset: 'utf8mb4',
  multipleStatements: true
};

async function importSQL(sqlFilePath) {
  let connection;
  try {
    console.log('🔌 Conectando a MySQL...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    // Leer archivo SQL
    console.log(`📖 Leyendo archivo SQL: ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Obtener tamaño del archivo
    const stats = fs.statSync(sqlFilePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamaño del archivo: ${fileSizeMB} MB`);
    
    // Dividir en statements (por ;)
    console.log('📝 Ejecutando SQL (esto puede tardar varios minutos)...');
    
    // Ejecutar en chunks para evitar problemas de memoria
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`   Total de statements: ${statements.length}`);
    
    let executed = 0;
    const total = statements.length;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          executed++;
          
          // Mostrar progreso cada 100 statements
          if (executed % 100 === 0 || executed === total) {
            const progress = ((executed / total) * 100).toFixed(1);
            process.stdout.write(`\r   Progreso: ${executed}/${total} (${progress}%)`);
          }
        } catch (error) {
          // Algunos errores son normales (como "table already exists")
          if (!error.message.includes('already exists') && !error.message.includes('Unknown')) {
            console.error(`\n⚠️  Error en statement ${executed + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Importación completada!');
    
    // Verificar datos
    console.log('\n🔍 Verificando datos importados...');
    const [tables] = await connection.query(`
      SELECT 
        'sell_in' as tabla, COUNT(*) as registros FROM sell_in
      UNION ALL
      SELECT 'sell_out', COUNT(*) FROM sell_out
      UNION ALL
      SELECT 'inventario', COUNT(*) FROM inventario
    `);
    
    console.log('\n📊 Registros importados:');
    tables.forEach(row => {
      console.log(`   ${row.tabla}: ${row.registros.toLocaleString()} registros`);
    });

  } catch (error) {
    console.error('\n❌ Error importando base de datos:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Obtener ruta del archivo desde argumentos de línea de comandos
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('❌ Error: Debes proporcionar la ruta al archivo SQL');
  console.log('\nUso: node server/import-sql.js <ruta-al-archivo.sql>');
  console.log('\nEjemplo:');
  console.log('  node server/import-sql.js ../backup.sql');
  console.log('  node server/import-sql.js C:\\ruta\\completa\\backup.sql');
  process.exit(1);
}

if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ Error: El archivo no existe: ${sqlFilePath}`);
  process.exit(1);
}

// Ejecutar importación
importSQL(sqlFilePath);

