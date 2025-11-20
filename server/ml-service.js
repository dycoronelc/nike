import { mean, standardDeviation, linearRegression } from 'simple-statistics';
import { Matrix } from 'ml-matrix';

// Predicción de ventas usando regresión lineal
export async function predictSales(timeSeries, monthsAhead = 3) {
  if (!timeSeries || timeSeries.length < 2) {
    throw new Error('Datos insuficientes para predicción');
  }

  const data = timeSeries.map((item, index) => ({
    x: index,
    y: item.sellIn.ventas + item.sellOut.ventas
  }));

  const regression = linearRegression(data.map(d => [d.x, d.y]));
  
  const lastIndex = data.length - 1;
  const predictions = [];

  for (let i = 1; i <= monthsAhead; i++) {
    const futureX = lastIndex + i;
    const predictedY = regression.m * futureX + regression.b;
    const futureDate = new Date(timeSeries[lastIndex].fecha + '-01');
    futureDate.setMonth(futureDate.getMonth() + i);
    const futureKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    // Calcular intervalo de confianza (simplificado)
    const residuals = data.map(d => d.y - (regression.m * d.x + regression.b));
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    
    predictions.push({
      fecha: futureKey,
      prediccion: Math.max(0, predictedY),
      intervaloSuperior: Math.max(0, predictedY + 1.96 * rmse),
      intervaloInferior: Math.max(0, predictedY - 1.96 * rmse),
      confianza: Math.max(0, Math.min(100, 100 - (rmse / Math.abs(predictedY)) * 100))
    });
  }

  // Preparar datos históricos para el gráfico (últimos 12 meses o todos si hay menos)
  const monthsToShow = Math.min(12, data.length);
  const startIndex = Math.max(0, data.length - monthsToShow);
  const historicalData = data.slice(startIndex).map((item, idx) => {
    const actualIndex = startIndex + idx;
    const predictedY = regression.m * item.x + regression.b;
    return {
      fecha: timeSeries[actualIndex].fecha,
      ventas: item.y,
      prediccion: Math.max(0, predictedY),
      tipo: 'historico'
    };
  });

  return {
    modelo: 'Regresión Lineal',
    historicos: historicalData,
    predicciones: predictions,
    metrica: {
      pendiente: regression.m,
      intercepto: regression.b,
      r2: calculateR2(data, regression)
    }
  };
}

function calculateR2(data, regression) {
  const yMean = mean(data.map(d => d.y));
  const ssRes = data.reduce((sum, d) => {
    const predicted = regression.m * d.x + regression.b;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0);
  const ssTot = data.reduce((sum, d) => {
    return sum + Math.pow(d.y - yMean, 2);
  }, 0);
  return ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
}

// Clustering usando K-means simplificado
export async function calculateClusters(processedData, k = 5) {
  if (!processedData || !processedData.timeSeries) {
    throw new Error('Datos insuficientes para clustering');
  }

  // Preparar datos: características por mes (ventas sell in, sell out, ratio)
  const features = processedData.timeSeries.map(item => [
    item.sellIn.ventas,
    item.sellOut.ventas,
    item.sellIn.unidades,
    item.sellOut.cantidad
  ]);

  if (features.length < k) {
    k = Math.max(2, Math.floor(features.length / 2));
  }

  // Normalizar características
  const normalizedFeatures = normalizeFeatures(features);

  // K-means
  const clusters = kMeans(normalizedFeatures, k);

  // Mapear clusters de vuelta a los meses
  const clusteredData = processedData.timeSeries.map((item, index) => ({
    fecha: item.fecha,
    cluster: clusters.labels[index],
    sellIn: item.sellIn,
    sellOut: item.sellOut
  }));

  // Características de cada cluster
  const clusterCharacteristics = [];
  for (let i = 0; i < k; i++) {
    const clusterItems = clusteredData.filter(item => item.cluster === i);
    if (clusterItems.length > 0) {
      clusterCharacteristics.push({
        cluster: i,
        nombre: getClusterName(i, clusterItems),
        cantidad: clusterItems.length,
        promedioVentasSellIn: mean(clusterItems.map(item => item.sellIn.ventas)),
        promedioVentasSellOut: mean(clusterItems.map(item => item.sellOut.ventas)),
        meses: clusterItems.map(item => item.fecha)
      });
    }
  }

  return {
    clusters: clusteredData,
    caracteristicas: clusterCharacteristics,
    centroides: clusters.centroids
  };
}

function normalizeFeatures(features) {
  const transposed = features[0].map((_, i) => features.map(row => row[i]));
  const normalized = transposed.map(column => {
    const colMean = mean(column);
    const colStd = standardDeviation(column) || 1;
    return column.map(val => (val - colMean) / colStd);
  });
  
  return features[0].map((_, i) => normalized.map(col => col[i]));
}

function kMeans(features, k, maxIterations = 100) {
  // Inicializar centroides aleatoriamente
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * features.length);
    centroids.push([...features[randomIndex]]);
  }

  let labels = new Array(features.length).fill(0);
  let previousLabels = null;
  let iterations = 0;

  while (iterations < maxIterations) {
    // Asignar puntos a clusters
    labels = features.map(point => {
      let minDist = Infinity;
      let closestCentroid = 0;
      centroids.forEach((centroid, idx) => {
        const dist = euclideanDistance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = idx;
        }
      });
      return closestCentroid;
    });

    // Verificar convergencia
    if (previousLabels && arraysEqual(labels, previousLabels)) {
      break;
    }
    previousLabels = [...labels];

    // Actualizar centroides
    centroids = centroids.map((_, idx) => {
      const clusterPoints = features.filter((_, i) => labels[i] === idx);
      if (clusterPoints.length === 0) return centroids[idx];
      
      return features[0].map((_, dim) => {
        return mean(clusterPoints.map(point => point[dim]));
      });
    });

    iterations++;
  }

  return { labels, centroids };
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

