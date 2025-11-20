// Script wrapper para inicializar la base de datos
// Se ejecuta desde server/ y carga las dependencias locales
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
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
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
  }).filter(row => row[0] !== null);
  
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
    
    const hasSellIn = sellInRows[0].count > 0;
    const hasSellOut = sellOutRows[0].count > 0;
    const hasInventario = inventarioRows[0].count > 0;
    
    // Si todas las tablas tienen datos, no hacer nada
    if (hasSellIn && hasSellOut && hasInventario) {
      console.log('ℹ️  La base de datos ya contiene datos en todas las tablas.');
      console.log(`   Sell In: ${sellInRows[0].count} registros`);
      console.log(`   Sell Out: ${sellOutRows[0].count} registros`);
      console.log(`   Inventario: ${inventarioRows[0].count} registros`);
      console.log('   Para reimportar todo, elimina los datos primero.');
      await connection.end();
      return;
    }
    
    // Si alguna tabla está vacía, continuar con la carga
    if (hasSellIn || hasSellOut || hasInventario) {
      console.log('ℹ️  Algunas tablas ya tienen datos:');
      console.log(`   Sell In: ${sellInRows[0].count} registros`);
      console.log(`   Sell Out: ${sellOutRows[0].count} registros`);
      console.log(`   Inventario: ${inventarioRows[0].count} registros`);
      console.log('   Continuando con la carga de datos faltantes...\n');
    }
    
    // Leer archivo Excel
    const excelPath = path.join(__dirname, '..', 'MUESTRA DE DATA CENTURY.xlsx');
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Archivo Excel no encontrado: ${excelPath}`);
    }
    
    console.log('📖 Leyendo archivos Excel...');
    
    // Leer el workbook principal
    const workbook = XLSX.readFile(excelPath, { 
      cellDates: true,
      sheetStubs: true,
      defval: null
    });
    
    console.log('Hojas encontradas en archivo principal:', workbook.SheetNames);
    console.log('Hojas accesibles en Sheets:', Object.keys(workbook.Sheets));
    
    // Intentar leer Sell Out desde archivo separado (CSV o Excel)
    let sellOutData = [];
    
    // Intentar CSV primero (más confiable)
    const sellOutCsvPath = path.join(__dirname, '..', 'Sell Out.csv');
    const sellOutXlsxPath = path.join(__dirname, '..', 'Sell Out.xlsx');
    
    if (fs.existsSync(sellOutCsvPath)) {
      console.log('📄 Archivo "Sell Out.csv" encontrado, leyendo desde ahí...');
      try {
        // Leer CSV
        const csvContent = fs.readFileSync(sellOutCsvPath, 'utf8');
        // Convertir CSV a JSON usando XLSX
        const csvWorkbook = XLSX.read(csvContent, { type: 'string', codepage: 65001 });
        if (csvWorkbook.SheetNames.length > 0) {
          const sheetName = csvWorkbook.SheetNames[0];
          sellOutData = XLSX.utils.sheet_to_json(csvWorkbook.Sheets[sheetName], { 
            defval: null,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });
          console.log(`✅ Sell Out leído desde CSV: ${sellOutData.length} filas`);
        }
      } catch (error) {
        console.log(`⚠️  Error leyendo Sell Out.csv: ${error.message}`);
      }
    } else if (fs.existsSync(sellOutXlsxPath)) {
      console.log('📄 Archivo "Sell Out.xlsx" encontrado, leyendo desde ahí...');
      try {
        let sellOutWorkbook = null;
        // Intentar con diferentes configuraciones
        const configs = [
          { cellDates: true, defval: null },
          { cellDates: true, defval: null, sheetStubs: true },
          { cellDates: true, defval: null, sheetStubs: false },
          { cellDates: false, defval: null },
          {} // default
        ];
        
        for (const config of configs) {
          sellOutWorkbook = XLSX.readFile(sellOutXlsxPath, config);
          if (sellOutWorkbook.Sheets && Object.keys(sellOutWorkbook.Sheets).length > 0) {
            console.log(`✅ Archivo Excel leído correctamente`);
            break;
          }
        }
        
        if (sellOutWorkbook && sellOutWorkbook.SheetNames.length > 0) {
          const sheetName = sellOutWorkbook.SheetNames[0];
          const sheet = sellOutWorkbook.Sheets[sheetName];
          if (sheet && sheet['!ref']) {
            sellOutData = XLSX.utils.sheet_to_json(sheet, { 
              defval: null,
              raw: false,
              dateNF: 'yyyy-mm-dd'
            });
            console.log(`✅ Sell Out leído desde Excel: ${sellOutData.length} filas`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Error leyendo Sell Out.xlsx: ${error.message}`);
      }
    }
    
    // Función helper para leer una hoja con múltiples intentos
    const readSheet = (sheetName, sheetIndex = null) => {
      let data = [];
      
      // Método 1: Intentar por nombre directo
      if (workbook.Sheets[sheetName]) {
        try {
          data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { 
            defval: null,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });
          if (data.length > 0) {
            console.log(`✅ "${sheetName}" leído por nombre directo: ${data.length} filas`);
            return data;
          }
        } catch (error) {
          console.log(`⚠️  Error leyendo "${sheetName}" por nombre: ${error.message}`);
        }
      }
      
      // Método 2: Intentar por índice si se proporciona
      if (sheetIndex !== null && sheetIndex >= 0 && sheetIndex < workbook.SheetNames.length) {
        const nameFromIndex = workbook.SheetNames[sheetIndex];
        if (workbook.Sheets[nameFromIndex]) {
          try {
            data = XLSX.utils.sheet_to_json(workbook.Sheets[nameFromIndex], { 
              defval: null,
              raw: false,
              dateNF: 'yyyy-mm-dd'
            });
            if (data.length > 0) {
              console.log(`✅ "${sheetName}" leído por índice ${sheetIndex}: ${data.length} filas`);
              return data;
            }
          } catch (error) {
            console.log(`⚠️  Error leyendo "${sheetName}" por índice: ${error.message}`);
          }
        }
      }
      
      // Método 3: Buscar por índice si no se proporcionó
      const index = workbook.SheetNames.indexOf(sheetName);
      if (index >= 0 && index !== sheetIndex) {
        const nameFromIndex = workbook.SheetNames[index];
        if (workbook.Sheets[nameFromIndex]) {
          try {
            data = XLSX.utils.sheet_to_json(workbook.Sheets[nameFromIndex], { 
              defval: null,
              raw: false,
              dateNF: 'yyyy-mm-dd'
            });
            if (data.length > 0) {
              console.log(`✅ "${sheetName}" leído por índice encontrado: ${data.length} filas`);
              return data;
            }
          } catch (error) {
            console.log(`⚠️  Error leyendo "${sheetName}" por índice encontrado: ${error.message}`);
          }
        }
      }
      
      // Método 4: Releer el archivo con diferentes opciones
      if (data.length === 0) {
        console.log(`🔄 Reintentando leer "${sheetName}" con opciones alternativas...`);
        try {
          const workbookAlt = XLSX.readFile(excelPath, { 
            cellDates: true,
            defval: null,
            raw: false,
            sheetStubs: false  // No incluir hojas vacías
          });
          
          if (workbookAlt.Sheets[sheetName]) {
            data = XLSX.utils.sheet_to_json(workbookAlt.Sheets[sheetName], { 
              defval: null,
              raw: false,
              dateNF: 'yyyy-mm-dd'
            });
            if (data.length > 0) {
              console.log(`✅ "${sheetName}" leído con método alternativo: ${data.length} filas`);
              return data;
            }
          }
        } catch (error) {
          console.log(`⚠️  Error en método alternativo: ${error.message}`);
        }
      }
      
      // Si no se encuentra, la hoja puede estar oculta o vacía
      if (data.length === 0) {
        console.log(`⚠️  Advertencia: No se pudo acceder a la hoja "${sheetName}" o está vacía`);
      }
      return data;
    };
    
    // Leer todas las hojas
    // Sell In es la primera hoja (índice 0)
    const sellInData = readSheet('Sell In', 0);
    
    // Sell Out ya se leyó arriba desde archivo separado (CSV o Excel)
    // Si no se pudo leer desde archivo separado, intentar desde el archivo principal
    if (sellOutData.length === 0) {
      console.log('Intentando leer Sell Out desde archivo principal...');
      sellOutData = readSheet('Sell Out', 1);
    }
    
    // Inventario es la tercera hoja (índice 2)
    const inventarioData = readSheet('Inventario', 2);
    
    console.log(`✅ Excel leído: ${sellInData.length} Sell In, ${sellOutData.length} Sell Out, ${inventarioData.length} Inventario`);
    
    // Insertar datos solo si las tablas están vacías o si hay datos nuevos
    if (!hasSellIn && sellInData.length > 0) {
      await insertSellIn(connection, sellInData);
    } else if (hasSellIn) {
      console.log('⏭️  Sell In ya tiene datos, omitiendo inserción');
    }
    
    if (!hasSellOut && sellOutData.length > 0) {
      await insertSellOut(connection, sellOutData);
    } else if (hasSellOut) {
      console.log('⏭️  Sell Out ya tiene datos, omitiendo inserción');
    } else if (sellOutData.length === 0) {
      console.log('⚠️  Sell Out está vacío en el Excel, no se insertaron datos');
    }
    
    if (!hasInventario && inventarioData.length > 0) {
      await insertInventario(connection, inventarioData);
    } else if (hasInventario) {
      console.log('⏭️  Inventario ya tiene datos, omitiendo inserción');
    }
    
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

// Ejecutar
loadDataFromExcel();

