import mysql from 'mysql2/promise';
import { standardDeviation } from 'simple-statistics';

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_dashboard',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Verificar conexión
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Error de conexión a MySQL:', error.message);
    return false;
  }
}

// Obtener todos los registros de Sell In
export async function getSellIn(limit = 1000, offset = 0) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sell_in ORDER BY fecha DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM sell_in');
    return {
      data: rows,
      total: countRows[0].total
    };
  } catch (error) {
    console.error('Error obteniendo Sell In:', error);
    throw error;
  }
}

// Obtener todos los registros de Sell Out
export async function getSellOut(limit = 1000, offset = 0) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sell_out ORDER BY fecha DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM sell_out');
    return {
      data: rows,
      total: countRows[0].total
    };
  } catch (error) {
    console.error('Error obteniendo Sell Out:', error);
    throw error;
  }
}

// Obtener todos los registros de Inventario
export async function getInventario(limit = 1000, offset = 0) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM inventario ORDER BY año DESC, mes DESC, dia DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM inventario');
    return {
      data: rows,
      total: countRows[0].total
    };
  } catch (error) {
    console.error('Error obteniendo Inventario:', error);
    throw error;
  }
}

// Obtener KPIs calculados desde la base de datos
export async function getKPIs() {
  try {
    // KPIs Sell In
    const [sellInStats] = await pool.query(`
      SELECT 
        SUM(ventas) as totalVentas,
        SUM(unidades) as totalUnidades,
        AVG(ventas / NULLIF(unidades, 0)) as promedioTicket,
        COUNT(*) as registros
      FROM sell_in
      WHERE ventas IS NOT NULL AND unidades IS NOT NULL
    `);

    // KPIs Sell Out
    const [sellOutStats] = await pool.query(`
      SELECT 
        SUM(ventas) as totalVentas,
        SUM(cantidad) as totalUnidades,
        AVG(ventas / NULLIF(cantidad, 0)) as promedioTicket,
        COUNT(*) as registros
      FROM sell_out
      WHERE ventas IS NOT NULL AND cantidad IS NOT NULL
    `);

    // KPIs Inventario - Solo del último mes disponible
    const [inventarioStats] = await pool.query(`
      SELECT 
        SUM(existencia) as totalExistencia,
        COUNT(DISTINCT nombre_sucursal) as sucursales,
        COUNT(*) as registros
      FROM inventario
      WHERE existencia IS NOT NULL
        AND (año, mes) = (
          SELECT año, mes
          FROM inventario
          WHERE existencia IS NOT NULL
          ORDER BY año DESC, mes DESC
          LIMIT 1
        )
    `);

    // Productos únicos
    const [productosUnicos] = await pool.query(`
      SELECT COUNT(DISTINCT silueta) as productosUnicos
      FROM (
        SELECT silueta FROM sell_in WHERE silueta IS NOT NULL
        UNION
        SELECT silueta FROM sell_out WHERE silueta IS NOT NULL
      ) as productos
    `);

    // Fechas min/max
    const [fechas] = await pool.query(`
      SELECT 
        MIN(fecha) as fechaMin,
        MAX(fecha) as fechaMax
      FROM sell_in
      WHERE fecha IS NOT NULL
    `);

    // Ratio Sell Out / Sell In
    const sellInTotal = parseFloat(sellInStats[0]?.totalVentas || 0);
    const sellOutTotal = parseFloat(sellOutStats[0]?.totalVentas || 0);
    const ratioSellOutSellIn = sellInTotal > 0 ? (sellOutTotal / sellInTotal) * 100 : 0;

    // KPIs adicionales: Total registros y Sucursales únicas de Sell Out
    const totalRegistros = parseInt(sellInStats[0]?.registros || 0) + parseInt(sellOutStats[0]?.registros || 0);
    const totalUnidades = parseInt(sellInStats[0]?.totalUnidades || 0) + parseInt(sellOutStats[0]?.totalUnidades || 0);
    
    // Sucursales únicas de Sell Out
    const [sucursalesSellOut] = await pool.query(`
      SELECT COUNT(DISTINCT nombre_sucursal) as sucursales
      FROM sell_out
      WHERE nombre_sucursal IS NOT NULL
    `);

    // Calcular promedio mensual de ventas totales
    const [ventasMensuales] = await pool.query(`
      SELECT 
        COUNT(DISTINCT DATE_FORMAT(fecha, '%Y-%m')) as meses,
        SUM(ventas) / NULLIF(COUNT(DISTINCT DATE_FORMAT(fecha, '%Y-%m')), 0) as promedioMensual
      FROM (
        SELECT fecha, ventas FROM sell_in WHERE fecha IS NOT NULL AND ventas IS NOT NULL
        UNION ALL
        SELECT fecha, ventas FROM sell_out WHERE fecha IS NOT NULL AND ventas IS NOT NULL
      ) as todas_ventas
    `);

    return {
      sellIn: {
        totalVentas: sellInTotal,
        totalUnidades: parseInt(sellInStats[0]?.totalUnidades || 0),
        promedioTicket: parseFloat(sellInStats[0]?.promedioTicket || 0),
        registros: parseInt(sellInStats[0]?.registros || 0)
      },
      sellOut: {
        totalVentas: sellOutTotal,
        totalUnidades: parseInt(sellOutStats[0]?.totalUnidades || 0),
        promedioTicket: parseFloat(sellOutStats[0]?.promedioTicket || 0),
        registros: parseInt(sellOutStats[0]?.registros || 0)
      },
      inventario: {
        totalExistencia: parseFloat(inventarioStats[0]?.totalExistencia || 0),
        sucursales: parseInt(inventarioStats[0]?.sucursales || 0),
        registros: parseInt(inventarioStats[0]?.registros || 0)
      },
      general: {
        productosUnicos: parseInt(productosUnicos[0]?.productosUnicos || 0),
        ratioSellOutSellIn,
        fechaMin: fechas[0]?.fechaMin ? new Date(fechas[0].fechaMin).toISOString() : null,
        fechaMax: fechas[0]?.fechaMax ? new Date(fechas[0].fechaMax).toISOString() : null,
        totalRegistros,
        totalUnidades,
        sucursalesSellOut: parseInt(sucursalesSellOut[0]?.sucursales || 0),
        promedioMensual: parseFloat(ventasMensuales[0]?.promedioMensual || 0)
      }
    };
  } catch (error) {
    console.error('Error calculando KPIs:', error);
    throw error;
  }
}