function getClusterName(clusterId, items) {
  const avgSellIn = mean(items.map(item => item.sellIn.ventas));
  const avgSellOut = mean(items.map(item => item.sellOut.ventas));
  
  if (avgSellIn > avgSellOut * 1.2) return 'Alto Stock';
  if (avgSellOut > avgSellIn * 1.2) return 'Alta Demanda';
  if ((avgSellIn + avgSellOut) > mean([avgSellIn, avgSellOut]) * 1.5) return 'Pico de Ventas';
  if ((avgSellIn + avgSellOut) < mean([avgSellIn, avgSellOut]) * 0.5) return 'Bajo Rendimiento';
  return 'Rendimiento Estable';
}

// Análisis de consultas del chatbot
export async function analyzeQuery(query, processedData, rawData) {
  const lowerQuery = query.toLowerCase();
  
  // Detectar tipo de consulta y generar respuesta
  let response = {
    texto: '',
    tipo: 'texto',
    datos: null,
    grafico: null
  };

  // Análisis de ventas totales
  if (lowerQuery.includes('ventas totales') || lowerQuery.includes('total ventas')) {
    const kpis = processedData.kpis;
    response.texto = `Las ventas totales son:\n\n` +
      `**Sell In:** $${kpis.sellIn.totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n` +
      `**Sell Out:** $${kpis.sellOut.totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n` +
      `**Ratio Sell Out/Sell In:** ${kpis.general.ratioSellOutSellIn.toFixed(2)}%`;
    response.tipo = 'texto';
  }
  // Evolución temporal
  else if (lowerQuery.includes('evolución') || lowerQuery.includes('tendencia') || lowerQuery.includes('tiempo')) {
    response.texto = `Aquí está la evolución de ventas por mes:`;
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'line',
      datos: processedData.timeSeries,
      config: {
        x: 'fecha',
        y: ['sellIn.ventas', 'sellOut.ventas'],
        titulo: 'Evolución de Ventas'
      }
    };
  }
  // Predicciones
  else if (lowerQuery.includes('predicción') || lowerQuery.includes('futuro') || lowerQuery.includes('próximo')) {
    const predictions = await predictSales(processedData.timeSeries);
    response.texto = `Predicciones para los próximos 3 meses:\n\n` +
      predictions.predicciones.map(p => 
        `**${p.fecha}:** $${p.prediccion.toLocaleString('es-CO', { maximumFractionDigits: 2 })} (confianza: ${p.confianza.toFixed(1)}%)`
      ).join('\n');
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'prediction',
      datos: predictions,
      config: {
        titulo: 'Predicción de Ventas'
      }
    };
  }
  // Clustering
  else if (lowerQuery.includes('clusters') || lowerQuery.includes('segmentación') || lowerQuery.includes('patrones')) {
    const clusters = await calculateClusters(processedData);
    response.texto = `Se identificaron ${clusters.caracteristicas.length} patrones distintos:\n\n` +
      clusters.caracteristicas.map(c => 
        `**${c.nombre}:** ${c.cantidad} meses, promedio ventas Sell In: $${c.promedioVentasSellIn.toLocaleString('es-CO')}`
      ).join('\n');
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'cluster',
      datos: clusters,
      config: {
        titulo: 'Segmentación de Períodos'
      }
    };
  }
  // Inventario
  else if (lowerQuery.includes('inventario') || lowerQuery.includes('stock') || lowerQuery.includes('existencia')) {
    const kpis = processedData.kpis;
    response.texto = `Estado del inventario:\n\n` +
      `**Total Existencia:** ${kpis.inventario.totalExistencia.toLocaleString('es-CO')} unidades\n` +
      `**Sucursales:** ${kpis.inventario.sucursales}`;
    response.tipo = 'texto';
  }
  // Por sucursal
  else if (lowerQuery.includes('sucursal')) {
    const topSucursales = await rawData.getSucursales();

    response.texto = `Top 10 Sucursales por Ventas:\n\n` +
      topSucursales.map((s, i) => 
        `${i + 1}. **${s.nombre}:** $${s.ventas.toLocaleString('es-CO')} (${s.cantidad} unidades)`
      ).join('\n');
    
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'bar',
      datos: topSucursales,
      config: {
        x: 'nombre',
        y: 'ventas',
        titulo: 'Top Sucursales'
      }
    };
  }
  // Por producto
  else if (lowerQuery.includes('producto') || lowerQuery.includes('silueta')) {
    const topProductos = await rawData.getProductos();

    response.texto = `Top 10 Productos por Ventas:\n\n` +
      topProductos.map((p, i) => 
        `${i + 1}. **${p.nombre}:** $${p.ventas.toLocaleString('es-CO')} (${p.cantidad} unidades)`
      ).join('\n');
    
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'bar',
      datos: topProductos,
      config: {
        x: 'nombre',
        y: 'ventas',
        titulo: 'Top Productos'
      }
    };
  }
  // Respuesta por defecto
  else {
    response.texto = `Puedo ayudarte con:\n\n` +
      `• Ventas totales (Sell In y Sell Out)\n` +
      `• Evolución y tendencias temporales\n` +
      `• Predicciones de ventas futuras\n` +
      `• Análisis de clusters y patrones\n` +
      `• Estado de inventario\n` +
      `• Análisis por sucursal o producto\n\n` +
      `¿Qué te gustaría saber?`;
    response.tipo = 'texto';
  }

  return response;
}

