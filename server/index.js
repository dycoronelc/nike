import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { predictSales, calculateClusters, analyzeQuery } from './ml-service.js';
import * as db from './db.js';
import { testConnection } from './db.js';

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
    const kpis = await db.getKPIsWithFilters(filters);
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
    const timeSeries = await db.getTimeSeries();
    const predictions = await predictSales(timeSeries);
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

