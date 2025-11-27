import { mean, standardDeviation, linearRegression, sampleCorrelation } from 'simple-statistics';
import { Matrix } from 'ml-matrix';
import OpenAI from 'openai';

// Predicción de ventas usando modelo tipo Prophet (con estacionalidad y features temporales)
export async function predictSales(timeSeries, monthsAhead = 3) {
  if (!timeSeries || timeSeries.length < 2) {
    throw new Error('Datos insuficientes para predicción');
  }

  // Preparar datos con features temporales
  const dataWithFeatures = prepareTimeSeriesFeatures(timeSeries);
  
  // Descomponer en tendencia, estacionalidad y residual
  const decomposition = decomposeTimeSeries(dataWithFeatures);
  
  // Ajustar modelo de tendencia (regresión lineal mejorada)
  const trendModel = fitTrendModel(dataWithFeatures, decomposition.trend);
  
  // Modelo de estacionalidad (promedio por mes del año)
  const seasonalModel = fitSeasonalModel(dataWithFeatures, decomposition.seasonal);
  
  // Generar predicciones
  const lastIndex = dataWithFeatures.length - 1;
  const predictions = [];
  const historicalData = [];

  // Datos históricos ajustados
  const monthsToShow = Math.min(12, dataWithFeatures.length);
  const startIndex = Math.max(0, dataWithFeatures.length - monthsToShow);
  
  for (let idx = startIndex; idx < dataWithFeatures.length; idx++) {
    const item = dataWithFeatures[idx];
    const trendPred = trendModel.predict(idx);
    const seasonalComp = seasonalModel.getSeasonalComponent(item.mes);
    const fitted = trendPred + seasonalComp;
    
    historicalData.push({
      fecha: item.fecha,
      ventas: item.ventas,
      prediccion: Math.max(0, fitted),
      tipo: 'historico'
    });
  }

  // Calcular residuales y métricas una sola vez
  const residuals = dataWithFeatures.map((item, idx) => {
    const trendPred = trendModel.predict(idx);
    const seasonalComp = seasonalModel.getSeasonalComponent(item.mes);
    return item.ventas - (trendPred + seasonalComp);
  });
  const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
  const stdResidual = standardDeviation(residuals) || rmse;
  const confidenceInterval = 1.96 * stdResidual;

  // Predicciones futuras
  for (let i = 1; i <= monthsAhead; i++) {
    const futureIndex = lastIndex + i;
    const futureDate = new Date(timeSeries[lastIndex].fecha + '-01');
    futureDate.setMonth(futureDate.getMonth() + i);
    const futureKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
    const futureMes = futureDate.getMonth() + 1;
    
    // Predicción de tendencia
    const trendPred = trendModel.predict(futureIndex);
    
    // Componente estacional
    const seasonalComp = seasonalModel.getSeasonalComponent(futureMes);
    
    // Predicción final
    const predictedY = trendPred + seasonalComp;
    
    predictions.push({
      fecha: futureKey,
      prediccion: Math.max(0, predictedY),
      intervaloSuperior: Math.max(0, predictedY + confidenceInterval),
      intervaloInferior: Math.max(0, predictedY - confidenceInterval),
      confianza: Math.max(0, Math.min(100, 100 - (rmse / Math.abs(predictedY || 1)) * 100))
    });
  }

  // Calcular R²
  const r2 = calculateR2Prophet(dataWithFeatures, trendModel, seasonalModel);

  // Calcular máximos y mínimos históricos para la banda de rango
  const allVentas = dataWithFeatures.map(d => d.ventas);
  const maxHistorico = Math.max(...allVentas);
  const minHistorico = Math.min(...allVentas);
  const promedioHistorico = mean(allVentas);
  const desviacionHistorica = standardDeviation(allVentas) || 0;
  
  // Rango histórico: promedio ± 2 desviaciones estándar (aproximadamente 95% de los datos)
  const rangoSuperior = promedioHistorico + (2 * desviacionHistorica);
  const rangoInferior = Math.max(0, promedioHistorico - (2 * desviacionHistorica));

  return {
    modelo: 'Prophet-like (Estacionalidad + Tendencia)',
    historicos: historicalData,
    predicciones: predictions,
    rangoHistorico: {
      max: maxHistorico,
      min: minHistorico,
      promedio: promedioHistorico,
      rangoSuperior: rangoSuperior,
      rangoInferior: rangoInferior
    },
    metrica: {
      pendiente: trendModel.slope,
      intercepto: trendModel.intercept,
      r2: r2,
      rmse: rmse,
      estacionalidad_detectada: seasonalModel.hasSeasonality
    }
  };
}

// Preparar features temporales (lags, promedios móviles)
function prepareTimeSeriesFeatures(timeSeries) {
  const data = timeSeries.map((item, index) => ({
    index,
    fecha: item.fecha,
    ventas: item.sellIn.ventas + item.sellOut.ventas,
    mes: parseInt(item.fecha.split('-')[1]),
    año: parseInt(item.fecha.split('-')[0])
  }));

  // Agregar lags y promedios móviles
  return data.map((item, idx) => {
    const features = { ...item };
    
    // Lags
    features.lag_1 = idx > 0 ? data[idx - 1].ventas : item.ventas;
    features.lag_2 = idx > 1 ? data[idx - 2].ventas : item.ventas;
    features.lag_3 = idx > 2 ? data[idx - 3].ventas : item.ventas;
    
    // Lag estacional (mismo mes, año anterior)
    const sameMonthLastYear = data.find(d => 
      d.mes === item.mes && d.año === item.año - 1
    );
    features.lag_12 = sameMonthLastYear ? sameMonthLastYear.ventas : item.ventas;
    
    // Promedios móviles
    if (idx >= 2) {
      features.ma_3 = mean(data.slice(Math.max(0, idx - 2), idx + 1).map(d => d.ventas));
    } else {
      features.ma_3 = item.ventas;
    }
    
    if (idx >= 5) {
      features.ma_6 = mean(data.slice(Math.max(0, idx - 5), idx + 1).map(d => d.ventas));
    } else {
      features.ma_6 = item.ventas;
    }
    
    if (idx >= 11) {
      features.ma_12 = mean(data.slice(Math.max(0, idx - 11), idx + 1).map(d => d.ventas));
    } else {
      features.ma_12 = item.ventas;
    }
    
    // Tendencia (cambio vs mes anterior)
    features.tendencia = idx > 0 ? ((item.ventas - data[idx - 1].ventas) / data[idx - 1].ventas) * 100 : 0;
    
    return features;
  });
}

// Descomponer serie temporal en tendencia, estacionalidad y residual
function decomposeTimeSeries(dataWithFeatures) {
  // Calcular tendencia usando regresión lineal
  const trendData = dataWithFeatures.map((item, idx) => ({
    x: idx,
    y: item.ventas
  }));
  const trendRegression = linearRegression(trendData.map(d => [d.x, d.y]));
  
  const trend = dataWithFeatures.map((item, idx) => 
    trendRegression.m * idx + trendRegression.b
  );
  
  // Calcular estacionalidad (promedio por mes)
  const seasonalByMonth = {};
  for (let mes = 1; mes <= 12; mes++) {
    const monthData = dataWithFeatures.filter(d => d.mes === mes);
    if (monthData.length > 0) {
      const monthValues = monthData.map((d, idx) => {
        const trendValue = trendRegression.m * d.index + trendRegression.b;
        return d.ventas - trendValue; // Residual (deseasonalized)
      });
      seasonalByMonth[mes] = mean(monthValues);
    } else {
      seasonalByMonth[mes] = 0;
    }
  }
  
  // Normalizar estacionalidad (centrar en 0)
  const avgSeasonal = mean(Object.values(seasonalByMonth));
  const seasonal = {};
  for (let mes = 1; mes <= 12; mes++) {
    seasonal[mes] = seasonalByMonth[mes] - avgSeasonal;
  }
  
  // Calcular residuales
  const seasonalArray = dataWithFeatures.map(d => seasonal[d.mes]);
  const residual = dataWithFeatures.map((d, idx) => 
    d.ventas - trend[idx] - seasonalArray[idx]
  );
  
  return { trend, seasonal, residual };
}

// Ajustar modelo de tendencia
function fitTrendModel(dataWithFeatures, trend) {
  const trendData = dataWithFeatures.map((item, idx) => ({
    x: idx,
    y: item.ventas
  }));
  
  const regression = linearRegression(trendData.map(d => [d.x, d.y]));
  
  return {
    slope: regression.m,
    intercept: regression.b,
    predict: (index) => regression.m * index + regression.b
  };
}

