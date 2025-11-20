import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import XLSX from 'xlsx';
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
  multipleStatements: true,
  charset: 'utf8mb4'
};

// Leer y ejecutar schema SQL
async function initDatabase() {
  let connection;
  try {
    // Conectar sin especificar base de datos para crearla si no existe
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    connection = await mysql.createConnection(tempConfig);
    
    // Leer y ejecutar schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📊 Creando base de datos y tablas...');
    await connection.query(schema);
    console.log('✅ Base de datos inicializada correctamente');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

// Convertir fecha de Excel a Date
function excelDateToJSDate(excelDate) {
  if (typeof excelDate === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + excelDate * 86400000);
  }
  if (typeof excelDate === 'string') {
    return new Date(excelDate);
  }
  return null;
}

// Limpiar y preparar datos para inserción
function cleanValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  return value;
}

// Insertar datos de Sell In
async function insertSellIn(connection, data) {
  console.log(`📥 Insertando ${data.length} registros en sell_in...`);
  
  const sql = `INSERT INTO sell_in (
    fecha, temp, mes, año, cuenta, canal, marca_codigo, genero_descripcion,
    genero_arreglado, sucursal, nombre_sucursal, categoria_descripcion,
    familia, silueta, unidades, ventas, temp_code, bu, comp_noncomp
  ) VALUES ?`;
  
  const values = data.map(item => {
    const fecha = excelDateToJSDate(item.Fecha);
    return [
      fecha,
      cleanValue(item.Temp),
      cleanValue(item.Mes),
      cleanValue(item['Año']),
      cleanValue(item.Cuenta),
      cleanValue(item.Canal),
      cleanValue(item['Marca Código']),
      cleanValue(item['Genero Descripcion']),
      cleanValue(item['GENERO AREGLADO - SELL IN']),
      cleanValue(item.Sucursal),
      cleanValue(item['Nombre Sucursal']),
      cleanValue(item['Categoria Descripcion']),
      cleanValue(item.Familia),
      cleanValue(item.Silueta),
      cleanValue(item.Unidades),
      cleanValue(item.Ventas),
      cleanValue(item.TEMP),
      cleanValue(item.BU),
      cleanValue(item['COMP/NONCOMP'])
    ];
  }).filter(row => row[0] !== null); // Filtrar filas sin fecha válida
  
  // Insertar en lotes de 1000
  const batchSize = 1000;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await connection.query(sql, [batch]);
    process.stdout.write(`\r   Progreso: ${Math.min(i + batch.length, values.length)}/${values.length}`);
  }
  console.log('\n✅ Sell In insertado correctamente');
}

// Insertar datos de Sell Out
async function insertSellOut(connection, data) {
  console.log(`📥 Insertando ${data.length} registros en sell_out...`);
  
  const sql = `INSERT INTO sell_out (
    fecha, temp, mes, año, cuenta, canal, codigo_marca, genero_desc,
    genero_arreglado, sucursal, nombre_sucursal, categoria, familia,
    silueta, cantidad, ventas, ventas_moneda_local, temp_code, bu, comp_noncomp
  ) VALUES ?`;
  
  const values = data.map(item => {
    const fecha = excelDateToJSDate(item.Fecha);
    return [
      fecha,
      cleanValue(item.Temp),
      cleanValue(item.Mes),
      cleanValue(item['Año']),
      cleanValue(item.Cuenta),
      cleanValue(item.Canal),
      cleanValue(item['Codigo Marca']),
      cleanValue(item['Genero Desc']),
      cleanValue(item['GENERO ARREGLADO']),
      cleanValue(item.Sucursal),
      cleanValue(item['Nombre Sucursal']),
      cleanValue(item.Categoria),
      cleanValue(item.Familia),
      cleanValue(item.Silueta),
      cleanValue(item.Cantidad),
      cleanValue(item.Ventas),
      cleanValue(item['Ventas Moneda Local']),
      cleanValue(item['TEMP ']),
      cleanValue(item.BU),
      cleanValue(item['COMP/NONCOMP'])
    ];
  }).filter(row => row[0] !== null);
  
  const batchSize = 1000;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await connection.query(sql, [batch]);
    process.stdout.write(`\r   Progreso: ${Math.min(i + batch.length, values.length)}/${values.length}`);
  }
  console.log('\n✅ Sell Out insertado correctamente');
}

