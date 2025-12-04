import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard',
  charset: 'utf8mb4',
};

// Función para hashear contraseña (hash simple, en producción usar bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createUsersTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Creando tabla de usuarios...');
    
    // Crear tabla de usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('analista', 'comercial') NOT NULL,
        nombre_completo VARCHAR(200),
        email VARCHAR(200),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_rol (rol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabla de usuarios creada');
    
    // Verificar si ya existen usuarios
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    
    if (existingUsers[0].count > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos');
      console.log('¿Deseas continuar y crear usuarios de prueba? (Se insertarán solo si no existen)');
    }
    
    // Insertar usuarios de prueba
    const passwordHash = hashPassword('password123');
    
    await connection.query(`
      INSERT INTO usuarios (username, password, rol, nombre_completo, email) VALUES
      (?, ?, 'analista', 'Usuario Analista', 'analista@nike.com'),
      (?, ?, 'comercial', 'Usuario Comercial', 'comercial@nike.com')
      ON DUPLICATE KEY UPDATE username=username
    `, ['analista', passwordHash, 'comercial', passwordHash]);
    
    console.log('✅ Usuarios de prueba creados:');
    console.log('   - Usuario: analista / Contraseña: password123 / Rol: analista');
    console.log('   - Usuario: comercial / Contraseña: password123 / Rol: comercial');
    
  } catch (error) {
    console.error('❌ Error creando tabla de usuarios:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
createUsersTable()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