// Modelo de estacionalidad
function fitSeasonalModel(dataWithFeatures, seasonal) {
  // Verificar si hay estacionalidad significativa
  const seasonalValues = Object.values(seasonal);
  const seasonalStd = standardDeviation(seasonalValues) || 0;
  const hasSeasonality = seasonalStd > mean(dataWithFeatures.map(d => d.ventas)) * 0.1;
  
  return {
    seasonal,
    hasSeasonality,
    getSeasonalComponent: (mes) => seasonal[mes] || 0
  };
}

// Calcular R² para modelo Prophet-like
function calculateR2Prophet(dataWithFeatures, trendModel, seasonalModel) {
  const yMean = mean(dataWithFeatures.map(d => d.ventas));
  
  let ssRes = 0;
  let ssTot = 0;
  
  dataWithFeatures.forEach((item, idx) => {
    const trendPred = trendModel.predict(idx);
    const seasonalComp = seasonalModel.getSeasonalComponent(item.mes);
    const predicted = trendPred + seasonalComp;
    const actual = item.ventas;
    
    ssRes += Math.pow(actual - predicted, 2);
    ssTot += Math.pow(actual - yMean, 2);
  });
  
  return ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
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

function kMeans(features, k, maxIterations = 50) {
  // Optimizado: Reducir iteraciones máximas de 100 a 50 (suficiente para convergencia en la mayoría de casos)
  if (features.length === 0 || k === 0) {
    return { labels: [], centroids: [] };
  }
  
  // Inicializar centroides usando método K-means++ (mejor que aleatorio)
  let centroids = initializeCentroidsKMeansPlusPlus(features, k);

  let labels = new Array(features.length).fill(0);
  let previousLabels = null;
  let iterations = 0;
  let converged = false;

  while (iterations < maxIterations && !converged) {
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
      converged = true;
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

// Inicialización K-means++ (mejor que aleatorio, converge más rápido)
function initializeCentroidsKMeansPlusPlus(features, k) {
  const centroids = [];
  const n = features.length;
  
  // Primer centroide aleatorio
  const firstIndex = Math.floor(Math.random() * n);
  centroids.push([...features[firstIndex]]);
  
  // Seleccionar k-1 centroides restantes
  for (let i = 1; i < k; i++) {
    const distances = features.map(point => {
      // Distancia mínima al centroide más cercano
      return Math.min(...centroids.map(centroid => {
        let sum = 0;
        for (let j = 0; j < point.length; j++) {
          sum += Math.pow(point[j] - centroid[j], 2);
        }
        return Math.sqrt(sum);
      }));
    });
    
    // Calcular probabilidades (distancia al cuadrado)
    const probabilities = distances.map(d => d * d);
    const sumProb = probabilities.reduce((a, b) => a + b, 0);
    const normalized = probabilities.map(p => p / sumProb);
    
    // Seleccionar siguiente centroide basado en probabilidades
    let random = Math.random();
    let cumulative = 0;
    for (let j = 0; j < n; j++) {
      cumulative += normalized[j];
      if (random <= cumulative) {
        centroids.push([...features[j]]);
        break;
      }
    }
  }
  
  return centroids;
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

// Clustering por perfil de producto
export async function calculateProductClusters(productosData, k = 4) {
  if (!productosData || productosData.length < k) {
    throw new Error('Datos insuficientes para clustering de productos');
  }

  // Preparar features: ventas, unidades, ticket promedio, frecuencia, ratio, rotación
  const features = productosData.map(producto => [
    producto.ventas_totales,
    producto.unidades_totales,
    producto.ticket_promedio,
    producto.frecuencia_ventas,
    producto.ratio_sellout_sellin,
    producto.rotacion_inventario,
    producto.sucursales_distintas,
    producto.meses_activos
  ]);

  // Ajustar k si es necesario
  if (features.length < k) {
    k = Math.max(2, Math.floor(features.length / 2));
  }

  // Normalizar características
  const normalizedFeatures = normalizeFeatures(features);

  // K-means
  const clusters = kMeans(normalizedFeatures, k);

  // Mapear clusters de vuelta a productos
  const clusteredProducts = productosData.map((producto, index) => ({
    ...producto,
    cluster: clusters.labels[index]
  }));

  // Características de cada cluster
  const clusterCharacteristics = [];
  for (let i = 0; i < k; i++) {
    const clusterItems = clusteredProducts.filter(item => item.cluster === i);
    if (clusterItems.length > 0) {
      // Agrupar productos por silueta única, sumando ventas si hay duplicados
      const productosAgrupados = {};
      clusterItems.forEach(item => {
        const key = item.silueta;
        if (!productosAgrupados[key]) {
          productosAgrupados[key] = {
            silueta: item.silueta,
            categoria: item.categoria, // Tomar la primera categoría encontrada
            ventas: 0
          };
        }
        productosAgrupados[key].ventas += item.ventas_totales;
      });
      
      // Convertir a array y ordenar por ventas
      // Incluir TODOS los productos únicos, no solo los top 10
      const productosUnicos = Object.values(productosAgrupados)
        .sort((a, b) => b.ventas - a.ventas);
      
      clusterCharacteristics.push({
        cluster: i,
        cantidad: clusterItems.length,
        promedioVentas: mean(clusterItems.map(item => item.ventas_totales)),
        promedioUnidades: mean(clusterItems.map(item => item.unidades_totales)),
        promedioTicket: mean(clusterItems.map(item => item.ticket_promedio)),
        promedioRotacion: mean(clusterItems.map(item => item.rotacion_inventario)),
        productos: productosUnicos // Todos los productos, ordenados por ventas
      });
    }
  }
  
  // Si hay menos de 4 clusters, dividir el cluster más grande
  const targetK = 4; // Siempre queremos 4 clusters
  while (clusterCharacteristics.length < targetK && clusterCharacteristics.length > 0) {
    // Encontrar el cluster más grande (por cantidad total, no por productos mostrados)
    const largestCluster = clusterCharacteristics.reduce((max, cluster) => 
      cluster.cantidad > max.cantidad ? cluster : max
    );
    
    // Guardar la cantidad total original antes de dividir
    const cantidadOriginal = largestCluster.cantidad;
    
    // Dividir a la mitad (tomar la mitad superior y la mitad inferior por ventas)
    const sortedProductos = [...largestCluster.productos].sort((a, b) => b.ventas - a.ventas);
    const midPoint = Math.floor(sortedProductos.length / 2);
    
    const topHalf = sortedProductos.slice(0, midPoint);
    const bottomHalf = sortedProductos.slice(midPoint);
    
    if (topHalf.length > 0 && bottomHalf.length > 0) {
      // Calcular proporciones para mantener la cantidad total correcta
      const totalProductos = topHalf.length + bottomHalf.length;
      const proporcionTop = topHalf.length / totalProductos;
      const proporcionBottom = bottomHalf.length / totalProductos;
      
      // Reemplazar el cluster original con la mitad superior
      const topVentas = mean(topHalf.map(p => p.ventas));
      largestCluster.cantidad = Math.round(cantidadOriginal * proporcionTop);
      largestCluster.promedioVentas = topVentas;
      largestCluster.productos = topHalf;
      
      // Agregar la mitad inferior como nuevo cluster
      const bottomVentas = mean(bottomHalf.map(p => p.ventas));
      clusterCharacteristics.push({
        cluster: clusterCharacteristics.length,
        cantidad: Math.round(cantidadOriginal * proporcionBottom),
        promedioVentas: bottomVentas,
        promedioUnidades: largestCluster.promedioUnidades,
        promedioTicket: largestCluster.promedioTicket,
        promedioRotacion: largestCluster.promedioRotacion,
        productos: bottomHalf
      });
    } else {
      break; // No se puede dividir más
    }
  }
  
  // Ordenar clusters por ventas promedio (de mayor a menor) y asignar nombres únicos
  clusterCharacteristics.sort((a, b) => b.promedioVentas - a.promedioVentas);
  const productClusterNames = ['Productos Estrella', 'Productos Premium', 'Productos Masivos', 'Productos Estables'];
  clusterCharacteristics.slice(0, targetK).forEach((cluster, index) => {
    cluster.nombre = productClusterNames[index] || `Productos Cluster ${index + 1}`;
  });

  // Asegurar que siempre retornemos exactamente 4 clusters
  return {
    clusters: clusteredProducts,
    caracteristicas: clusterCharacteristics.slice(0, targetK),
    centroides: clusters.centroids
  };
}

function getProductClusterName(clusterId, items) {
  if (!items || items.length === 0) return 'Productos Sin Clasificar';
  
  // Calcular promedios del cluster
  const avgVentas = mean(items.map(item => item.ventas_totales));
  const avgTicket = mean(items.map(item => item.ticket_promedio));
  const avgRotacion = mean(items.map(item => item.rotacion_inventario));
  const avgUnidades = mean(items.map(item => item.unidades_totales));
  const avgRatio = mean(items.map(item => item.ratio_sellout_sellin));
  
  // Calcular promedios globales para comparación
  const allVentas = items.map(i => i.ventas_totales);
  const allTickets = items.map(i => i.ticket_promedio);
  const allUnidades = items.map(i => i.unidades_totales);
  const allRotaciones = items.map(i => i.rotacion_inventario);
  
  const globalAvgVentas = mean(allVentas);
  const globalAvgTicket = mean(allTickets);
  const globalAvgUnidades = mean(allUnidades);
  const globalAvgRotacion = mean(allRotaciones);
  
  // Clasificación basada en percentiles y comparaciones relativas
  // Ordenar clusters por ventas para asignar nombres según ranking
  const sortedByVentas = [...items].sort((a, b) => b.ventas_totales - a.ventas_totales);
  const isTopVentas = avgVentas >= sortedByVentas[Math.floor(sortedByVentas.length * 0.25)].ventas_totales;
  const isLowVentas = avgVentas <= sortedByVentas[Math.floor(sortedByVentas.length * 0.75)].ventas_totales;
  
  // Productos Estrella: top 25% en ventas Y alta rotación
  if (isTopVentas && avgRotacion > globalAvgRotacion * 0.8) {
    return 'Productos Estrella';
  }
  
  // Productos Premium: alto ticket (top 25%) Y baja rotación (menos volumen)
  if (avgTicket > globalAvgTicket * 1.2 && avgRotacion < globalAvgRotacion * 1.2) {
    return 'Productos Premium';
  }
  
  // Productos Masivos: alto volumen (top 25% unidades) Y bajo ticket
  if (avgUnidades > globalAvgUnidades * 1.2 && avgTicket < globalAvgTicket * 0.9) {
    return 'Productos Masivos';
  }
  
  // Productos Lentos: bottom 25% en ventas Y baja rotación
  if (isLowVentas && avgRotacion < globalAvgRotacion * 0.7) {
    return 'Productos Lentos';
  }
  
  // Si no cumple ninguna condición específica, usar clasificación por posición
  // Basado en el clusterId para asegurar diversidad
  const clusterNames = ['Productos Estrella', 'Productos Premium', 'Productos Masivos', 'Productos Estables'];
  return clusterNames[clusterId % clusterNames.length];
}

// Clustering por perfil de sucursal
export async function calculateSucursalClusters(sucursalesData, k = 4) {
  if (!sucursalesData || sucursalesData.length < k) {
    throw new Error('Datos insuficientes para clustering de sucursales');
  }

  // Preparar features: ventas, unidades, ticket, diversidad, rotación, estacionalidad
  const features = sucursalesData.map(sucursal => [
    sucursal.ventas_totales_sucursal,
    sucursal.unidades_totales_sucursal,
    sucursal.ticket_promedio_sucursal,
    sucursal.diversidad_productos,
    sucursal.rotacion_sucursal,
    sucursal.estacionalidad || 0,
    sucursal.ratio_sellout_sellin_sucursal
  ]);

  // Ajustar k si es necesario
  if (features.length < k) {
    k = Math.max(2, Math.floor(features.length / 2));
  }

  // Normalizar características
  const normalizedFeatures = normalizeFeatures(features);

  // K-means
  const clusters = kMeans(normalizedFeatures, k);

  // Mapear clusters de vuelta a sucursales
  const clusteredSucursales = sucursalesData.map((sucursal, index) => ({
    ...sucursal,
    cluster: clusters.labels[index]
  }));

  // Características de cada cluster
  const clusterCharacteristics = [];
  const targetK = 4; // Siempre queremos 4 clusters
  
  // Primero, recopilar todos los clusters generados
  for (let i = 0; i < k; i++) {
    const clusterItems = clusteredSucursales.filter(item => item.cluster === i);
    if (clusterItems.length > 0) {
      // Incluir TODAS las sucursales, no solo las top 10
      const todasSucursales = clusterItems.map(item => ({
        nombre: item.nombre_sucursal,
        canal: item.canal,
        ventas: item.ventas_totales_sucursal
      })).sort((a, b) => b.ventas - a.ventas);
      
      clusterCharacteristics.push({
        cluster: i,
        cantidad: clusterItems.length,
        promedioVentas: mean(clusterItems.map(item => item.ventas_totales_sucursal)),
        promedioTicket: mean(clusterItems.map(item => item.ticket_promedio_sucursal)),
        promedioRotacion: mean(clusterItems.map(item => item.rotacion_sucursal)),
        promedioDiversidad: mean(clusterItems.map(item => item.diversidad_productos)),
        sucursales: todasSucursales // Todas las sucursales, ordenadas por ventas
      });
    }
  }
  
  // Si hay menos de 4 clusters, dividir el cluster más grande
  while (clusterCharacteristics.length < targetK && clusterCharacteristics.length > 0) {
    // Encontrar el cluster más grande (por cantidad total, no por sucursales mostradas)
    const largestCluster = clusterCharacteristics.reduce((max, cluster) => 
      cluster.cantidad > max.cantidad ? cluster : max
    );
    
    // Guardar la cantidad total original antes de dividir
    const cantidadOriginal = largestCluster.cantidad;
    
    // Dividir a la mitad (tomar la mitad superior y la mitad inferior por ventas)
    // Usar todas las sucursales del cluster, no solo las mostradas
    const sortedSucursales = [...largestCluster.sucursales].sort((a, b) => b.ventas - a.ventas);
    const midPoint = Math.floor(sortedSucursales.length / 2);
    
    const topHalf = sortedSucursales.slice(0, midPoint);
    const bottomHalf = sortedSucursales.slice(midPoint);
    
    if (topHalf.length > 0 && bottomHalf.length > 0) {
      // Calcular proporciones para mantener la cantidad total correcta
      const totalSucursales = topHalf.length + bottomHalf.length;
      const proporcionTop = topHalf.length / totalSucursales;
      const proporcionBottom = bottomHalf.length / totalSucursales;
      
      // Reemplazar el cluster original con la mitad superior
      const topVentas = mean(topHalf.map(s => s.ventas));
      largestCluster.cantidad = Math.round(cantidadOriginal * proporcionTop);
      largestCluster.promedioVentas = topVentas;
      largestCluster.sucursales = topHalf;
      
      // Agregar la mitad inferior como nuevo cluster
      const bottomVentas = mean(bottomHalf.map(s => s.ventas));
      clusterCharacteristics.push({
        cluster: clusterCharacteristics.length,
        cantidad: Math.round(cantidadOriginal * proporcionBottom),
        promedioVentas: bottomVentas,
        promedioTicket: largestCluster.promedioTicket,
        promedioRotacion: largestCluster.promedioRotacion,
        promedioDiversidad: largestCluster.promedioDiversidad,
        sucursales: bottomHalf
      });
    } else {
      break; // No se puede dividir más
    }
  }
  
  // Ordenar clusters por ventas promedio (de mayor a menor) y asignar nombres únicos
  clusterCharacteristics.sort((a, b) => b.promedioVentas - a.promedioVentas);
  const sucursalClusterNames = ['Sucursales Premium', 'Sucursales Masivas', 'Sucursales Estables', 'Sucursales Oportunidad'];
  clusterCharacteristics.slice(0, targetK).forEach((cluster, index) => {
    cluster.nombre = sucursalClusterNames[index] || `Sucursales Cluster ${index + 1}`;
  });
  
  // Asegurar que siempre retornemos exactamente 4 clusters
  return {
    clusters: clusteredSucursales,
    caracteristicas: clusterCharacteristics.slice(0, targetK),
    centroides: clusters.centroids
  };

  return {
    clusters: clusteredSucursales,
    caracteristicas: clusterCharacteristics,
    centroides: clusters.centroids
  };
}

function getSucursalClusterName(clusterId, items) {
  if (!items || items.length === 0) return 'Sucursales Sin Clasificar';
  
  // Calcular promedios del cluster
  const avgVentas = mean(items.map(item => item.ventas_totales_sucursal));
  const avgTicket = mean(items.map(item => item.ticket_promedio_sucursal));
  const avgRotacion = mean(items.map(item => item.rotacion_sucursal));
  const avgDiversidad = mean(items.map(item => item.diversidad_productos));
  const avgUnidades = mean(items.map(item => item.unidades_totales_sucursal));
  const avgEstacionalidad = mean(items.map(item => item.estacionalidad || 0));
  
  // Calcular promedios globales para comparación
  const allVentas = items.map(i => i.ventas_totales_sucursal);
  const allTickets = items.map(i => i.ticket_promedio_sucursal);
  const allRotaciones = items.map(i => i.rotacion_sucursal);
  const allDiversidades = items.map(i => i.diversidad_productos);
  const allUnidades = items.map(i => i.unidades_totales_sucursal);
  
  const globalAvgVentas = mean(allVentas);
  const globalAvgTicket = mean(allTickets);
  const globalAvgRotacion = mean(allRotaciones);
  const globalAvgDiversidad = mean(allDiversidades);
  const globalAvgUnidades = mean(allUnidades);
  
  // Ordenar por ventas para clasificación
  const sortedByVentas = [...items].sort((a, b) => b.ventas_totales_sucursal - a.ventas_totales_sucursal);
  const isTopVentas = avgVentas >= sortedByVentas[Math.floor(sortedByVentas.length * 0.25)].ventas_totales_sucursal;
  const isLowVentas = avgVentas <= sortedByVentas[Math.floor(sortedByVentas.length * 0.75)].ventas_totales_sucursal;
  
  // Sucursales Premium: top 25% ventas Y alto ticket Y alta rotación
  if (isTopVentas && avgTicket > globalAvgTicket * 1.1 && avgRotacion > globalAvgRotacion * 0.8) {
    return 'Sucursales Premium';
  }
  
  // Sucursales Masivas: alto volumen (top 25% unidades) Y bajo ticket
  if (avgUnidades > globalAvgUnidades * 1.2 && avgTicket < globalAvgTicket * 0.9) {
    return 'Sucursales Masivas';
  }
  
  // Sucursales Oportunidad: bottom 25% ventas
  if (isLowVentas) {
    return 'Sucursales Oportunidad';
  }
  
  // Sucursales Estables: rendimiento medio con buena diversidad
  if (avgDiversidad > globalAvgDiversidad * 0.8 && avgRotacion > globalAvgRotacion * 0.6) {
    return 'Sucursales Estables';
  }
  
  // Si no cumple ninguna condición específica, usar clasificación por posición
  const clusterNames = ['Sucursales Premium', 'Sucursales Masivas', 'Sucursales Estables', 'Sucursales Oportunidad'];
  return clusterNames[clusterId % clusterNames.length];
}

// Funciones auxiliares para análisis profundos
function analyzeTrends(timeSeries) {
  if (!timeSeries || timeSeries.length < 2) return null;
  
  const recentMonths = timeSeries.slice(-6); // Últimos 6 meses
  const olderMonths = timeSeries.slice(-12, -6); // 6 meses anteriores
  
  if (olderMonths.length === 0) return null;
  
  const recentAvg = mean(recentMonths.map(m => m.sellIn.ventas + m.sellOut.ventas));
  const olderAvg = mean(olderMonths.map(m => m.sellIn.ventas + m.sellOut.ventas));
  
  const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const trend = changePercent > 5 ? 'creciendo' : changePercent < -5 ? 'decreciendo' : 'estable';
  
  return { changePercent, trend, recentAvg, olderAvg };
}

function detectAnomalies(timeSeries) {
  if (!timeSeries || timeSeries.length < 3) return [];
  
  const values = timeSeries.map(m => m.sellIn.ventas + m.sellOut.ventas);
  const avg = mean(values);
  const std = standardDeviation(values);
  
  const anomalies = [];
  timeSeries.forEach((item, index) => {
    const value = values[index];
    const zScore = (value - avg) / (std || 1);
    
    if (Math.abs(zScore) > 2) {
      anomalies.push({
        fecha: item.fecha,
        valor: value,
        tipo: zScore > 2 ? 'pico' : 'caída',
        desviacion: zScore
      });
    }
  });
  
  return anomalies;
}

function comparePeriods(timeSeries, period = 3) {
  if (!timeSeries || timeSeries.length < period * 2) return null;
  
  const current = timeSeries.slice(-period);
  const previous = timeSeries.slice(-period * 2, -period);
  
  const currentTotal = current.reduce((sum, m) => sum + m.sellIn.ventas + m.sellOut.ventas, 0);
  const previousTotal = previous.reduce((sum, m) => sum + m.sellIn.ventas + m.sellOut.ventas, 0);
  
  const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  
  return { currentTotal, previousTotal, changePercent, period };
}

function generateRecommendations(kpis, timeSeries, anomalies) {
  const recommendations = [];
  
  // Análisis de ratio Sell Out/Sell In
  const ratio = kpis.general.ratioSellOutSellIn;
  if (ratio < 60) {
    recommendations.push({
      tipo: 'Alerta',
      titulo: 'Ratio bajo de conversión',
      mensaje: `El ratio Sell Out/Sell In es ${ratio.toFixed(1)}%, lo que indica que los distribuidores no están vendiendo eficientemente. Considera revisar estrategias de venta y marketing.`
    });
  } else if (ratio > 120) {
    recommendations.push({
      tipo: 'Oportunidad',
      titulo: 'Alta demanda detectada',
      mensaje: `El ratio Sell Out/Sell In es ${ratio.toFixed(1)}%, indicando alta demanda. Considera aumentar el stock en distribuidores para capturar más ventas.`
    });
  }
  
  // Análisis de tendencias
  const trends = analyzeTrends(timeSeries);
  if (trends && trends.changePercent < -10) {
    recommendations.push({
      tipo: 'Alerta',
      titulo: 'Tendencia descendente',
      mensaje: `Las ventas han disminuido ${Math.abs(trends.changePercent).toFixed(1)}% en los últimos 6 meses. Revisa factores externos y considera campañas promocionales.`
    });
  } else if (trends && trends.changePercent > 10) {
    recommendations.push({
      tipo: 'Éxito',
      titulo: 'Crecimiento positivo',
      mensaje: `Excelente! Las ventas han crecido ${trends.changePercent.toFixed(1)}% en los últimos 6 meses. Mantén este momentum.`
    });
  }
  
  // Análisis de anomalías
  if (anomalies && anomalies.length > 0) {
    const recentAnomalies = anomalies.filter(a => {
      const anomalyDate = new Date(a.fecha + '-01');
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return anomalyDate >= sixMonthsAgo;
    });
    
    if (recentAnomalies.length > 0) {
      recommendations.push({
        tipo: 'Análisis',
        titulo: 'Anomalías detectadas',
        mensaje: `Se detectaron ${recentAnomalies.length} períodos con comportamientos inusuales. Revisa estos períodos para identificar causas (eventos especiales, campañas, cambios estacionales).`
      });
    }
  }
  
  // Análisis de inventario
  if (kpis.inventario.totalExistencia > 0) {
    const ventasPorUnidad = kpis.sellOut.totalVentas / kpis.inventario.totalExistencia;
    if (ventasPorUnidad < 0.5) {
      recommendations.push({
        tipo: 'Alerta',
        titulo: 'Rotación lenta de inventario',
        mensaje: 'El inventario tiene una rotación baja. Considera estrategias de liquidación o revisa el mix de productos.'
      });
    }
  }
  
  return recommendations;
}

function analyzePerformance(timeSeries) {
  if (!timeSeries || timeSeries.length < 2) return null;
  
  const latest = timeSeries[timeSeries.length - 1];
  const previous = timeSeries[timeSeries.length - 2];
  
  const totalLatest = latest.sellIn.ventas + latest.sellOut.ventas;
  const totalPrevious = previous.sellIn.ventas + previous.sellOut.ventas;
  
  const changePercent = totalPrevious > 0 ? ((totalLatest - totalPrevious) / totalPrevious) * 100 : 0;
  const avgTotal = mean(timeSeries.map(m => m.sellIn.ventas + m.sellOut.ventas));
  const vsAverage = ((totalLatest - avgTotal) / avgTotal) * 100;
  
  return {
    latest: totalLatest,
    previous: totalPrevious,
    changePercent,
    vsAverage,
    mejorMes: timeSeries.reduce((max, m) => {
      const total = m.sellIn.ventas + m.sellOut.ventas;
      return total > max.total ? { fecha: m.fecha, total } : max;
    }, { fecha: '', total: 0 })
  };
}

// Inicializar cliente OpenAI (si está configurado)
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI client inicializado correctamente');
  } catch (error) {
    console.error('⚠️ Error inicializando OpenAI:', error.message);
  }
}

// Función para generar respuesta usando OpenAI
async function generateOpenAIResponse(query, processedData, rawData) {
  if (!openaiClient) {
    return null;
  }

  try {
    // Ejecutar análisis ML primero para obtener contexto
    const anomalies = detectAnomalies(processedData.timeSeries);
    const trends = analyzeTrends(processedData.timeSeries);
    const performance = analyzePerformance(processedData.timeSeries);
    const recommendations = generateRecommendations(processedData.kpis, processedData.timeSeries, anomalies);
    
    // Preparar datos resumidos para el prompt
    const kpis = processedData.kpis;
    const recentData = processedData.timeSeries.slice(-6);
    
    // Detectar qué tipo de análisis podría necesitarse
    const lowerQuery = query.toLowerCase();
    let contextData = {};
    let analysisResults = null;
    
    if (lowerQuery.includes('predicción') || lowerQuery.includes('futuro')) {
      const predictions = await predictSales(processedData.timeSeries);
      analysisResults = { predictions };
    } else if (lowerQuery.includes('clusters') || lowerQuery.includes('segmentación')) {
      const clusters = await calculateClusters(processedData);
      analysisResults = { clusters };
    } else if (lowerQuery.includes('sucursal')) {
      const sucursales = await rawData.getSucursales();
      contextData = { topSucursales: sucursales.slice(0, 10) };
    } else if (lowerQuery.includes('producto') || lowerQuery.includes('silueta')) {
      const productos = await rawData.getProductos();
      contextData = { topProductos: productos.slice(0, 10) };
    }
    
    // Construir prompt estructurado
    const prompt = `Eres un asistente experto en análisis de datos de ventas e inventario para una empresa distribuidora de Nike (Northbay International Inc.).

CONTEXTO DEL NEGOCIO:
- Sell In: Ventas de la empresa a distribuidores/clientes
- Sell Out: Ventas de los distribuidores a consumidores finales
- El ratio Sell Out/Sell In mide la eficiencia de ventas de los distribuidores

DATOS ACTUALES:
- Sell In Total: $${kpis.sellIn.totalVentas.toLocaleString('es-CO')}
- Sell Out Total: $${kpis.sellOut.totalVentas.toLocaleString('es-CO')}
- Total Ventas: $${(kpis.sellIn.totalVentas + kpis.sellOut.totalVentas).toLocaleString('es-CO')}
- Ratio Sell Out/Sell In: ${kpis.general.ratioSellOutSellIn.toFixed(2)}%
- Promedio Mensual: $${kpis.general.promedioMensual.toLocaleString('es-CO')}
- Inventario Total: ${kpis.inventario.totalExistencia.toLocaleString('es-CO')} unidades
- Sucursales: ${kpis.inventario.sucursales}
- Total Registros: ${kpis.general.totalRegistros.toLocaleString('es-CO')}

${performance ? `PERFORMANCE:
- Cambio mes anterior: ${performance.changePercent > 0 ? '+' : ''}${performance.changePercent.toFixed(1)}%
- Vs. Promedio histórico: ${performance.vsAverage > 0 ? '+' : ''}${performance.vsAverage.toFixed(1)}%
` : ''}

${trends ? `TENDENCIAS (últimos 6 meses):
- Tendencia: ${trends.trend === 'creciendo' ? '📈 Creciente' : trends.trend === 'decreciendo' ? '📉 Decreciente' : '➡️ Estable'}
- Cambio: ${trends.changePercent > 0 ? '+' : ''}${trends.changePercent.toFixed(1)}%
` : ''}

${anomalies && anomalies.length > 0 ? `ANOMALÍAS DETECTADAS:
${anomalies.slice(-3).map(a => `- ${a.fecha}: ${a.tipo} (desviación: ${a.desviacion.toFixed(2)})`).join('\n')}
` : ''}

${recommendations && recommendations.length > 0 ? `RECOMENDACIONES DEL SISTEMA:
${recommendations.slice(0, 3).map(r => `- ${r.tipo}: ${r.titulo} - ${r.mensaje}`).join('\n')}
` : ''}

${analysisResults && analysisResults.predictions ? `PREDICCIONES (Modelo ML):
${analysisResults.predictions.predicciones.map(p => `- ${p.fecha}: $${p.prediccion.toLocaleString('es-CO')} (confianza: ${p.confianza.toFixed(1)}%)`).join('\n')}
- R² del modelo: ${analysisResults.predictions.metrica.r2.toFixed(3)}
` : ''}

${contextData.topSucursales ? `TOP SUCURSALES:
${contextData.topSucursales.map((s, i) => `${i + 1}. ${s.nombre}: $${s.ventas.toLocaleString('es-CO')}`).join('\n')}
` : ''}

${contextData.topProductos ? `TOP PRODUCTOS:
${contextData.topProductos.map((p, i) => `${i + 1}. ${p.nombre}: $${p.ventas.toLocaleString('es-CO')}`).join('\n')}
` : ''}

CONSULTA DEL USUARIO: "${query}"

INSTRUCCIONES:
1. Responde de forma natural y conversacional en español
2. Utiliza los datos proporcionados para generar insights profundos y relevantes
3. Sé específico con números y porcentajes
4. Proporciona análisis contextual, no solo repitas los datos
5. Identifica oportunidades y riesgos basándote en los datos
6. Si la consulta requiere un gráfico específico, indica qué tipo de visualización sería útil
7. Mantén el formato profesional pero accesible

RESPUESTA:`;

    // Llamar a OpenAI
    const completion = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en análisis de datos de ventas con conocimiento profundo en retail y distribución. Proporcionas insights valiosos, recomendaciones accionables y análisis contextual basados en datos reales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Determinar si necesita gráfico basándose en la consulta original
    let needsGraph = false;
    let graphType = null;
    let graphData = null;
    
    if (analysisResults && analysisResults.predictions) {
      needsGraph = true;
      graphType = 'prediction';
      graphData = analysisResults.predictions;
    } else if (analysisResults && analysisResults.clusters) {
      needsGraph = true;
      graphType = 'cluster';
      graphData = analysisResults.clusters;
    } else if (lowerQuery.includes('evolución') || lowerQuery.includes('tendencia') || lowerQuery.includes('tiempo')) {
      needsGraph = true;
      graphType = 'line';
      graphData = processedData.timeSeries;
    } else if (contextData.topSucursales) {
      needsGraph = true;
      graphType = 'bar';
      graphData = contextData.topSucursales;
    } else if (contextData.topProductos) {
      needsGraph = true;
      graphType = 'bar';
      graphData = contextData.topProductos;
    }
    
    return {
      texto: aiResponse,
      tipo: needsGraph ? 'grafico' : 'texto',
      datos: graphData,
      grafico: needsGraph ? {
        tipo: graphType,
        datos: graphData,
        config: graphType === 'line' ? {
          x: 'fecha',
          y: ['sellIn.ventas', 'sellOut.ventas'],
          titulo: 'Evolución de Ventas'
        } : graphType === 'prediction' ? {
          titulo: 'Predicción de Ventas'
        } : graphType === 'cluster' ? {
          titulo: 'Segmentación de Períodos'
        } : {
          x: graphType === 'bar' && contextData.topSucursales ? 'nombre' : 'nombre',
          y: 'ventas',
          titulo: contextData.topSucursales ? 'Top Sucursales' : 'Top Productos'
        }
      } : null,
      insights: [],
      recomendaciones: recommendations,
      poweredBy: 'OpenAI'
    };
    
  } catch (error) {
    console.error('Error en OpenAI:', error.message);
    return null; // Retornar null para usar fallback
  }
}

// Análisis de consultas del chatbot mejorado con insights profundos + OpenAI
export async function analyzeQuery(query, processedData, rawData) {
  // Intentar usar OpenAI primero (si está configurado)
  if (openaiClient) {
    const openaiResponse = await generateOpenAIResponse(query, processedData, rawData);
    if (openaiResponse) {
      return openaiResponse;
    }
    // Si falla, continuar con el sistema actual
    console.log('⚠️ OpenAI no respondió, usando análisis basado en reglas');
  }
  
  // Sistema actual (fallback y cuando OpenAI no está configurado)
  const lowerQuery = query.toLowerCase();
  
  // Detectar tipo de consulta y generar respuesta con insights
  let response = {
    texto: '',
    tipo: 'texto',
    datos: null,
    grafico: null,
    insights: [],
    recomendaciones: []
  };
  
  // Análisis automático de insights (siempre se ejecuta)
  const anomalies = detectAnomalies(processedData.timeSeries);
  const trends = analyzeTrends(processedData.timeSeries);
  const performance = analyzePerformance(processedData.timeSeries);
  const recommendations = generateRecommendations(processedData.kpis, processedData.timeSeries, anomalies);

  // Análisis de ventas totales - MEJORADO CON INSIGHTS
  if (lowerQuery.includes('ventas totales') || lowerQuery.includes('total ventas') || lowerQuery.includes('resumen')) {
    const kpis = processedData.kpis;
    const totalVentas = kpis.sellIn.totalVentas + kpis.sellOut.totalVentas;
    
    let insights = [];
    let recomendaciones = [];
    
    // Insight: Comparación con promedio
    if (performance && performance.vsAverage > 10) {
      insights.push(`📈 Las ventas actuales están ${performance.vsAverage.toFixed(1)}% por encima del promedio histórico. Excelente desempeño!`);
    } else if (performance && performance.vsAverage < -10) {
      insights.push(`📉 Las ventas actuales están ${Math.abs(performance.vsAverage).toFixed(1)}% por debajo del promedio histórico. Revisa estrategias.`);
    }
    
    // Insight: Tendencias
    if (trends) {
      if (trends.changePercent > 5) {
        insights.push(`📊 TENDENCIA CRECIENTE: Las ventas han aumentado ${trends.changePercent.toFixed(1)}% en los últimos 6 meses.`);
      } else if (trends.changePercent < -5) {
        insights.push(`📊 TENDENCIA DESCENDENTE: Las ventas han disminuido ${Math.abs(trends.changePercent).toFixed(1)}% en los últimos 6 meses.`);
      }
    }
    
    // Insight: Ratio de conversión
    if (kpis.general.ratioSellOutSellIn < 60) {
      insights.push(`⚠️ Ratio de conversión bajo (${kpis.general.ratioSellOutSellIn.toFixed(1)}%): Los distribuidores están vendiendo menos de lo esperado.`);
    } else if (kpis.general.ratioSellOutSellIn > 100) {
      insights.push(`✅ Ratio de conversión excelente (${kpis.general.ratioSellOutSellIn.toFixed(1)}%): Alta eficiencia en ventas de distribuidores.`);
    }
    
    response.texto = `## 📊 RESUMEN DE VENTAS TOTALES\n\n` +
      `**Sell In:** $${kpis.sellIn.totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n` +
      `**Sell Out:** $${kpis.sellOut.totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n` +
      `**Total General:** $${totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n` +
      `**Ratio Sell Out/Sell In:** ${kpis.general.ratioSellOutSellIn.toFixed(2)}%\n` +
      `**Promedio Mensual:** $${kpis.general.promedioMensual.toLocaleString('es-CO', { maximumFractionDigits: 2 })}\n\n` +
      `### 💡 INSIGHTS CLAVE:\n\n` +
      insights.join('\n\n') +
      (insights.length > 0 ? '\n\n' : '') +
      `### 🎯 RECOMENDACIONES:\n\n` +
      recommendations.slice(0, 3).map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n');
    
    response.insights = insights;
    response.recomendaciones = recommendations;
    response.tipo = 'texto';
  }
  // Evolución temporal - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('evolución') || lowerQuery.includes('tendencia') || lowerQuery.includes('tiempo') || lowerQuery.includes('histórico')) {
    const periodComparison = comparePeriods(processedData.timeSeries, 3);
    const bestMonth = performance?.mejorMes;
    
    let insights = [];
    
    if (periodComparison) {
      const arrow = periodComparison.changePercent > 0 ? '📈' : periodComparison.changePercent < 0 ? '📉' : '➡️';
      insights.push(`${arrow} **Comparación Trimestral:** Las ventas del último trimestre ${periodComparison.changePercent > 0 ? 'aumentaron' : 'disminuyeron'} ${Math.abs(periodComparison.changePercent).toFixed(1)}% vs trimestre anterior.`);
    }
    
    if (bestMonth) {
      const bestTotal = bestMonth.total;
      const currentTotal = processedData.timeSeries[processedData.timeSeries.length - 1].sellIn.ventas + 
                          processedData.timeSeries[processedData.timeSeries.length - 1].sellOut.ventas;
      const vsBest = ((currentTotal - bestTotal) / bestTotal) * 100;
      if (vsBest < -10) {
        insights.push(`🏆 **Mejor mes:** ${bestMonth.fecha} con $${bestTotal.toLocaleString('es-CO')}. Las ventas actuales están ${Math.abs(vsBest).toFixed(1)}% por debajo del mejor mes.`);
      }
    }
    
    if (anomalies && anomalies.length > 0) {
      const recentAnomalies = anomalies.slice(-3);
      insights.push(`🔍 **Anomalías detectadas:** ${recentAnomalies.map(a => `${a.fecha} (${a.tipo})`).join(', ')}. Revisa estos períodos.`);
    }
    
    response.texto = `## 📈 EVOLUCIÓN TEMPORAL DE VENTAS\n\n` +
      (trends ? `**Tendencia:** ${trends.trend === 'creciendo' ? '📈 Creciente' : trends.trend === 'decreciendo' ? '📉 Decreciente' : '➡️ Estable'}\n` : '') +
      `**Período analizado:** ${processedData.timeSeries.length} meses\n\n` +
      (insights.length > 0 ? `### 💡 INSIGHTS:\n\n${insights.join('\n\n')}\n\n` : '') +
      `Aquí está la evolución detallada:`;
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
    response.insights = insights;
    response.recomendaciones = recommendations.slice(0, 2);
  }
  // Predicciones - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('predicción') || lowerQuery.includes('futuro') || lowerQuery.includes('próximo') || lowerQuery.includes('forecast')) {
    const predictions = await predictSales(processedData.timeSeries);
    const currentMonth = processedData.timeSeries[processedData.timeSeries.length - 1];
    const currentTotal = currentMonth.sellIn.ventas + currentMonth.sellOut.ventas;
    const nextMonthPred = predictions.predicciones[0];
    
    let insights = [];
    let recomendaciones = [];
    
    // Comparar predicción vs actual
    if (nextMonthPred) {
      const changePredicted = ((nextMonthPred.prediccion - currentTotal) / currentTotal) * 100;
      if (changePredicted > 5) {
        insights.push(`📈 **Crecimiento esperado:** Se prevé un aumento del ${changePredicted.toFixed(1)}% para el próximo mes. Prepárate para mayor demanda.`);
        recomendaciones.push({
          tipo: 'Oportunidad',
          titulo: 'Preparación para crecimiento',
          mensaje: 'Aumenta el stock y capacita al equipo para manejar el incremento esperado.'
        });
      } else if (changePredicted < -5) {
        insights.push(`📉 **Disminución esperada:** Se prevé una disminución del ${Math.abs(changePredicted).toFixed(1)}% para el próximo mes.`);
        recomendaciones.push({
          tipo: 'Alerta',
          titulo: 'Acción preventiva necesaria',
          mensaje: 'Considera campañas promocionales o estrategias de marketing para contrarrestar la tendencia negativa.'
        });
      }
      
      // Análisis de confianza del modelo
      const avgConfidence = mean(predictions.predicciones.map(p => p.confianza));
      if (avgConfidence > 80) {
        insights.push(`✅ **Alta confianza del modelo:** ${avgConfidence.toFixed(1)}% (R²: ${predictions.metrica.r2.toFixed(3)}). Las predicciones son muy confiables.`);
      } else if (avgConfidence < 60) {
        insights.push(`⚠️ **Baja confianza del modelo:** ${avgConfidence.toFixed(1)}% (R²: ${predictions.metrica.r2.toFixed(3)}). Los datos muestran alta variabilidad.`);
      }
    }
    
    // Tendencias del modelo
    if (predictions.metrica.pendiente > 0) {
      insights.push(`📊 **Tendencia del modelo:** Positiva (+${predictions.metrica.pendiente.toFixed(2)} por mes). Crecimiento sostenido.`);
    } else {
      insights.push(`📊 **Tendencia del modelo:** Negativa (${predictions.metrica.pendiente.toFixed(2)} por mes). Requiere atención.`);
    }
    
    response.texto = `## 🔮 PREDICCIONES PARA LOS PRÓXIMOS 3 MESES\n\n` +
      predictions.predicciones.map(p => 
        `**${p.fecha}:** $${p.prediccion.toLocaleString('es-CO', { maximumFractionDigits: 2 })} (confianza: ${p.confianza.toFixed(1)}%)\n` +
        `   _Rango probable: $${p.intervaloInferior.toLocaleString('es-CO')} - $${p.intervaloSuperior.toLocaleString('es-CO')}_`
      ).join('\n\n') +
      (insights.length > 0 ? `\n\n### 💡 INSIGHTS:\n\n${insights.join('\n\n')}` : '') +
      (recomendaciones.length > 0 ? `\n\n### 🎯 RECOMENDACIONES:\n\n${recomendaciones.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}` : '');
    
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'prediction',
      datos: predictions,
      config: {
        titulo: 'Predicción de Ventas'
      }
    };
    response.insights = insights;
    response.recomendaciones = recomendaciones;
  }
  // Clustering - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('clusters') || lowerQuery.includes('segmentación') || lowerQuery.includes('patrones')) {
    const clusters = await calculateClusters(processedData);
    
    let insights = [];
    let recomendaciones = [];
    
    // Análisis de clusters
    const highPerformanceCluster = clusters.caracteristicas.find(c => 
      c.nombre.includes('Pico') || c.nombre.includes('Alta')
    );
    const lowPerformanceCluster = clusters.caracteristicas.find(c => 
      c.nombre.includes('Bajo') || c.nombre.includes('Baja')
    );
    
    if (highPerformanceCluster) {
      insights.push(`🏆 **Cluster de alto rendimiento:** "${highPerformanceCluster.nombre}" con ${highPerformanceCluster.cantidad} meses. Promedio Sell In: $${highPerformanceCluster.promedioVentasSellIn.toLocaleString('es-CO')}.`);
      recomendaciones.push({
        tipo: 'Oportunidad',
        titulo: 'Replicar éxito',
        mensaje: `Analiza los períodos del cluster "${highPerformanceCluster.nombre}" para identificar estrategias exitosas y replicarlas.`
      });
    }
    
    if (lowPerformanceCluster) {
      insights.push(`⚠️ **Cluster de bajo rendimiento:** "${lowPerformanceCluster.nombre}" con ${lowPerformanceCluster.cantidad} meses. Requiere atención.`);
      recomendaciones.push({
        tipo: 'Alerta',
        titulo: 'Mejorar rendimiento',
        mensaje: `Revisa los períodos del cluster "${lowPerformanceCluster.nombre}" para identificar problemas y evitar su repetición.`
      });
    }
    
    // Distribución de clusters
    const distribution = clusters.caracteristicas.map(c => `${c.nombre}: ${c.cantidad} meses`).join(', ');
    insights.push(`📊 **Distribución:** ${distribution}.`);
    
    response.texto = `## 🔍 ANÁLISIS DE CLUSTERS Y PATRONES\n\n` +
      `Se identificaron **${clusters.caracteristicas.length} patrones distintos** en tus datos:\n\n` +
      clusters.caracteristicas.map(c => 
        `**${c.nombre}:**\n` +
        `   • ${c.cantidad} meses identificados\n` +
        `   • Promedio Sell In: $${c.promedioVentasSellIn.toLocaleString('es-CO')}\n` +
        `   • Promedio Sell Out: $${c.promedioVentasSellOut.toLocaleString('es-CO')}`
      ).join('\n\n') +
      (insights.length > 0 ? `\n\n### 💡 INSIGHTS:\n\n${insights.join('\n\n')}` : '') +
      (recomendaciones.length > 0 ? `\n\n### 🎯 RECOMENDACIONES:\n\n${recomendaciones.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}` : '');
    
    response.tipo = 'grafico';
    response.grafico = {
      tipo: 'cluster',
      datos: clusters,
      config: {
        titulo: 'Segmentación de Períodos'
      }
    };
    response.insights = insights;
    response.recomendaciones = recomendaciones;
  }
  // Inventario - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('inventario') || lowerQuery.includes('stock') || lowerQuery.includes('existencia')) {
    const kpis = processedData.kpis;
    
    let insights = [];
    let recomendaciones = [];
    
    // Análisis de rotación de inventario
    const ventasVsInventario = kpis.sellOut.totalUnidades / kpis.inventario.totalExistencia;
    const promedioPorSucursal = kpis.inventario.totalExistencia / kpis.inventario.sucursales;
    
    insights.push(`📦 **Total de existencia:** ${kpis.inventario.totalExistencia.toLocaleString('es-CO')} unidades`);
    insights.push(`🏪 **Distribución:** ${kpis.inventario.sucursales} sucursales (promedio: ${promedioPorSucursal.toLocaleString('es-CO')} unidades/sucursal)`);
    
    if (ventasVsInventario > 0.8) {
      insights.push(`✅ **Rotación alta:** Las ventas representan ${(ventasVsInventario * 100).toFixed(1)}% del inventario. Excelente eficiencia.`);
    } else if (ventasVsInventario < 0.3) {
      insights.push(`⚠️ **Rotación baja:** Las ventas representan solo ${(ventasVsInventario * 100).toFixed(1)}% del inventario. Considera estrategias de liquidación.`);
      recomendaciones.push({
        tipo: 'Alerta',
        titulo: 'Optimización de inventario',
        mensaje: 'El inventario tiene rotación lenta. Considera campañas promocionales o revisa el mix de productos.'
      });
    }
    
    // Análisis de inventario vs ventas
    const ratioInventarioVentas = kpis.inventario.totalExistencia / (kpis.sellOut.totalUnidades || 1);
    if (ratioInventarioVentas > 2) {
      recomendaciones.push({
        tipo: 'Alerta',
        titulo: 'Exceso de inventario',
        mensaje: 'El inventario es más del doble de las ventas mensuales. Revisa políticas de compra.'
      });
    } else if (ratioInventarioVentas < 0.5) {
      recomendaciones.push({
        tipo: 'Oportunidad',
        titulo: 'Riesgo de stockout',
        mensaje: 'El inventario es bajo comparado con las ventas. Considera aumentar stock para evitar desabastecimiento.'
      });
    }
    
    response.texto = `## 📦 ESTADO DEL INVENTARIO\n\n` +
      `**Total Existencia:** ${kpis.inventario.totalExistencia.toLocaleString('es-CO')} unidades\n` +
      `**Sucursales:** ${kpis.inventario.sucursales}\n` +
      `**Promedio por Sucursal:** ${promedioPorSucursal.toLocaleString('es-CO')} unidades\n` +
      `**Ventas Sell Out:** ${kpis.sellOut.totalUnidades.toLocaleString('es-CO')} unidades\n` +
      `**Ratio Rotación:** ${(ventasVsInventario * 100).toFixed(1)}%\n\n` +
      (insights.length > 0 ? `### 💡 INSIGHTS:\n\n${insights.join('\n\n')}\n\n` : '') +
      (recomendaciones.length > 0 ? `### 🎯 RECOMENDACIONES:\n\n${recomendaciones.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}` : '');
    
    response.tipo = 'texto';
    response.insights = insights;
    response.recomendaciones = recomendaciones;
  }
  // Por sucursal - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('sucursal') || lowerQuery.includes('tienda')) {
    const topSucursales = await rawData.getSucursales();
    
    if (!topSucursales || topSucursales.length === 0) {
      response.texto = 'No se encontraron datos de sucursales.';
      return response;
    }
    
    const totalVentas = topSucursales.reduce((sum, s) => sum + s.ventas, 0);
    const promedioVentas = totalVentas / topSucursales.length;
    const mejorSucursal = topSucursales[0];
    const peorSucursal = topSucursales[topSucursales.length - 1];
    
    let insights = [];
    let recomendaciones = [];
    
    // Análisis de concentración
    const top3Total = topSucursales.slice(0, 3).reduce((sum, s) => sum + s.ventas, 0);
    const concentracion = (top3Total / totalVentas) * 100;
    
    insights.push(`🏆 **Mejor sucursal:** ${mejorSucursal.nombre} con $${mejorSucursal.ventas.toLocaleString('es-CO')} (${mejorSucursal.cantidad} unidades)`);
    insights.push(`📊 **Promedio de ventas:** $${promedioVentas.toLocaleString('es-CO')}`);
    insights.push(`📈 **Concentración:** Las top 3 sucursales generan el ${concentracion.toFixed(1)}% del total.`);
    
    // Análisis de performance
    const diferencia = mejorSucursal.ventas - peorSucursal.ventas;
    const ratioMejorPeor = mejorSucursal.ventas / peorSucursal.ventas;
    
    if (ratioMejorPeor > 3) {
      insights.push(`⚠️ **Alta variabilidad:** La mejor sucursal vende ${ratioMejorPeor.toFixed(1)}x más que la peor. Hay oportunidad de nivelación.`);
      recomendaciones.push({
        tipo: 'Oportunidad',
        titulo: 'Nivelación de sucursales',
        mensaje: `Analiza las prácticas exitosas de "${mejorSucursal.nombre}" y aplícalas en sucursales de menor rendimiento.`
      });
    }
    
    // Análisis de unidades por venta
    const avgTicket = mean(topSucursales.map(s => s.ventas / (s.cantidad || 1)));
    insights.push(`💵 **Ticket promedio:** $${avgTicket.toLocaleString('es-CO')} por unidad`);
    
    response.texto = `## 🏪 TOP 10 SUCURSALES POR VENTAS\n\n` +
      topSucursales.map((s, i) => 
        `${i + 1}. **${s.nombre}:** $${s.ventas.toLocaleString('es-CO')} (${s.cantidad} unidades) - Ticket: $${(s.ventas / (s.cantidad || 1)).toLocaleString('es-CO')}`
      ).join('\n') +
      `\n\n### 💡 INSIGHTS:\n\n${insights.join('\n\n')}` +
      (recomendaciones.length > 0 ? `\n\n### 🎯 RECOMENDACIONES:\n\n${recomendaciones.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}` : '');
    
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
    response.insights = insights;
    response.recomendaciones = recomendaciones;
  }
  // Por producto - MEJORADO CON INSIGHTS
  else if (lowerQuery.includes('producto') || lowerQuery.includes('silueta') || lowerQuery.includes('artículo')) {
    const topProductos = await rawData.getProductos();
    
    if (!topProductos || topProductos.length === 0) {
      response.texto = 'No se encontraron datos de productos.';
      return response;
    }
    
    const totalVentasProductos = topProductos.reduce((sum, p) => sum + p.ventas, 0);
    const promedioVentas = totalVentasProductos / topProductos.length;
    const mejorProducto = topProductos[0];
    
    let insights = [];
    let recomendaciones = [];
    
    // Análisis de concentración
    const top3Total = topProductos.slice(0, 3).reduce((sum, p) => sum + p.ventas, 0);
    const concentracion = (top3Total / totalVentasProductos) * 100;
    
    insights.push(`🏆 **Producto estrella:** ${mejorProducto.nombre} con $${mejorProducto.ventas.toLocaleString('es-CO')} (${mejorProducto.cantidad} unidades)`);
    insights.push(`📊 **Promedio de ventas:** $${promedioVentas.toLocaleString('es-CO')}`);
    insights.push(`📈 **Concentración:** Los top 3 productos generan el ${concentracion.toFixed(1)}% del total.`);
    
    // Análisis de performance
    const avgTicketProducto = mean(topProductos.map(p => p.ventas / (p.cantidad || 1)));
    insights.push(`💵 **Ticket promedio:** $${avgTicketProducto.toLocaleString('es-CO')} por unidad`);
    
    if (concentracion > 50) {
      recomendaciones.push({
        tipo: 'Alerta',
        titulo: 'Alta dependencia de pocos productos',
        mensaje: 'La mayoría de las ventas dependen de pocos productos. Considera diversificar el portafolio para reducir riesgo.'
      });
    }
    
    // Análisis de rotación
    const mejorProductoRotacion = mejorProducto.ventas / (mejorProducto.cantidad || 1);
    insights.push(`⚡ **Rotación del mejor producto:** $${mejorProductoRotacion.toLocaleString('es-CO')} por unidad`);
    
    recomendaciones.push({
      tipo: 'Oportunidad',
      titulo: 'Gestión de productos estrella',
      mensaje: `Mantén stock suficiente de "${mejorProducto.nombre}" y productos similares, ya que son los más demandados.`
    });
    
    response.texto = `## 📦 TOP 10 PRODUCTOS POR VENTAS\n\n` +
      topProductos.map((p, i) => 
        `${i + 1}. **${p.nombre}:** $${p.ventas.toLocaleString('es-CO')} (${p.cantidad} unidades) - Ticket: $${(p.ventas / (p.cantidad || 1)).toLocaleString('es-CO')}`
      ).join('\n') +
      `\n\n### 💡 INSIGHTS:\n\n${insights.join('\n\n')}` +
      (recomendaciones.length > 0 ? `\n\n### 🎯 RECOMENDACIONES:\n\n${recomendaciones.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}` : '');
    
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
    response.insights = insights;
    response.recomendaciones = recomendaciones;
  }
  // Respuesta por defecto - MEJORADO CON INSIGHTS AUTOMÁTICOS
  else {
    // Generar insights automáticos si no hay consulta específica
    const autoInsights = [];
    const autoRecommendations = recommendations.slice(0, 3);
    
    if (performance) {
      if (performance.changePercent > 5) {
        autoInsights.push(`📈 **Tendencia positiva:** Las ventas aumentaron ${performance.changePercent.toFixed(1)}% vs mes anterior.`);
      } else if (performance.changePercent < -5) {
        autoInsights.push(`📉 **Atención requerida:** Las ventas disminuyeron ${Math.abs(performance.changePercent).toFixed(1)}% vs mes anterior.`);
      }
    }
    
    if (anomalies && anomalies.length > 0) {
      const recentAnomalies = anomalies.slice(-2);
      autoInsights.push(`🔍 **Anomalías recientes:** ${recentAnomalies.map(a => a.fecha).join(', ')}.`);
    }
    
    if (trends) {
      if (trends.changePercent > 10) {
        autoInsights.push(`🚀 **Crecimiento sostenido:** ${trends.changePercent.toFixed(1)}% en los últimos 6 meses.`);
      } else if (trends.changePercent < -10) {
        autoInsights.push(`⚠️ **Tendencia preocupante:** ${Math.abs(trends.changePercent).toFixed(1)}% de disminución en los últimos 6 meses.`);
      }
    }
    
    response.texto = `## 🤖 ASISTENTE DE IA - ANÁLISIS DE DATOS\n\n` +
      `¡Hola! Puedo ayudarte con análisis profundos de tus datos:\n\n` +
      `### 📊 CONSULTAS DISPONIBLES:\n\n` +
      `• **Ventas totales:** Resumen completo con insights y recomendaciones\n` +
      `• **Evolución temporal:** Tendencias, comparaciones y anomalías\n` +
      `• **Predicciones:** Forecasts de 3 meses con análisis de confianza\n` +
      `• **Clusters y patrones:** Segmentación automática con recomendaciones\n` +
      `• **Inventario:** Análisis de rotación y optimización\n` +
      `• **Sucursales:** Performance comparativo y oportunidades\n` +
      `• **Productos:** Análisis de portafolio y productos estrella\n\n` +
      (autoInsights.length > 0 ? `### 💡 INSIGHTS AUTOMÁTICOS:\n\n${autoInsights.join('\n\n')}\n\n` : '') +
      (autoRecommendations.length > 0 ? `### 🎯 RECOMENDACIONES DEL MOMENTO:\n\n${autoRecommendations.map(r => `• **${r.titulo}:** ${r.mensaje}`).join('\n\n')}\n\n` : '') +
      `### 💬 ¿Qué te gustaría analizar?\n\n` +
      `Pregúntame algo específico como:\n` +
      `• "¿Cómo están las ventas?"\n` +
      `• "Muéstrame las predicciones"\n` +
      `• "¿Qué sucursal vende más?"\n` +
      `• "Analiza el inventario"\n` +
      `• "¿Qué productos son los mejores?"`;
    
    response.tipo = 'texto';
    response.insights = autoInsights;
    response.recomendaciones = autoRecommendations;
  }

  return response;
}