// Obtener series temporales agrupadas por mes
export async function getTimeSeries() {
  try {
    // Sell In por mes
    const [sellInByMonth] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as fecha,
        SUM(ventas) as ventas,
        SUM(unidades) as unidades
      FROM sell_in
      WHERE fecha IS NOT NULL AND ventas IS NOT NULL
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY fecha
    `);

    // Sell Out por mes
    const [sellOutByMonth] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as fecha,
        SUM(ventas) as ventas,
        SUM(cantidad) as cantidad
      FROM sell_out
      WHERE fecha IS NOT NULL AND ventas IS NOT NULL
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY fecha
    `);

    // Combinar resultados
    const sellInMap = new Map();
    sellInByMonth.forEach(item => {
      sellInMap.set(item.fecha, {
        ventas: parseFloat(item.ventas || 0),
        unidades: parseInt(item.unidades || 0)
      });
    });

    const sellOutMap = new Map();
    sellOutByMonth.forEach(item => {
      sellOutMap.set(item.fecha, {
        ventas: parseFloat(item.ventas || 0),
        cantidad: parseInt(item.cantidad || 0)
      });
    });

    // Combinar todas las fechas
    const allDates = new Set([...sellInMap.keys(), ...sellOutMap.keys()]);
    const timeSeries = Array.from(allDates).sort().map(fecha => ({
      fecha,
      sellIn: sellInMap.get(fecha) || { ventas: 0, unidades: 0 },
      sellOut: sellOutMap.get(fecha) || { ventas: 0, cantidad: 0 }
    }));

    return timeSeries;
  } catch (error) {
    console.error('Error obteniendo series temporales:', error);
    throw error;
  }
}

// Obtener datos para análisis de sucursales
export async function getSucursalesData() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        nombre_sucursal as nombre,
        SUM(ventas) as ventas,
        SUM(cantidad) as cantidad
      FROM sell_out
      WHERE nombre_sucursal IS NOT NULL
      GROUP BY nombre_sucursal
      ORDER BY ventas DESC
      LIMIT 10
    `);

    return rows.map(row => ({
      nombre: row.nombre,
      ventas: parseFloat(row.ventas || 0),
      cantidad: parseInt(row.cantidad || 0)
    }));
  } catch (error) {
    console.error('Error obteniendo datos de sucursales:', error);
    throw error;
  }
}

// Obtener datos para análisis de productos
export async function getProductosData() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        silueta as nombre,
        SUM(ventas) as ventas,
        SUM(cantidad) as cantidad
      FROM sell_out
      WHERE silueta IS NOT NULL
      GROUP BY silueta
      ORDER BY ventas DESC
      LIMIT 10
    `);

    return rows.map(row => ({
      nombre: row.nombre,
      ventas: parseFloat(row.ventas || 0),
      cantidad: parseInt(row.cantidad || 0)
    }));
  } catch (error) {
    console.error('Error obteniendo datos de productos:', error);
    throw error;
  }
}

