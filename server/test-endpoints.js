// Script de prueba para validar los nuevos endpoints
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import * as db from './db.js';
import { calculateProductClusters, calculateSucursalClusters, predictSales } from './ml-service.js';

async function testEndpoints() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');

  try {
    // Test 1: Obtener datos de productos para clustering
    console.log('📦 Test 1: Obteniendo datos de productos para clustering...');
    const productosData = await db.getProductosForClustering();
    console.log(`✅ Productos obtenidos: ${productosData.length}`);
    if (productosData.length > 0) {
      console.log(`   Ejemplo: ${productosData[0].silueta} - Ventas: $${productosData[0].ventas_totales.toLocaleString()}`);
    }
    console.log('');

    // Test 2: Clustering de productos
    console.log('🔍 Test 2: Calculando clusters de productos...');
    if (productosData.length >= 6) {
      const productClusters = await calculateProductClusters(productosData);
      console.log(`✅ Clusters de productos calculados: ${productClusters.caracteristicas.length}`);
      productClusters.caracteristicas.forEach(cluster => {
        console.log(`   - ${cluster.nombre}: ${cluster.cantidad} productos`);
      });
    } else {
      console.log('⚠️  No hay suficientes productos para clustering (mínimo 6)');
    }
    console.log('');

    // Test 3: Obtener datos de sucursales para clustering
    console.log('🏪 Test 3: Obteniendo datos de sucursales para clustering...');
    const sucursalesData = await db.getSucursalesForClustering();
    console.log(`✅ Sucursales obtenidas: ${sucursalesData.length}`);
    if (sucursalesData.length > 0) {
      console.log(`   Ejemplo: ${sucursalesData[0].nombre_sucursal} - Ventas: $${sucursalesData[0].ventas_totales_sucursal.toLocaleString()}`);
    }
    console.log('');

    // Test 4: Clustering de sucursales
    console.log('🔍 Test 4: Calculando clusters de sucursales...');
    if (sucursalesData.length >= 5) {
      const sucursalClusters = await calculateSucursalClusters(sucursalesData);
      console.log(`✅ Clusters de sucursales calculados: ${sucursalClusters.caracteristicas.length}`);
      sucursalClusters.caracteristicas.forEach(cluster => {
        console.log(`   - ${cluster.nombre}: ${cluster.cantidad} sucursales`);
      });
    } else {
      console.log('⚠️  No hay suficientes sucursales para clustering (mínimo 5)');
    }
    console.log('');

    // Test 5: Predicciones con nuevo modelo Prophet-like
    console.log('🔮 Test 5: Probando predicciones con modelo Prophet-like...');
    const timeSeries = await db.getTimeSeries();
    if (timeSeries && timeSeries.length >= 2) {
      const predictions = await predictSales(timeSeries, 3);
      console.log(`✅ Predicciones generadas: ${predictions.predicciones.length} meses`);
      console.log(`   Modelo: ${predictions.modelo}`);
      console.log(`   R²: ${predictions.metrica.r2.toFixed(3)}`);
      console.log(`   RMSE: ${predictions.metrica.rmse.toFixed(2)}`);
      console.log(`   Estacionalidad detectada: ${predictions.metrica.estacionalidad_detectada ? 'Sí' : 'No'}`);
      predictions.predicciones.forEach(pred => {
        console.log(`   - ${pred.fecha}: $${pred.prediccion.toLocaleString('es-CO', { maximumFractionDigits: 0 })} (confianza: ${pred.confianza.toFixed(1)}%)`);
      });
    } else {
      console.log('⚠️  No hay suficientes datos temporales para predicciones (mínimo 2 meses)');
    }
    console.log('');

    console.log('✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// Ejecutar pruebas
testEndpoints();

