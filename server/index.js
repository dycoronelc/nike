import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { predictSales, calculateClusters, calculateProductClusters, calculateSucursalClusters, analyzeQuery } from './ml-service.js';
import * as db from './db.js';
import { testConnection } from './db.js';
import * as cache from './cache.js';

// Cargar variables de entorno desde la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Verificar conexión a MySQL al iniciar
let dbConnected = false;

const initDatabase = async () => {
  try {
    dbConnected = await testConnection();
    if (dbConnected) {
      console.log('✅ Conexión a MySQL establecida');
      // Inicializar tabla de usuarios si no existe
      await db.initializeUsersTable();
    } else {
      console.error('❌ No se pudo conectar a MySQL. Verifica la configuración.');
    }
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
  }
};

initDatabase();

// Endpoints de datos
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    status: 'ok', 
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Endpoint para obtener opciones de filtros
app.get('/api/filter-options', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const options = await db.getFilterOptions();
    res.json(options);
  } catch (error) {
    console.error('Error obteniendo opciones de filtros:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/kpis', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const filtersKey = JSON.stringify(filters);
    
    // Cache solo si no hay filtros activos (filtros cambian frecuentemente)
    const cacheKey = filtersKey === '{}' ? 'kpis:default' : null;
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('✅ KPIs obtenidos del cache');
        return res.json(cached);
      }
    }
    
    const kpis = await db.getKPIsWithFilters(filters);
    
    // Guardar en cache solo si no hay filtros (5 minutos)
    if (cacheKey) {
      cache.set(cacheKey, kpis, 5 * 60 * 1000);
    }
    
    res.json(kpis);
  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sell-in', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const { limit = 1000, offset = 0 } = req.query;
    const result = await db.getSellIn(parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo Sell In:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sell-out', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const { limit = 1000, offset = 0 } = req.query;
    const result = await db.getSellOut(parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo Sell Out:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventario', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const { limit = 1000, offset = 0 } = req.query;
    const result = await db.getInventario(parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo Inventario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/time-series', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const timeSeries = await db.getTimeSeriesWithFilters(filters);
    res.json(timeSeries);
  } catch (error) {
    console.error('Error obteniendo series temporales:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/predictions', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    // Intentar obtener del cache primero
    const cacheKey = 'predictions';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Predicciones obtenidas del cache');
      return res.json(cached);
    }
    
    const timeSeries = await db.getTimeSeries();
    const predictions = await predictSales(timeSeries);
    
    // Guardar en cache por 10 minutos (predicciones cambian poco)
    cache.set(cacheKey, predictions, 10 * 60 * 1000);
    
    res.json(predictions);
  } catch (error) {
    console.error('Error generando predicciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clusters', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const timeSeries = await db.getTimeSeries();
    const kpis = await db.getKPIs();
    const generoByMonth = await db.getGeneroArregladoByMonth();
    const processedData = {
      timeSeries,
      kpis
    };
    const clusters = await calculateClusters(processedData);
    
    // Agregar datos de genero_arreglado agrupados por cluster
    const generoByCluster = {};
    clusters.clusters.forEach(item => {
      const clusterId = item.cluster;
      if (!generoByCluster[clusterId]) {
        generoByCluster[clusterId] = {};
      }
      
      // Obtener datos de género para este mes
      const generosDelMes = generoByMonth[item.fecha] || {};
      Object.keys(generosDelMes).forEach(genero => {
        if (!generoByCluster[clusterId][genero]) {
          generoByCluster[clusterId][genero] = { ventas: 0, cantidad: 0 };
        }
        generoByCluster[clusterId][genero].ventas += generosDelMes[genero].ventas;
        generoByCluster[clusterId][genero].cantidad += generosDelMes[genero].cantidad;
      });
    });

    // Convertir a formato para el gráfico
    const generoChartData = clusters.caracteristicas.map(cluster => {
      const generos = generoByCluster[cluster.cluster] || {};
      return {
        cluster: cluster.cluster,
        nombre: cluster.nombre,
        generos: Object.keys(generos).map(genero => ({
          genero,
          ventas: generos[genero].ventas,
          cantidad: generos[genero].cantidad
        }))
      };
    });

    res.json({
      ...clusters,
      generoArreglado: generoChartData
    });
  } catch (error) {
    console.error('Error calculando clusters:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para clustering de productos
app.get('/api/clusters/productos', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    // Si se solicita forzar recálculo, limpiar cache
    const forceRecalc = req.query.force === 'true';
    const cacheKey = 'clusters:productos';
    
    if (forceRecalc) {
      cache.del(cacheKey);
      console.log('🔄 Cache de productos invalidado, forzando recálculo...');
    }
    
    // Intentar obtener del cache primero (si no se forzó recálculo)
    if (!forceRecalc) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('✅ Clusters de productos obtenidos del cache');
        return res.json(cached);
      }
    }
    
    console.log('📦 Obteniendo datos de productos para clustering...');
    const productosData = await db.getProductosForClustering();
    console.log(`✅ Productos obtenidos: ${productosData.length}`);
    
    console.log('🔍 Calculando clusters de productos...');
    const clusters = await calculateProductClusters(productosData);
    console.log(`✅ Clusters calculados: ${clusters.caracteristicas?.length || 0} clusters`);
    
    // Guardar en cache por 15 minutos (clusters cambian poco)
    cache.set(cacheKey, clusters, 15 * 60 * 1000);
    
    res.json(clusters);
  } catch (error) {
    console.error('❌ Error calculando clusters de productos:', error);
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para clustering de sucursales
app.get('/api/clusters/sucursales', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    // Si se solicita forzar recálculo, limpiar cache
    const forceRecalc = req.query.force === 'true';
    const cacheKey = 'clusters:sucursales';
    
    if (forceRecalc) {
      cache.del(cacheKey);
      console.log('🔄 Cache de sucursales invalidado, forzando recálculo...');
    }
    
    // Intentar obtener del cache primero (si no se forzó recálculo)
    if (!forceRecalc) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('✅ Clusters de sucursales obtenidos del cache');
        return res.json(cached);
      }
    }
    
    console.log('🏪 Obteniendo datos de sucursales para clustering...');
    const sucursalesData = await db.getSucursalesForClustering();
    console.log(`✅ Sucursales obtenidas: ${sucursalesData.length}`);
    
    console.log('🔍 Calculando clusters de sucursales...');
    const clusters = await calculateSucursalClusters(sucursalesData);
    console.log(`✅ Clusters calculados: ${clusters.caracteristicas?.length || 0} clusters`);
    
    // Guardar en cache por 15 minutos (clusters cambian poco)
    cache.set(cacheKey, clusters, 15 * 60 * 1000);
    
    res.json(clusters);
  } catch (error) {
    console.error('❌ Error calculando clusters de sucursales:', error);
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para datos de gráfico de dispersión
app.get('/api/scatter-data', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    // Intentar obtener del cache primero
    const cacheKey = 'scatter-data';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Datos de dispersión obtenidos del cache');
      return res.json(cached);
    }
    
    const scatterData = await db.getScatterDataSellInVsSellOut();
    
    // Guardar en cache por 10 minutos
    cache.set(cacheKey, scatterData, 10 * 60 * 1000);
    
    res.json(scatterData);
  } catch (error) {
    console.error('Error obteniendo datos de dispersión:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para métricas de optimización de inventario
app.get('/api/inventory-optimization', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    // Intentar obtener del cache primero
    const cacheKey = 'inventory-optimization';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Métricas de optimización obtenidas del cache');
      return res.json(cached);
    }
    
    const metrics = await db.getInventoryOptimizationMetrics();
    
    // Guardar en cache por 10 minutos
    cache.set(cacheKey, metrics, 10 * 60 * 1000);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error obteniendo métricas de optimización:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para limpiar cache (útil después de actualizar datos)
app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    if (pattern) {
      cache.invalidatePattern(pattern);
      res.json({ message: `Cache limpiado para patrón: ${pattern}` });
    } else {
      cache.clear();
      res.json({ message: 'Todo el cache ha sido limpiado' });
    }
  } catch (error) {
    console.error('Error limpiando cache:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para estadísticas del cache (debugging)
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de cache:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint del chatbot
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }

  try {
    // Obtener datos necesarios desde MySQL
    const timeSeries = await db.getTimeSeries();
    const kpis = await db.getKPIs();
    const processedData = {
      timeSeries,
      kpis
    };
    
    // Para consultas que necesitan datos raw, obtenerlos bajo demanda
    const rawData = {
      getSucursales: () => db.getSucursalesData(),
      getProductos: () => db.getProductosData()
    };
    
    const response = await analyzeQuery(message, processedData, rawData);
    res.json(response);
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para top productos
app.get('/api/top-productos', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const limit = parseInt(req.query.limit) || 3;
    const productos = await db.getTopProductos(limit);
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo top productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para top sucursales
app.get('/api/top-sucursales', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  try {
    const limit = parseInt(req.query.limit) || 3;
    const sucursales = await db.getTopSucursales(limit);
    res.json(sucursales);
  } catch (error) {
    console.error('Error obteniendo top sucursales:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de login
app.post('/api/login', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    
    // Intentar inicializar tabla si no existe (por si acaso)
    try {
      await db.initializeUsersTable();
    } catch (initError) {
      console.error('Error inicializando tabla de usuarios:', initError.message);
    }
    
    const user = await db.authenticateUser(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Retornar información del usuario (sin la contraseña)
    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        nombreCompleto: user.nombreCompleto,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  // Invalidar cache de clusters al iniciar para forzar recálculo con código nuevo
  cache.del('clusters:productos');
  cache.del('clusters:sucursales');
  console.log('🔄 Cache de clusters invalidado al iniciar servidor');
});

