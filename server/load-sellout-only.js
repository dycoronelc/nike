// Script para cargar solo Sell Out desde el archivo separado
import XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard',
  charset: 'utf8mb4'
};

const sellOutPath = path.join(__dirname, '..', 'Sell Out.xlsx');

console.log('📖 Cargando Sell Out desde archivo separado...\n');

if (!fs.existsSync(sellOutPath)) {
  console.error(`❌ Archivo no encontrado: ${sellOutPath}`);
  process.exit(1);
}

// Intentar leer con todas las opciones posibles
let workbook = null;
let data = [];

const configs = [
  {},
  { cellDates: true },
  { cellDates: true, defval: null },
  { cellDates: true, defval: null, sheetStubs: true },
  { cellDates: true, defval: null, sheetStubs: false },
  { cellDates: false, defval: null },
  { raw: false },
  { raw: true }
];

for (const config of configs) {
  try {
    workbook = XLSX.readFile(sellOutPath, config);
    const sheetNames = workbook.SheetNames || [];
    const sheets = workbook.Sheets || {};
    
    console.log(`Intento con ${JSON.stringify(config)}:`);
    console.log(`  SheetNames: ${sheetNames.join(', ')}`);
    console.log(`  Sheets keys: ${Object.keys(sheets).join(', ')}`);
    
    if (Object.keys(sheets).length > 0) {
      const sheetName = Object.keys(sheets)[0];
      const sheet = sheets[sheetName];
      
      if (sheet && sheet['!ref']) {
        console.log(`  ✅ Rango encontrado: ${sheet['!ref']}`);
        data = XLSX.utils.sheet_to_json(sheet, { 
          defval: null,
          raw: false
        });
        console.log(`  ✅ Datos leídos: ${data.length} filas\n`);
        break;
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

if (data.length === 0) {
  console.error('❌ No se pudieron leer datos del archivo Sell Out.xlsx');
  console.error('\nPosibles causas:');
  console.error('1. La hoja está oculta en Excel');
  console.error('2. La hoja está completamente vacía (sin datos)');
  console.error('3. Hay un problema con el formato del archivo');
  console.error('\nSolución:');
  console.error('1. Abre el archivo Sell Out.xlsx en Excel');
  console.error('2. Verifica que haya datos visibles');
  console.error('3. Si la hoja está oculta, haz clic derecho > Mostrar');
  console.error('4. Guarda el archivo y vuelve a ejecutar este script');
  process.exit(1);
}

console.log(`✅ Se leyeron ${data.length} registros`);
console.log(`Primeras columnas: ${Object.keys(data[0]).slice(0, 10).join(', ')}\n`);

// Conectar a la base de datos e insertar
const connection = await mysql.createConnection(dbConfig);

// Truncar tabla primero
console.log('🗑️  Limpiando tabla sell_out...');
await connection.query('TRUNCATE TABLE sell_out');

// Funciones helper
const excelDateToJSDate = (excelDate) => {
  if (typeof excelDate === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + excelDate * 86400000);
  }
  if (typeof excelDate === 'string') {
    return new Date(excelDate);
  }
  return null;
};

const cleanValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  return value;
};

// Insertar datos
console.log('📥 Insertando datos...');
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

console.log(`Preparando ${values.length} registros para insertar...`);

const batchSize = 1000;
for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  await connection.query(sql, [batch]);
  process.stdout.write(`\r   Progreso: ${Math.min(i + batch.length, values.length)}/${values.length}`);
}

console.log('\n✅ Sell Out cargado exitosamente!');

await connection.end();
process.exit(0);

