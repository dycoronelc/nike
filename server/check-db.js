// Script rápido para verificar estado de la base de datos
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard'
});

const [sellIn] = await connection.query('SELECT COUNT(*) as count FROM sell_in');
const [sellOut] = await connection.query('SELECT COUNT(*) as count FROM sell_out');
const [inventario] = await connection.query('SELECT COUNT(*) as count FROM inventario');

console.log('📊 Estado de la base de datos:');
console.log(`   ✅ Sell In: ${sellIn[0].count.toLocaleString()} registros`);
console.log(`   ✅ Sell Out: ${sellOut[0].count.toLocaleString()} registros`);
console.log(`   ✅ Inventario: ${inventario[0].count.toLocaleString()} registros`);
console.log(`\n   Total: ${(sellIn[0].count + sellOut[0].count + inventario[0].count).toLocaleString()} registros`);

await connection.end();