// Obtener datos de genero_arreglado agrupados por mes
export async function getGeneroArregladoByMonth() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as fecha,
        genero_arreglado,
        SUM(ventas) as ventas,
        SUM(cantidad) as cantidad
      FROM sell_out
      WHERE fecha IS NOT NULL 
        AND ventas IS NOT NULL 
        AND genero_arreglado IS NOT NULL
      GROUP BY DATE_FORMAT(fecha, '%Y-%m'), genero_arreglado
      ORDER BY fecha, genero_arreglado
    `);

    // Agrupar por mes
    const byMonth = {};
    rows.forEach(row => {
      const fecha = row.fecha;
      if (!byMonth[fecha]) {
        byMonth[fecha] = {};
      }
      byMonth[fecha][row.genero_arreglado] = {
        ventas: parseFloat(row.ventas || 0),
        cantidad: parseInt(row.cantidad || 0)
      };
    });

    return byMonth;
  } catch (error) {
    console.error('Error obteniendo datos de genero_arreglado:', error);
    throw error;
  }
}

// Obtener opciones de filtros disponibles
export async function getFilterOptions() {
  try {
    // Fechas min/max
    const [fechas] = await pool.query(`
      SELECT 
        MIN(COALESCE(
          (SELECT MIN(fecha) FROM sell_in WHERE fecha IS NOT NULL),
          (SELECT MIN(fecha) FROM sell_out WHERE fecha IS NOT NULL)
        )) as fechaMin,
        MAX(COALESCE(
          (SELECT MAX(fecha) FROM sell_in WHERE fecha IS NOT NULL),
          (SELECT MAX(fecha) FROM sell_out WHERE fecha IS NOT NULL)
        )) as fechaMax
    `);

    // Géneros (de sell_out)
    const [generos] = await pool.query(`
      SELECT DISTINCT genero_arreglado as genero
      FROM sell_out
      WHERE genero_arreglado IS NOT NULL
      ORDER BY genero_arreglado
    `);

    // Sucursales (de sell_out)
    const [sucursales] = await pool.query(`
      SELECT DISTINCT nombre_sucursal as sucursal
      FROM sell_out
      WHERE nombre_sucursal IS NOT NULL
      ORDER BY nombre_sucursal
    `);

    // Categorías (de sell_out)
    const [categorias] = await pool.query(`
      SELECT DISTINCT categoria as categoria
      FROM sell_out
      WHERE categoria IS NOT NULL
      ORDER BY categoria
    `);

    // Cuentas (de sell_out)
    const [cuentas] = await pool.query(`
      SELECT DISTINCT cuenta as cuenta
      FROM sell_out
      WHERE cuenta IS NOT NULL
      ORDER BY cuenta
    `);

    // Canales (de sell_out)
    const [canales] = await pool.query(`
      SELECT DISTINCT canal as canal
      FROM sell_out
      WHERE canal IS NOT NULL
      ORDER BY canal
    `);

    // Siluetas (de sell_out)
    const [siluetas] = await pool.query(`
      SELECT DISTINCT silueta as silueta
      FROM sell_out
      WHERE silueta IS NOT NULL
      ORDER BY silueta
      LIMIT 100
    `);

    return {
      fechaMin: fechas[0]?.fechaMin ? new Date(fechas[0].fechaMin).toISOString().split('T')[0] : '',
      fechaMax: fechas[0]?.fechaMax ? new Date(fechas[0].fechaMax).toISOString().split('T')[0] : '',
      generos: generos.map(r => r.genero),
      sucursales: sucursales.map(r => r.sucursal),
      categorias: categorias.map(r => r.categoria),
      cuentas: cuentas.map(r => r.cuenta),
      canales: canales.map(r => r.canal),
      siluetas: siluetas.map(r => r.silueta)
    };
  } catch (error) {
    console.error('Error obteniendo opciones de filtros:', error);
    throw error;
  }
}

// Obtener KPIs con filtros
export async function getKPIsWithFilters(filters = {}) {
  // Por ahora, retornamos los KPIs sin filtrar
  // En una versión futura, podemos aplicar filtros aquí
  return await getKPIs();
}

// Obtener series temporales con filtros
export async function getTimeSeriesWithFilters(filters = {}) {
  try {
    // Si no hay filtros, usar la función original
    if (!filters || Object.keys(filters).length === 0) {
      return await getTimeSeries();
    }

    // Construir condiciones para Sell Out
    const sellOutConditions = ['fecha IS NOT NULL', 'ventas IS NOT NULL'];
    const sellOutParams = [];
    
    if (filters.fechaDesde) {
      sellOutConditions.push('fecha >= ?');
      sellOutParams.push(filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      sellOutConditions.push('fecha <= ?');
      sellOutParams.push(filters.fechaHasta);
    }
    if (filters.generos && filters.generos.length > 0) {
      sellOutConditions.push('genero_arreglado IN (?)');
      sellOutParams.push(filters.generos);
    }
    if (filters.sucursales && filters.sucursales.length > 0) {
      sellOutConditions.push('nombre_sucursal IN (?)');
      sellOutParams.push(filters.sucursales);
    }
    if (filters.categorias && filters.categorias.length > 0) {
      sellOutConditions.push('categoria IN (?)');
      sellOutParams.push(filters.categorias);
    }
    if (filters.cuentas && filters.cuentas.length > 0) {
      sellOutConditions.push('cuenta IN (?)');
      sellOutParams.push(filters.cuentas);
    }
    if (filters.canales && filters.canales.length > 0) {
      sellOutConditions.push('canal IN (?)');
      sellOutParams.push(filters.canales);
    }
    if (filters.siluetas && filters.siluetas.length > 0) {
      sellOutConditions.push('silueta IN (?)');
      sellOutParams.push(filters.siluetas);
    }

    // Construir condiciones para Sell In (solo fechas)
    const sellInConditions = ['fecha IS NOT NULL', 'ventas IS NOT NULL'];
    const sellInParams = [];
    
    if (filters.fechaDesde) {
      sellInConditions.push('fecha >= ?');
      sellInParams.push(filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      sellInConditions.push('fecha <= ?');
      sellInParams.push(filters.fechaHasta);
    }

    // Query para Sell Out con filtros
    const sellOutQuery = `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as fecha,
        SUM(ventas) as ventas,
        SUM(cantidad) as cantidad
      FROM sell_out
      WHERE ${sellOutConditions.join(' AND ')}
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY fecha
    `;

    // Query para Sell In con filtros de fecha
    const sellInQuery = `
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as fecha,
        SUM(ventas) as ventas,
        SUM(unidades) as unidades
      FROM sell_in
      WHERE ${sellInConditions.join(' AND ')}
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY fecha
    `;

    // Ejecutar queries
    const [sellOutByMonth] = await pool.query(sellOutQuery, sellOutParams.flat());
    const [sellInByMonth] = await pool.query(sellInQuery, sellInParams.flat());

    // Combinar resultados
    const sellInMap = new Map();
    sellInByMonth.forEach(item => {
      sellInMap.set(item.fecha, {
        ventas: parseFloat(item.ventas || 0),
        unidades: parseInt(item.unidades || 0)
      });
    });

    const sellOutMap = new Map();
    sellOutByMonth.forEach(item => {
      sellOutMap.set(item.fecha, {
        ventas: parseFloat(item.ventas || 0),
        cantidad: parseInt(item.cantidad || 0)
      });
    });

    // Combinar todas las fechas
    const allDates = new Set([...sellInMap.keys(), ...sellOutMap.keys()]);
    const timeSeries = Array.from(allDates).sort().map(fecha => ({
      fecha,
      sellIn: sellInMap.get(fecha) || { ventas: 0, unidades: 0 },
      sellOut: sellOutMap.get(fecha) || { ventas: 0, cantidad: 0 }
    }));

    return timeSeries;
  } catch (error) {
    console.error('Error obteniendo series temporales con filtros:', error);
    throw error;
  }
}

// Obtener datos de productos con métricas para clustering
export async function getProductosForClustering() {
  try {
    // Optimizado: Usar JOINs en lugar de subconsultas correlacionadas
    const [rows] = await pool.query(`
      SELECT 
        so.silueta,
        so.categoria,
        so.familia,
        so.genero_arreglado,
        SUM(so.ventas) as ventas_totales,
        SUM(so.cantidad) as unidades_totales,
        AVG(so.ventas / NULLIF(so.cantidad, 0)) as ticket_promedio,
        COUNT(*) as frecuencia_ventas,
        COUNT(DISTINCT so.nombre_sucursal) as sucursales_distintas,
        COUNT(DISTINCT DATE_FORMAT(so.fecha, '%Y-%m')) as meses_activos,
        -- Ratio sell out / sell in (usando LEFT JOIN en lugar de subconsulta)
        COALESCE(SUM(si_agg.sell_in_total), 0) as sell_in_total,
        -- Inventario promedio (usando LEFT JOIN en lugar de subconsulta)
        COALESCE(inv_agg.inventario_promedio, 0) as inventario_promedio
      FROM sell_out so
      -- JOIN para sell_in total por silueta
      LEFT JOIN (
        SELECT silueta, SUM(ventas) as sell_in_total
        FROM sell_in
        WHERE silueta IS NOT NULL AND ventas IS NOT NULL
        GROUP BY silueta
      ) si_agg ON si_agg.silueta = so.silueta
      -- JOIN para inventario promedio por categoria
      LEFT JOIN (
        SELECT categoria, AVG(existencia) as inventario_promedio
        FROM inventario
        WHERE categoria IS NOT NULL AND existencia IS NOT NULL
        GROUP BY categoria
      ) inv_agg ON inv_agg.categoria = so.categoria
      WHERE so.silueta IS NOT NULL 
        AND so.ventas IS NOT NULL
        AND so.cantidad IS NOT NULL
      GROUP BY so.silueta, so.categoria, so.familia, so.genero_arreglado, inv_agg.inventario_promedio
      HAVING ventas_totales > 0 AND unidades_totales > 0
      ORDER BY ventas_totales DESC
    `);

    return rows.map(row => ({
      silueta: row.silueta,
      categoria: row.categoria || 'Sin categoría',
      familia: row.familia || 'Sin familia',
      genero_arreglado: row.genero_arreglado || 'Sin género',
      ventas_totales: parseFloat(row.ventas_totales || 0),
      unidades_totales: parseInt(row.unidades_totales || 0),
      ticket_promedio: parseFloat(row.ticket_promedio || 0),
      frecuencia_ventas: parseInt(row.frecuencia_ventas || 0),
      sucursales_distintas: parseInt(row.sucursales_distintas || 0),
      meses_activos: parseInt(row.meses_activos || 0),
      sell_in_total: parseFloat(row.sell_in_total || 0),
      inventario_promedio: parseFloat(row.inventario_promedio || 0),
      ratio_sellout_sellin: row.sell_in_total > 0 
        ? (parseFloat(row.ventas_totales) / parseFloat(row.sell_in_total)) * 100 
        : 0,
      rotacion_inventario: row.inventario_promedio > 0
        ? parseFloat(row.ventas_totales) / parseFloat(row.inventario_promedio)
        : 0
    }));
  } catch (error) {
    console.error('Error obteniendo datos de productos para clustering:', error);
    throw error;
  }
}

// Obtener datos de sucursales con métricas para clustering
export async function getSucursalesForClustering() {
  try {
    // Optimizado: Usar JOINs en lugar de subconsultas correlacionadas
    const [rows] = await pool.query(`
      SELECT 
        so.nombre_sucursal,
        so.canal,
        so.cuenta,
        SUM(so.ventas) as ventas_totales_sucursal,
        SUM(so.cantidad) as unidades_totales_sucursal,
        AVG(so.ventas / NULLIF(so.cantidad, 0)) as ticket_promedio_sucursal,
        COUNT(DISTINCT so.silueta) as diversidad_productos,
        COUNT(DISTINCT DATE_FORMAT(so.fecha, '%Y-%m')) as meses_activos,
        -- Ratio sell out / sell in (usando LEFT JOIN)
        COALESCE(si_agg.sell_in_total, 0) as sell_in_total,
        -- Inventario promedio (usando LEFT JOIN)
        COALESCE(inv_agg.inventario_promedio, 0) as inventario_promedio
      FROM sell_out so
      -- JOIN para sell_in total por sucursal
      LEFT JOIN (
        SELECT nombre_sucursal, SUM(ventas) as sell_in_total
        FROM sell_in
        WHERE nombre_sucursal IS NOT NULL AND ventas IS NOT NULL
        GROUP BY nombre_sucursal
      ) si_agg ON si_agg.nombre_sucursal = so.nombre_sucursal
      -- JOIN para inventario promedio por sucursal
      LEFT JOIN (
        SELECT nombre_sucursal, AVG(existencia) as inventario_promedio
        FROM inventario
        WHERE nombre_sucursal IS NOT NULL AND existencia IS NOT NULL
        GROUP BY nombre_sucursal
      ) inv_agg ON inv_agg.nombre_sucursal = so.nombre_sucursal
      WHERE so.nombre_sucursal IS NOT NULL
        AND so.ventas IS NOT NULL
        AND so.cantidad IS NOT NULL
      GROUP BY so.nombre_sucursal, so.canal, so.cuenta, si_agg.sell_in_total, inv_agg.inventario_promedio
      HAVING ventas_totales_sucursal > 0 AND unidades_totales_sucursal > 0
      ORDER BY ventas_totales_sucursal DESC
    `);

    // Calcular estacionalidad para cada sucursal
    const sucursalesWithEstacionalidad = await Promise.all(rows.map(async (row) => {
      // Obtener ventas mensuales para esta sucursal
      const [monthlyData] = await pool.query(`
        SELECT 
          DATE_FORMAT(fecha, '%Y-%m') as mes,
          SUM(ventas) as monthly_total
        FROM sell_out
        WHERE nombre_sucursal = ? AND ventas IS NOT NULL
        GROUP BY DATE_FORMAT(fecha, '%Y-%m')
        ORDER BY mes
      `, [row.nombre_sucursal]);

      // Calcular desviación estándar de ventas mensuales
      const monthlyTotals = monthlyData.map(m => parseFloat(m.monthly_total || 0));
      const estacionalidad = monthlyTotals.length > 1 
        ? (standardDeviation(monthlyTotals) || 0)
        : 0;

      // Obtener store_type
      const [storeTypeData] = await pool.query(`
        SELECT DISTINCT store_type
        FROM inventario
        WHERE nombre_sucursal = ? AND store_type IS NOT NULL
        LIMIT 1
      `, [row.nombre_sucursal]);

      return {
        nombre_sucursal: row.nombre_sucursal,
        canal: row.canal || 'Sin canal',
        cuenta: row.cuenta || 'Sin cuenta',
        store_type: storeTypeData[0]?.store_type || 'Sin tipo',
        ventas_totales_sucursal: parseFloat(row.ventas_totales_sucursal || 0),
        unidades_totales_sucursal: parseInt(row.unidades_totales_sucursal || 0),
        ticket_promedio_sucursal: parseFloat(row.ticket_promedio_sucursal || 0),
        diversidad_productos: parseInt(row.diversidad_productos || 0),
        meses_activos: parseInt(row.meses_activos || 0),
        sell_in_total: parseFloat(row.sell_in_total || 0),
        inventario_promedio: parseFloat(row.inventario_promedio || 0),
        ratio_sellout_sellin_sucursal: row.sell_in_total > 0
          ? (parseFloat(row.ventas_totales_sucursal) / parseFloat(row.sell_in_total)) * 100
          : 0,
        rotacion_sucursal: row.inventario_promedio > 0
          ? parseFloat(row.ventas_totales_sucursal) / parseFloat(row.inventario_promedio)
          : 0,
        estacionalidad: estacionalidad
      };
    }));

    return sucursalesWithEstacionalidad;
  } catch (error) {
    console.error('Error obteniendo datos de sucursales para clustering:', error);
    throw error;
  }
}

// ============================================
// FUNCIONES DE OPTIMIZACIÓN DE INVENTARIO
// ============================================

// Obtener días de inventario disponible por producto/sucursal
// Compara con el mismo período del año anterior para considerar estacionalidad
export async function getDiasInventarioDisponible() {
  try {
    // Obtener el último mes disponible en inventario
    const [ultimoMes] = await pool.query(`
      SELECT año, mes
      FROM inventario
      WHERE existencia IS NOT NULL
      ORDER BY año DESC, mes DESC
      LIMIT 1
    `);

    if (!ultimoMes || ultimoMes.length === 0) {
      return [];
    }

    const { año: añoActual, mes: mesActual } = ultimoMes[0];
    const añoAnterior = añoActual - 1;

    // Obtener inventario actual por producto y sucursal
    const [inventarioActual] = await pool.query(`
      SELECT 
        i.nombre_sucursal,
        i.categoria,
        i.genero_arreglado,
        SUM(i.existencia) as existencia_actual
      FROM inventario i
      WHERE i.año = ? AND i.mes = ? AND i.existencia IS NOT NULL
      GROUP BY i.nombre_sucursal, i.categoria, i.genero_arreglado
    `, [añoActual, mesActual]);

    // Obtener demanda promedio diaria del mismo período del año anterior
    const [demandaAnterior] = await pool.query(`
      SELECT 
        so.nombre_sucursal,
        so.categoria,
        so.genero_arreglado,
        SUM(so.cantidad) as unidades_vendidas,
        COUNT(DISTINCT DATE(so.fecha)) as dias_con_ventas
      FROM sell_out so
      WHERE YEAR(so.fecha) = ? 
        AND MONTH(so.fecha) = ?
        AND so.cantidad IS NOT NULL
        AND so.cantidad > 0
      GROUP BY so.nombre_sucursal, so.categoria, so.genero_arreglado
    `, [añoAnterior, mesActual]);

    // Crear mapa de demanda por sucursal/categoría/género
    const demandaMap = {};
    demandaAnterior.forEach(d => {
      const key = `${d.nombre_sucursal || 'Todas'}|${d.categoria || 'Sin categoría'}|${d.genero_arreglado || 'Sin género'}`;
      const diasConVentas = d.dias_con_ventas || 1;
      demandaMap[key] = {
        unidades_vendidas: parseFloat(d.unidades_vendidas || 0),
        dias_con_ventas: diasConVentas,
        demanda_promedio_diaria: parseFloat(d.unidades_vendidas || 0) / diasConVentas
      };
    });

    // Calcular días de inventario disponible
    const resultado = inventarioActual.map(inv => {
      const key = `${inv.nombre_sucursal || 'Todas'}|${inv.categoria || 'Sin categoría'}|${inv.genero_arreglado || 'Sin género'}`;
      const demanda = demandaMap[key];
      const existencia = parseFloat(inv.existencia_actual || 0);
      
      let dias_inventario = 0;
      if (demanda && demanda.demanda_promedio_diaria > 0) {
        dias_inventario = existencia / demanda.demanda_promedio_diaria;
      } else if (existencia > 0) {
        // Si no hay datos del año anterior, marcar como "sin comparación"
        dias_inventario = -1;
      }

      return {
        sucursal: inv.nombre_sucursal || 'Todas',
        categoria: inv.categoria || 'Sin categoría',
        genero: inv.genero_arreglado || 'Sin género',
        existencia_actual: existencia,
        demanda_promedio_diaria_anterior: demanda?.demanda_promedio_diaria || 0,
        dias_inventario_disponible: dias_inventario,
        periodo_comparacion: `${mesActual}/${añoAnterior}`,
        tiene_datos_historicos: !!demanda
      };
    });

    return resultado;
  } catch (error) {
    console.error('Error calculando días de inventario disponible:', error);
    throw error;
  }
}

// Análisis ABC de productos
// Clasifica productos en A (80% ventas), B (15% ventas), C (5% ventas)
export async function getAnalisisABC() {
  try {
    // Obtener ventas totales por producto (silueta)
    const [productos] = await pool.query(`
      SELECT 
        so.silueta,
        so.categoria,
        so.genero_arreglado,
        SUM(so.ventas) as ventas_totales,
        SUM(so.cantidad) as unidades_totales,
        COUNT(DISTINCT so.nombre_sucursal) as sucursales_distintas
      FROM sell_out so
      WHERE so.ventas IS NOT NULL AND so.ventas > 0
      GROUP BY so.silueta, so.categoria, so.genero_arreglado
      ORDER BY ventas_totales DESC
    `);

    if (!productos || productos.length === 0) {
      return { claseA: [], claseB: [], claseC: [], totalVentas: 0 };
    }

    // Calcular ventas totales
    const totalVentas = productos.reduce((sum, p) => sum + parseFloat(p.ventas_totales || 0), 0);

    // Calcular ventas acumuladas y clasificar
    let ventasAcumuladas = 0;
    const claseA = [];
    const claseB = [];
    const claseC = [];

    productos.forEach((producto, index) => {
      const ventas = parseFloat(producto.ventas_totales || 0);
      ventasAcumuladas += ventas;
      const porcentajeAcumulado = (ventasAcumuladas / totalVentas) * 100;

      const productoInfo = {
        silueta: producto.silueta,
        categoria: producto.categoria || 'Sin categoría',
        genero: producto.genero_arreglado || 'Sin género',
        ventas_totales: ventas,
        unidades_totales: parseInt(producto.unidades_totales || 0),
        porcentaje_ventas: (ventas / totalVentas) * 100,
        porcentaje_acumulado: porcentajeAcumulado,
        sucursales_distintas: parseInt(producto.sucursales_distintas || 0),
        ranking: index + 1
      };

      if (porcentajeAcumulado <= 80) {
        claseA.push(productoInfo);
      } else if (porcentajeAcumulado <= 95) {
        claseB.push(productoInfo);
      } else {
        claseC.push(productoInfo);
      }
    });

    return {
      claseA,
      claseB,
      claseC,
      totalVentas,
      totalProductos: productos.length,
      resumen: {
        claseA: {
          cantidad: claseA.length,
          porcentaje_productos: (claseA.length / productos.length) * 100,
          porcentaje_ventas: claseA.reduce((sum, p) => sum + p.ventas_totales, 0) / totalVentas * 100
        },
        claseB: {
          cantidad: claseB.length,
          porcentaje_productos: (claseB.length / productos.length) * 100,
          porcentaje_ventas: claseB.reduce((sum, p) => sum + p.ventas_totales, 0) / totalVentas * 100
        },
        claseC: {
          cantidad: claseC.length,
          porcentaje_productos: (claseC.length / productos.length) * 100,
          porcentaje_ventas: claseC.reduce((sum, p) => sum + p.ventas_totales, 0) / totalVentas * 100
        }
      }
    };
  } catch (error) {
    console.error('Error calculando análisis ABC:', error);
    throw error;
  }
}

// Calcular tiempo de reposición estimado (lead time)
// Basado en frecuencia de pedidos en Sell In
export async function getTiempoReposicion() {
  try {
    // Obtener frecuencia de pedidos por sucursal/producto
    // Nota: sell_in tiene categoria_descripcion, no categoria
    const [pedidos] = await pool.query(`
      SELECT 
        si.nombre_sucursal,
        si.silueta,
        si.categoria_descripcion as categoria,
        COUNT(DISTINCT DATE(si.fecha)) as dias_con_pedidos,
        MIN(si.fecha) as primera_fecha,
        MAX(si.fecha) as ultima_fecha,
        DATEDIFF(MAX(si.fecha), MIN(si.fecha)) as dias_totales,
        COUNT(*) as total_pedidos
      FROM sell_in si
      WHERE si.fecha IS NOT NULL
      GROUP BY si.nombre_sucursal, si.silueta, si.categoria_descripcion
      HAVING dias_totales > 0
    `);

    const resultado = pedidos.map(p => {
      const diasTotales = parseInt(p.dias_totales || 1);
      const totalPedidos = parseInt(p.total_pedidos || 0);
      const diasConPedidos = parseInt(p.dias_con_pedidos || 1);
      
      // Tiempo promedio entre pedidos
      const tiempoEntrePedidos = diasTotales / Math.max(totalPedidos, 1);
      
      // Tiempo de reposición estimado (promedio de días entre pedidos)
      const leadTime = tiempoEntrePedidos;

      return {
        sucursal: p.nombre_sucursal || 'Todas',
        silueta: p.silueta,
        categoria: p.categoria || 'Sin categoría',
        dias_totales: diasTotales,
        total_pedidos: totalPedidos,
        dias_con_pedidos: diasConPedidos,
        tiempo_entre_pedidos: Math.round(tiempoEntrePedidos * 10) / 10,
        lead_time_estimado: Math.round(leadTime * 10) / 10
      };
    });

    // Calcular estadísticas generales
    const leadTimes = resultado.filter(r => r.lead_time_estimado > 0).map(r => r.lead_time_estimado);
    const promedioLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length 
      : 0;

    return {
      detalle: resultado,
      estadisticas: {
        promedio_lead_time: Math.round(promedioLeadTime * 10) / 10,
        minimo_lead_time: leadTimes.length > 0 ? Math.min(...leadTimes) : 0,
        maximo_lead_time: leadTimes.length > 0 ? Math.max(...leadTimes) : 0,
        total_registros: resultado.length
      }
    };
  } catch (error) {
    console.error('Error calculando tiempo de reposición:', error);
    throw error;
  }
}

// Índice de cobertura de inventario
// Compara inventario actual con demanda esperada del mismo período anterior
export async function getIndiceCoberturaInventario() {
  try {
    // Obtener último mes disponible en inventario
    const [ultimoMes] = await pool.query(`
      SELECT año, mes
      FROM inventario
      WHERE existencia IS NOT NULL
      ORDER BY año DESC, mes DESC
      LIMIT 1
    `);

    if (!ultimoMes || ultimoMes.length === 0) {
      return [];
    }

    const { año: añoActual, mes: mesActual } = ultimoMes[0];
    const añoAnterior = añoActual - 1;

    // Inventario actual por categoría/género
    const [inventario] = await pool.query(`
      SELECT 
        i.categoria,
        i.genero_arreglado,
        SUM(i.existencia) as existencia_actual
      FROM inventario i
      WHERE i.año = ? AND i.mes = ? AND i.existencia IS NOT NULL
      GROUP BY i.categoria, i.genero_arreglado
    `, [añoActual, mesActual]);

    // Demanda del mismo período anterior
    const [demandaAnterior] = await pool.query(`
      SELECT 
        so.categoria,
        so.genero_arreglado,
        SUM(so.cantidad) as demanda_periodo_anterior
      FROM sell_out so
      WHERE YEAR(so.fecha) = ? 
        AND MONTH(so.fecha) = ?
        AND so.cantidad IS NOT NULL
        AND so.cantidad > 0
      GROUP BY so.categoria, so.genero_arreglado
    `, [añoAnterior, mesActual]);

    // Crear mapa de demanda
    const demandaMap = {};
    demandaAnterior.forEach(d => {
      const key = `${d.categoria || 'Sin categoría'}|${d.genero_arreglado || 'Sin género'}`;
      demandaMap[key] = parseFloat(d.demanda_periodo_anterior || 0);
    });

    // Calcular índice de cobertura
    const resultado = inventario.map(inv => {
      const key = `${inv.categoria || 'Sin categoría'}|${inv.genero_arreglado || 'Sin género'}`;
      const existencia = parseFloat(inv.existencia_actual || 0);
      const demanda = demandaMap[key] || 0;
      
      let indice_cobertura = 0;
      let estado = 'sin_datos';
      
      if (demanda > 0) {
        indice_cobertura = (existencia / demanda) * 100;
        if (indice_cobertura >= 100) {
          estado = 'suficiente';
        } else if (indice_cobertura >= 50) {
          estado = 'parcial';
        } else {
          estado = 'insuficiente';
        }
      } else if (existencia > 0) {
        estado = 'sin_comparacion';
      }

      return {
        categoria: inv.categoria || 'Sin categoría',
        genero: inv.genero_arreglado || 'Sin género',
        existencia_actual: existencia,
        demanda_periodo_anterior: demanda,
        indice_cobertura: Math.round(indice_cobertura * 10) / 10,
        estado,
        periodo_comparacion: `${mesActual}/${añoAnterior}`
      };
    });

    return resultado;
  } catch (error) {
    console.error('Error calculando índice de cobertura:', error);
    throw error;
  }
}

// Función principal que obtiene todas las métricas de optimización
export async function getInventoryOptimizationMetrics() {
  try {
    const [diasInventario, analisisABC, tiempoReposicion, indiceCobertura] = await Promise.all([
      getDiasInventarioDisponible(),
      getAnalisisABC(),
      getTiempoReposicion(),
      getIndiceCoberturaInventario()
    ]);

    return {
      diasInventarioDisponible: diasInventario,
      analisisABC,
      tiempoReposicion,
      indiceCoberturaInventario: indiceCobertura,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error obteniendo métricas de optimización:', error);
    throw error;
  }
}

// Obtener datos para gráfico de dispersión: Sell In vs Sell Out por sucursal
export async function getScatterDataSellInVsSellOut() {
  try {
    // MySQL no soporta FULL OUTER JOIN, usar UNION en su lugar
    const [scatterDataFixed] = await pool.query(`
      SELECT 
        nombre_sucursal,
        canal,
        SUM(ventas_sell_in) as ventas_sell_in,
        SUM(ventas_sell_out) as ventas_sell_out,
        SUM(unidades_sell_in) as unidades_sell_in,
        SUM(unidades_sell_out) as unidades_sell_out,
        SUM(dias_sell_in) as dias_sell_in,
        SUM(dias_sell_out) as dias_sell_out
      FROM (
        SELECT 
          nombre_sucursal,
          canal,
          SUM(ventas) as ventas_sell_in,
          0 as ventas_sell_out,
          SUM(unidades) as unidades_sell_in,
          0 as unidades_sell_out,
          COUNT(DISTINCT fecha) as dias_sell_in,
          0 as dias_sell_out
        FROM sell_in
        WHERE nombre_sucursal IS NOT NULL AND ventas IS NOT NULL
        GROUP BY nombre_sucursal, canal
        
        UNION ALL
        
        SELECT 
          nombre_sucursal,
          canal,
          0 as ventas_sell_in,
          SUM(ventas) as ventas_sell_out,
          0 as unidades_sell_in,
          SUM(cantidad) as unidades_sell_out,
          0 as dias_sell_in,
          COUNT(DISTINCT fecha) as dias_sell_out
        FROM sell_out
        WHERE nombre_sucursal IS NOT NULL AND ventas IS NOT NULL
        GROUP BY nombre_sucursal, canal
      ) as combined
      GROUP BY nombre_sucursal, canal
      HAVING ventas_sell_in > 0 OR ventas_sell_out > 0
      ORDER BY (ventas_sell_in + ventas_sell_out) DESC
    `);

    return scatterDataFixed.map((row: any) => ({
      nombre_sucursal: row.nombre_sucursal || 'Sin nombre',
      canal: row.canal || 'Sin canal',
      ventas_sell_in: parseFloat(row.ventas_sell_in || 0),
      ventas_sell_out: parseFloat(row.ventas_sell_out || 0),
      unidades_sell_in: parseInt(row.unidades_sell_in || 0),
      unidades_sell_out: parseInt(row.unidades_sell_out || 0),
      dias_sell_in: parseInt(row.dias_sell_in || 0),
      dias_sell_out: parseInt(row.dias_sell_out || 0),
      // Calcular ratio para colorear puntos
      ratio: row.ventas_sell_in > 0 
        ? (parseFloat(row.ventas_sell_out || 0) / parseFloat(row.ventas_sell_in || 0)) * 100 
        : 0
    }));
  } catch (error) {
    console.error('Error obteniendo datos de dispersión:', error);
    throw error;
  }
}

// Cerrar pool de conexiones
export async function closePool() {
  await pool.end();
}

export default pool;

