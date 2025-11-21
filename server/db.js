import mysql from 'mysql2/promise';

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

    // KPIs Inventario
    const [inventarioStats] = await pool.query(`
      SELECT 
        SUM(existencia) as totalExistencia,
        COUNT(DISTINCT nombre_sucursal) as sucursales,
        COUNT(*) as registros
      FROM inventario
      WHERE existencia IS NOT NULL
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

// Cerrar pool de conexiones
export async function closePool() {
  await pool.end();
}

export default pool;

