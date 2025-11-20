import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '..', 'MUESTRA DE DATA CENTURY.xlsx');

console.log('🔍 Diagnóstico detallado de la hoja "Sell Out"\n');
console.log('=' .repeat(60));

// Leer con diferentes configuraciones
const configs = [
  { name: 'Configuración 1: Default', opts: {} },
  { name: 'Configuración 2: Con sheetStubs', opts: { sheetStubs: true } },
  { name: 'Configuración 3: Sin sheetStubs', opts: { sheetStubs: false } },
  { name: 'Configuración 4: Con cellDates', opts: { cellDates: true } },
  { name: 'Configuración 5: Completa', opts: { cellDates: true, sheetStubs: true, defval: null } },
];

configs.forEach((config, idx) => {
  console.log(`\n${config.name}:`);
  try {
    const workbook = XLSX.readFile(excelPath, config.opts);
    console.log(`  SheetNames: ${workbook.SheetNames.join(', ')}`);
    console.log(`  Sheets disponibles: ${Object.keys(workbook.Sheets).join(', ')}`);
    
    const sellOutIndex = workbook.SheetNames.indexOf('Sell Out');
    console.log(`  Índice de "Sell Out": ${sellOutIndex}`);
    
    if (sellOutIndex >= 0) {
      const sheetName = workbook.SheetNames[sellOutIndex];
      const sheet = workbook.Sheets[sheetName];
      
      if (sheet) {
        console.log(`  ✅ Hoja encontrada: "${sheetName}"`);
        console.log(`  Rango: ${sheet['!ref'] || 'sin rango'}`);
        
        if (sheet['!ref']) {
          const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
          console.log(`  Filas: ${data.length}`);
          if (data.length > 0) {
            console.log(`  Columnas: ${Object.keys(data[0]).length}`);
            console.log(`  Primeras columnas: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
            return; // Si encontramos datos, salir
          }
        } else {
          console.log(`  ⚠️  Hoja sin rango (posiblemente vacía)`);
        }
      } else {
        console.log(`  ❌ Hoja "${sheetName}" no está en workbook.Sheets`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
});

// Intentar leer usando el método de lectura de hojas individuales
console.log('\n' + '='.repeat(60));
console.log('\nIntentando lectura directa por índice...\n');

try {
  const workbook = XLSX.readFile(excelPath);
  const sellOutIndex = workbook.SheetNames.indexOf('Sell Out');
  
  if (sellOutIndex >= 0) {
    console.log(`Índice: ${sellOutIndex}`);
    console.log(`Nombre: "${workbook.SheetNames[sellOutIndex]}"`);
    
    // Intentar acceder usando diferentes métodos
    const methods = [
      () => workbook.Sheets['Sell Out'],
      () => workbook.Sheets[workbook.SheetNames[sellOutIndex]],
      () => {
        // Intentar leer el archivo especificando el índice
        const wb2 = XLSX.readFile(excelPath, { 
          sheet: sellOutIndex,
          cellDates: true 
        });
        return wb2.Sheets[wb2.SheetNames[0]];
      }
    ];
    
    for (let i = 0; i < methods.length; i++) {
      try {
        const sheet = methods[i]();
        if (sheet && sheet['!ref']) {
          console.log(`\n✅ Método ${i + 1} funcionó!`);
          const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
          console.log(`Filas leídas: ${data.length}`);
          if (data.length > 0) {
            console.log('Primera fila (primeras 5 columnas):');
            const firstRow = data[0];
            Object.keys(firstRow).slice(0, 5).forEach(key => {
              console.log(`  ${key}: ${firstRow[key]}`);
            });
            break;
          }
        }
      } catch (error) {
        console.log(`Método ${i + 1} falló: ${error.message}`);
      }
    }
  }
} catch (error) {
  console.error('Error general:', error);
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Recomendaciones:');
console.log('1. Verifica que la hoja "Sell Out" no esté oculta en Excel');
console.log('2. Asegúrate de que la hoja tenga al menos una fila de datos');
console.log('3. Guarda el archivo Excel después de hacer cambios');
console.log('4. Si la hoja tiene filtros, asegúrate de que estén aplicados correctamente');

