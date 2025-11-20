// Script para cargar Sell Out desde archivo CSV
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

const csvPath = path.join(__dirname, '..', 'Sell Out.csv');

console.log('📖 Cargando Sell Out desde archivo CSV...\n');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Archivo no encontrado: ${csvPath}`);
  console.error('   Por favor, guarda la hoja "Sell Out" como "Sell Out.csv" en la raíz del proyecto');
  process.exit(1);
}

// Leer CSV
console.log('Leyendo archivo CSV...');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Detectar encoding si es necesario
let workbook;
try {
  workbook = XLSX.read(csvContent, { 
    type: 'string',
    codepage: 65001, // UTF-8
    defval: null
  });
} catch (error) {
  // Intentar con otro encoding
  console.log('Intento con encoding alternativo...');
  try {
    const csvContentLatin1 = fs.readFileSync(csvPath, 'latin1');
    workbook = XLSX.read(csvContentLatin1, { 
      type: 'string',
      defval: null
    });
  } catch (error2) {
    console.error(`❌ Error leyendo CSV: ${error2.message}`);
    process.exit(1);
  }
}

if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
  console.error('❌ No se encontraron hojas en el archivo CSV');
  process.exit(1);
}

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

if (!sheet || !sheet['!ref']) {
  console.error('❌ El archivo CSV parece estar vacío');
  process.exit(1);
}

console.log(`✅ Archivo CSV leído correctamente`);
console.log(`   Rango: ${sheet['!ref']}`);

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(sheet, { 
  defval: null,
  raw: false,
  dateNF: 'yyyy-mm-dd'
});

console.log(`✅ Datos convertidos: ${data.length} filas`);
if (data.length > 0) {
  console.log(`   Primeras columnas: ${Object.keys(data[0]).slice(0, 10).join(', ')}`);
  console.log(`   Primera fila muestra:`, Object.values(data[0]).slice(0, 5).join(', '));
}

// Conectar a la base de datos e insertar
const connection = await mysql.createConnection(dbConfig);

// Truncar tabla primero
console.log('\n🗑️  Limpiando tabla sell_out...');
await connection.query('TRUNCATE TABLE sell_out');

// Funciones helper para convertir fecha
const excelDateToJSDate = (excelDate) => {
  // Si es un número (fecha serial de Excel)
  if (typeof excelDate === 'number') {
    // Excel usa el 1 de enero de 1900 como día 1
    // Pero Excel tiene un bug: piensa que 1900 fue bisiesto (no lo fue)
    // Entonces usamos el 30 de diciembre de 1899 como día 0
    const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
    const days = Math.floor(excelDate);
    const milliseconds = (excelDate - days) * 86400000;
    return new Date(excelEpoch.getTime() + days * 86400000 + milliseconds);
  }
  // Si es un string con formato de fecha
  if (typeof excelDate === 'string') {
    // Intentar diferentes formatos
    const trimmed = excelDate.trim();
    if (!trimmed) return null;
    
    // Formato ISO (YYYY-MM-DD o YYYY-MM-DD HH:mm:ss)
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) return isoDate;
    
    // Formato español común (DD/MM/YYYY)
    const parts = trimmed.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    
    // Si no se puede parsear, retornar null
    return null;
  }
  // Si ya es un objeto Date
  if (excelDate instanceof Date) {
    return isNaN(excelDate.getTime()) ? null : excelDate;
  }
  return null;
};

const cleanValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  return value;
};

// Insertar datos
console.log('\n📥 Insertando datos...');
const sql = `INSERT INTO sell_out (
  fecha, temp, mes, año, cuenta, canal, codigo_marca, genero_desc,
  genero_arreglado, sucursal, nombre_sucursal, categoria, familia,
  silueta, cantidad, ventas, ventas_moneda_local, temp_code, bu, comp_noncomp
) VALUES ?`;

const values = data.map((item, index) => {
  // Convertir fecha - puede estar como número (serial de Excel) o string
  let fecha = null;
  if (item.Fecha !== null && item.Fecha !== undefined && item.Fecha !== '') {
    // Si es número, es una fecha serial de Excel
    if (typeof item.Fecha === 'number') {
      fecha = excelDateToJSDate(item.Fecha);
    } else {
      // Intentar convertir string a número primero (por si viene como string numérico)
      const fechaNum = parseFloat(item.Fecha);
      if (!isNaN(fechaNum) && typeof item.Fecha !== 'string') {
        fecha = excelDateToJSDate(fechaNum);
      } else {
        fecha = excelDateToJSDate(item.Fecha);
      }
    }
  }
  
  return [
    fecha,
    cleanValue(item.Temp),
    cleanValue(item.Mes),
    cleanValue(item['Año'] || item.Año),
    cleanValue(item.Cuenta),
    cleanValue(item.Canal),
    cleanValue(item['Codigo Marca'] || item['CodigoMarca']),
    cleanValue(item['Genero Desc'] || item['GeneroDesc']),
    cleanValue(item['GENERO ARREGLADO'] || item['GENEROARREGLADO']),
    cleanValue(item.Sucursal),
    cleanValue(item['Nombre Sucursal'] || item['NombreSucursal']),
    cleanValue(item.Categoria),
    cleanValue(item.Familia),
    cleanValue(item.Silueta),
    cleanValue(item.Cantidad),
    cleanValue(item.Ventas),
    cleanValue(item['Ventas Moneda Local'] || item['VentasMonedaLocal']),
    cleanValue(item['TEMP '] || item['TEMP']),
    cleanValue(item.BU),
    cleanValue(item['COMP/NONCOMP'] || item['COMPNONCOMP'])
  ];
}).filter(row => {
  // Filtrar filas que no tengan fecha válida
  if (!row[0]) {
    return false;
  }
  return true;
});

console.log(`Preparando ${values.length} registros válidos de ${data.length} totales...`);

const batchSize = 1000;
let inserted = 0;
for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  await connection.query(sql, [batch]);
  inserted += batch.length;
  process.stdout.write(`\r   Progreso: ${inserted}/${values.length}`);
}

console.log('\n✅ Sell Out cargado exitosamente!');
console.log(`   Total registros insertados: ${inserted}`);

await connection.end();
process.exit(0);

