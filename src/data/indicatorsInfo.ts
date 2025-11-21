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
    description: 'Cantidad total de unidades disponibles en inventario en todas las sucursales.',
    meaning: 'Representa el stock total de productos disponibles en el momento de la medición. Este valor ayuda a entender la capacidad de abastecimiento y planificar compras.',
    calculation: 'Suma de todas las existencias (campo "existencia") en la tabla inventario. Fórmula: SUM(existencia)'
  },
  'general-ratioSellOutSellIn': {
    description: 'Proporción entre las ventas Sell Out y Sell In, expresada como porcentaje.',
    meaning: 'Indica qué porcentaje de las ventas a distribuidores (Sell In) fueron efectivamente vendidas a consumidores finales (Sell Out). Un ratio alto indica buena rotación de inventario en los distribuidores.',
    calculation: 'División de ventas Sell Out entre ventas Sell In, multiplicado por 100. Fórmula: (SUM(sell_out.ventas) / SUM(sell_in.ventas)) × 100'
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
    description: 'Gráfico predictivo que muestra proyecciones futuras de ventas basadas en regresión lineal.',
    meaning: 'Utiliza un modelo de Machine Learning (regresión lineal) para predecir las ventas futuras basándose en los datos históricos. Incluye intervalos de confianza para indicar el rango de posibles valores.',
    calculation: 'Se aplica regresión lineal sobre los últimos 12 meses de datos históricos. El modelo calcula una línea de tendencia (y = mx + b) y proyecta 3 meses futuros. Los intervalos de confianza se calculan usando el error estándar del modelo.'
  },
  'clusterChart': {
    description: 'Análisis de clustering que agrupa períodos con características similares de ventas e inventario.',
    meaning: 'Usa el algoritmo K-means para identificar patrones similares entre diferentes períodos. Cada cluster representa un tipo de comportamiento: alto stock, alta demanda, picos de ventas, etc.',
    calculation: 'El algoritmo agrupa los períodos mensuales en 5 clusters basándose en 4 características: ventas Sell In, ventas Sell Out, unidades Sell In y cantidad Sell Out. Se usa normalización de características y distancia euclidiana para agrupar períodos similares.'
  }
}

