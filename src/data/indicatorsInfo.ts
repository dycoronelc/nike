export interface IndicatorInfo {
  description: string
  meaning: string
  calculation: string
}

export const indicatorsInfo: Record<string, IndicatorInfo> = {
  'sellIn-totalVentas': {
    description: 'Total de ventas realizadas a los clientes (distribuidores) por parte de Northbay International Inc.',
    meaning: 'Representa el valor total en dinero de todas las ventas Sell In durante el período seleccionado. Este indicador mide el volumen total de negocios con los distribuidores.',
    calculation: 'Suma de todos los valores de ventas (campo "ventas") en la tabla sell_in, agrupando por el período de tiempo seleccionado. Fórmula: SUM(ventas) WHERE fecha BETWEEN fechaDesde AND fechaHasta'
  },
  'sellOut-totalVentas': {
    description: 'Total de ventas realizadas por los clientes (distribuidores) a los usuarios finales.',
    meaning: 'Indica el valor total en dinero de todas las ventas Sell Out durante el período. Muestra cuánto vendieron los distribuidores a los consumidores finales.',
    calculation: 'Suma de todos los valores de ventas (campo "ventas") en la tabla sell_out, agrupando por el período seleccionado. Fórmula: SUM(ventas) WHERE fecha BETWEEN fechaDesde AND fechaHasta'
  },
  'inventario-totalExistencia': {
    description: 'Cantidad total de unidades disponibles en inventario en todas las sucursales del último mes disponible en los datos.',
    meaning: 'Representa el stock total de productos disponibles en el último mes registrado. Este valor ayuda a entender la capacidad de abastecimiento actual y planificar compras. Solo muestra las existencias del mes más reciente disponible en la base de datos.',
    calculation: 'Suma de todas las existencias (campo "existencia") en la tabla inventario para el último mes disponible. Fórmula: SUM(existencia) WHERE (año, mes) = último mes disponible'
  },
  'general-ratioSellOutSellIn': {
    description: 'Proporción entre las ventas Sell Out y Sell In, expresada como porcentaje.',
    meaning: 'Indica la relación entre las ventas de distribuidores a consumidores finales (Sell Out) versus las ventas que tú realizaste a distribuidores (Sell In). Un ratio del 100% significa que los distribuidores vendieron exactamente lo que compraron. Un ratio mayor al 100% (ej: 220.67%) indica que los distribuidores vendieron MÁS de lo que compraron en el período, lo cual es posible si: 1) Los distribuidores tenían inventario previo de períodos anteriores, 2) Hay desalineación temporal en los datos, o 3) Los distribuidores están liquidando stock acumulado. Un ratio menor al 100% indica que los distribuidores aún tienen inventario sin vender.',
    calculation: 'División de ventas Sell Out entre ventas Sell In, multiplicado por 100. Fórmula: (SUM(sell_out.ventas) / SUM(sell_in.ventas)) × 100. Si el resultado es > 100%, significa que el Sell Out superó al Sell In en ese período.'
  },
  'sellIn-promedioTicket': {
    description: 'Valor promedio por transacción en las ventas Sell In.',
    meaning: 'Representa el monto promedio de cada venta realizada a los distribuidores. Un ticket promedio alto indica ventas más grandes por transacción.',
    calculation: 'División del total de ventas Sell In entre el total de unidades vendidas. Fórmula: SUM(ventas) / SUM(unidades)'
  },
  'sellOut-promedioTicket': {
    description: 'Valor promedio por transacción en las ventas Sell Out.',
    meaning: 'Indica el monto promedio de cada venta realizada por los distribuidores a consumidores finales. Útil para entender el comportamiento de compra del consumidor final.',
    calculation: 'División del total de ventas Sell Out entre el total de cantidad vendida. Fórmula: SUM(ventas) / SUM(cantidad)'
  },
  'general-totalRegistros': {
    description: 'Cantidad total de registros de transacciones (Sell In + Sell Out) en la base de datos.',
    meaning: 'Muestra el volumen total de transacciones registradas. Es útil para entender la actividad comercial general del negocio.',
    calculation: 'Suma de la cantidad de registros en las tablas sell_in y sell_out. Fórmula: COUNT(sell_in) + COUNT(sell_out)'
  },
  'general-promedioMensual': {
    description: 'Promedio de ventas mensuales considerando tanto Sell In como Sell Out.',
    meaning: 'Indica el valor promedio de ventas por mes. Este indicador ayuda a entender la tendencia de crecimiento o decrecimiento del negocio a nivel mensual.',
    calculation: 'Suma de todas las ventas (Sell In + Sell Out) dividida entre el número de meses únicos en el período. Fórmula: (SUM(sell_in.ventas) + SUM(sell_out.ventas)) / COUNT(DISTINCT mes)'
  },
  'timeSeriesChart': {
    description: 'Gráfico de líneas que muestra la evolución temporal de las ventas Sell In y Sell Out.',
    meaning: 'Permite visualizar las tendencias de ventas a lo largo del tiempo y comparar el comportamiento entre ventas a distribuidores (Sell In) y ventas a consumidores finales (Sell Out).',
    calculation: 'Los datos se agrupan por mes usando DATE_FORMAT(fecha, "%Y-%m") y se suman las ventas de cada mes para ambas tablas. Cada punto en el gráfico representa el total mensual de ventas.'
  },
  'predictionChart': {
    description: 'Gráfico predictivo que muestra proyecciones futuras de ventas basadas en un modelo Prophet-like (Estacionalidad + Tendencia).',
    meaning: 'Utiliza un modelo de Machine Learning tipo Prophet que descompone las ventas históricas en tres componentes: tendencia, estacionalidad y residuales. El modelo captura patrones estacionales (como picos en diciembre) y proyecta 3 meses futuros con intervalos de confianza del 95%. También muestra una banda de rango histórico que indica los valores máximos y mínimos históricos (promedio ± 2 desviaciones estándar).',
    calculation: 'El modelo Prophet-like descompone la serie temporal en: 1) Tendencia: calculada mediante regresión lineal sobre los datos históricos, 2) Estacionalidad: promedio de variaciones mensuales respecto al promedio general, 3) Predicción: suma de tendencia proyectada + componente estacional del mes correspondiente. Se incluyen features temporales como lags (1, 2, 3, 12 meses) y promedios móviles (3, 6, 12 meses). El intervalo de confianza se calcula usando el error estándar del modelo. El rango histórico muestra el promedio histórico ± 2 desviaciones estándar (aproximadamente 95% de los datos históricos).'
  },
  'clusterChart': {
    description: 'Análisis de clustering que agrupa períodos con características similares de ventas e inventario.',
    meaning: 'Usa el algoritmo K-means para identificar patrones similares entre diferentes períodos. Cada cluster representa un tipo de comportamiento: alto stock, alta demanda, picos de ventas, etc.',
    calculation: 'El algoritmo agrupa los períodos mensuales en 5 clusters basándose en 4 características: ventas Sell In, ventas Sell Out, unidades Sell In y cantidad Sell Out. Se usa normalización de características y distancia euclidiana para agrupar períodos similares.'
  },
  'diasInventario': {
    description: 'Cantidad de días que el inventario actual puede cubrir la demanda esperada, comparando con el mismo período del año anterior.',
    meaning: 'Indica cuántos días de ventas puede cubrir el stock actual. Se calcula comparando el inventario del último mes disponible con la demanda promedio diaria del mismo mes del año anterior, considerando la estacionalidad. Valores menores a 30 días indican riesgo de stockout, mientras que valores mayores a 90 días pueden indicar sobrestock.',
    calculation: 'Días de Inventario = Inventario Actual / Demanda Promedio Diaria (del mismo mes año anterior). La demanda promedio diaria se calcula como: Unidades vendidas en el mes anterior / Días con ventas en ese mes.'
  },
  'analisisABC': {
    description: 'Clasificación de productos en categorías A, B y C según su importancia en las ventas totales.',
    meaning: 'El análisis ABC clasifica productos según el principio de Pareto (80/20): Clase A (top 20% productos = 80% ventas) son de alta prioridad y requieren atención especial en reposiciones. Clase B (siguiente 30% = 15% ventas) son de prioridad media. Clase C (resto 50% = 5% ventas) son de baja prioridad. Esto permite optimizar recursos y enfocar esfuerzos en productos críticos.',
    calculation: 'Se ordenan todos los productos por ventas totales descendente. Se calcula el porcentaje acumulado de ventas. Productos con porcentaje acumulado ≤ 80% son Clase A, entre 80-95% son Clase B, y > 95% son Clase C.'
  },
  'tiempoReposicion': {
    description: 'Tiempo promedio estimado entre pedidos (lead time) basado en la frecuencia histórica de compras.',
    meaning: 'Indica cuántos días en promedio transcurren entre pedidos de reposición. Se calcula analizando la frecuencia de pedidos históricos en Sell In. Un lead time corto indica rotación rápida y necesidad de reposiciones frecuentes, mientras que uno largo indica productos con menor frecuencia de compra.',
    calculation: 'Lead Time = Días Totales del Período / Total de Pedidos. Se analiza la frecuencia de pedidos por sucursal/producto en los datos históricos de Sell In, calculando el tiempo promedio entre pedidos.'
  },
  'indiceCobertura': {
    description: 'Porcentaje de demanda esperada que puede ser cubierta con el inventario actual, comparando con el mismo período del año anterior.',
    meaning: 'Muestra qué porcentaje de la demanda esperada (basada en el mismo período del año anterior) puede ser cubierta con el inventario actual. Un índice del 100% o más indica cobertura suficiente, entre 50-100% indica cobertura parcial, y menos de 50% indica cobertura insuficiente y necesidad de reposición.',
    calculation: 'Índice de Cobertura = (Inventario Actual / Demanda del Período Anterior) × 100. Se compara el inventario del último mes disponible con las unidades vendidas (Sell Out) del mismo mes del año anterior para considerar estacionalidad.'
  },
  'scatterChart': {
    description: 'Gráfico de dispersión que muestra la relación entre ventas Sell In (a distribuidores) y ventas Sell Out (de distribuidores a usuarios finales) por sucursal.',
    meaning: 'Este gráfico permite visualizar el balance entre lo que vendes a tus distribuidores y lo que ellos venden a los consumidores finales. Los puntos se colorean según el ratio Sell Out/Sell In: Verde (≥100%): Excelente - distribuidores venden más de lo comprado, Azul (80-100%): Buen balance, Amarillo (50-80%): Balance medio, Rojo (<50%): Atención - stock acumulado. Los puntos arriba de la línea diagonal indican que los distribuidores venden más de lo comprado (usan stock previo), en la diagonal hay balance ideal, y abajo hay stock acumulado.',
    calculation: 'Para cada sucursal se calcula: Ventas Sell In = SUM(ventas) de tabla sell_in agrupado por nombre_sucursal. Ventas Sell Out = SUM(ventas) de tabla sell_out agrupado por nombre_sucursal. Ratio = (Ventas Sell Out / Ventas Sell In) × 100. Cada punto representa una sucursal, posicionada según sus ventas Sell In (eje X) y Sell Out (eje Y).'
  },
  'clusterProductos': {
    description: 'Análisis de clustering de productos que agrupa productos similares según sus características de ventas, unidades, ticket promedio, frecuencia, ratio sell-out/sell-in y rotación de inventario.',
    meaning: 'Los productos se agrupan en 4 perfiles distintos usando el algoritmo K-means: Productos Estrella (alta venta y rotación), Productos Premium (alto ticket, baja rotación), Productos Masivos (alto volumen, bajo ticket), y Productos Estables (rendimiento medio). Cada cluster muestra el total de productos que pertenecen a ese perfil, no solo los mostrados en la lista.',
    calculation: 'Se usan 8 características normalizadas: ventas totales, unidades totales, ticket promedio, frecuencia de ventas, ratio sell-out/sell-in, rotación de inventario, sucursales distintas, y meses activos. El algoritmo K-means agrupa productos similares. La cantidad mostrada es el total real de productos en cada cluster, calculado antes de cualquier división para llegar a 4 clusters.'
  },
  'clusterSucursales': {
    description: 'Análisis de clustering de sucursales que agrupa sucursales similares según sus características de ventas, unidades, ticket promedio, diversidad de productos, rotación y estacionalidad.',
    meaning: 'Las sucursales se agrupan en 4 perfiles distintos usando el algoritmo K-means: Sucursales Premium (alto rendimiento), Sucursales Masivas (alto volumen), Sucursales Estables (rendimiento medio), y Sucursales Oportunidad (potencial de mejora). Cada cluster muestra el total de sucursales que pertenecen a ese perfil, no solo las mostradas en la lista.',
    calculation: 'Se usan 7 características normalizadas: ventas totales, unidades totales, ticket promedio, diversidad de productos, rotación, estacionalidad (desviación estándar de ventas mensuales), y ratio sell-out/sell-in. El algoritmo K-means agrupa sucursales similares. La cantidad mostrada es el total real de sucursales en cada cluster, calculado antes de cualquier división para llegar a 4 clusters.'
  }
}