// Insertar datos de Inventario
async function insertInventario(connection, data) {
  console.log(`📥 Insertando ${data.length} registros en inventario...`);
  
  const sql = `INSERT INTO inventario (
    año, mes, dia, cuenta, canal, codigo_marca, nombre_sucursal,
    store_type, genero_desc, genero_arreglado, existencia,
    bu_arreglado, categoria, temp_code, comp_nocomp
  ) VALUES ?`;
  
  const values = data.map(item => [
    cleanValue(item['Año']),
    cleanValue(item.Mes),
    cleanValue(item.Dia),
    cleanValue(item.Cuenta),
    cleanValue(item.Canal),
    cleanValue(item['Codigo Marca']),
    cleanValue(item['Nombre Sucursal']),
    cleanValue(item['Store Type']),
    cleanValue(item['Genero Desc']),
    cleanValue(item['GENERO ARREGLADO']),
    cleanValue(item.Existencia),
    cleanValue(item['BU ARREGLADO']),
    cleanValue(item.Categoria),
    cleanValue(item[' CONCAT( TRIM( CAST (Temp AS CHARACTER ( 30 ))),  CAST ( RIGHT(Año, 2) AS CHARACTER ( 30 )))']),
    cleanValue(item['COMP/NOCOMP'])
  ]).filter(row => row[0] !== null && row[1] !== null);
  
  const batchSize = 1000;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await connection.query(sql, [batch]);
    process.stdout.write(`\r   Progreso: ${Math.min(i + batch.length, values.length)}/${values.length}`);
  }
  console.log('\n✅ Inventario insertado correctamente');
}

// Función principal
async function loadDataFromExcel() {
  let connection;
  try {
    // Inicializar base de datos
    await initDatabase();
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar si ya hay datos
    const [sellInRows] = await connection.query('SELECT COUNT(*) as count FROM sell_in');
    const [sellOutRows] = await connection.query('SELECT COUNT(*) as count FROM sell_out');
    const [inventarioRows] = await connection.query('SELECT COUNT(*) as count FROM inventario');
    
    if (sellInRows[0].count > 0 || sellOutRows[0].count > 0 || inventarioRows[0].count > 0) {
      console.log('ℹ️  La base de datos ya contiene datos. Para reimportar, elimina los datos primero.');
      await connection.end();
      return;
    }
    
    // Leer archivo Excel
    const excelPath = path.join(__dirname, '..', 'MUESTRA DE DATA CENTURY.xlsx');
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Archivo Excel no encontrado: ${excelPath}`);
    }
    
    console.log('📖 Leyendo archivo Excel...');
    const workbook = XLSX.readFile(excelPath);
    
    const sellInData = XLSX.utils.sheet_to_json(workbook.Sheets['Sell In']);
    const sellOutData = XLSX.utils.sheet_to_json(workbook.Sheets['Sell Out']);
    const inventarioData = XLSX.utils.sheet_to_json(workbook.Sheets['Inventario']);
    
    console.log(`✅ Excel leído: ${sellInData.length} Sell In, ${sellOutData.length} Sell Out, ${inventarioData.length} Inventario`);
    
    // Insertar datos
    await insertSellIn(connection, sellInData);
    await insertSellOut(connection, sellOutData);
    await insertInventario(connection, inventarioData);
    
    // Actualizar registro de sincronización
    await connection.query(
      'INSERT INTO data_sync (table_name, records_count, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE records_count = ?, status = ?, last_sync = NOW()',
      ['sell_in', sellInData.length, 'completed', sellInData.length, 'completed']
    );
    await connection.query(
      'INSERT INTO data_sync (table_name, records_count, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE records_count = ?, status = ?, last_sync = NOW()',
      ['sell_out', sellOutData.length, 'completed', sellOutData.length, 'completed']
    );
    await connection.query(
      'INSERT INTO data_sync (table_name, records_count, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE records_count = ?, status = ?, last_sync = NOW()',
      ['inventario', inventarioData.length, 'completed', inventarioData.length, 'completed']
    );
    
    console.log('\n🎉 ¡Datos cargados exitosamente en MySQL!');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  loadDataFromExcel();
}

export { loadDataFromExcel, initDatabase };

