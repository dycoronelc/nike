export const dataProcessor = {
  process(rawData) {
    const kpis = this.calculateKPIs(rawData);
    const timeSeries = this.createTimeSeries(rawData);
    
    return { kpis, timeSeries };
  },

  calculateKPIs(rawData) {
    // KPIs Sell In
    const sellInTotal = rawData.sellIn.reduce((sum, item) => {
      const ventas = parseFloat(item.Ventas) || 0;
      return sum + ventas;
    }, 0);

    const sellInUnidades = rawData.sellIn.reduce((sum, item) => {
      const unidades = parseInt(item.Unidades) || 0;
      return sum + unidades;
    }, 0);

    const sellInPromedio = sellInUnidades > 0 ? sellInTotal / sellInUnidades : 0;

    // KPIs Sell Out
    const sellOutTotal = rawData.sellOut.reduce((sum, item) => {
      const ventas = parseFloat(item.Ventas) || 0;
      return sum + ventas;
    }, 0);

    const sellOutCantidad = rawData.sellOut.reduce((sum, item) => {
      const cantidad = parseInt(item.Cantidad) || 0;
      return sum + cantidad;
    }, 0);

    const sellOutPromedio = sellOutCantidad > 0 ? sellOutTotal / sellOutCantidad : 0;

    // KPIs Inventario
    const inventarioTotal = rawData.inventario.reduce((sum, item) => {
      const existencia = parseFloat(item.Existencia) || 0;
      return sum + existencia;
    }, 0);

    const sucursalesUnicas = new Set(rawData.inventario.map(item => item['Nombre Sucursal'])).size;
    const productosUnicos = new Set([
      ...rawData.sellIn.map(item => item.Silueta),
      ...rawData.sellOut.map(item => item.Silueta)
    ]).size;

    // Ratio Sell Out / Sell In
    const ratioSellOutSellIn = sellInTotal > 0 ? (sellOutTotal / sellInTotal) * 100 : 0;

    // Fechas
    const fechasSellIn = rawData.sellIn.map(item => {
      const fecha = item.Fecha;
      if (typeof fecha === 'number') {
        // Excel serial date
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + fecha * 86400000);
      }
      return new Date(fecha);
    }).filter(f => !isNaN(f.getTime()));

    const fechaMin = fechasSellIn.length > 0 ? new Date(Math.min(...fechasSellIn.map(d => d.getTime()))) : null;
    const fechaMax = fechasSellIn.length > 0 ? new Date(Math.max(...fechasSellIn.map(d => d.getTime()))) : null;

    return {
      sellIn: {
        totalVentas: sellInTotal,
        totalUnidades: sellInUnidades,
        promedioTicket: sellInPromedio,
        registros: rawData.sellIn.length
      },
      sellOut: {
        totalVentas: sellOutTotal,
        totalUnidades: sellOutCantidad,
        promedioTicket: sellOutPromedio,
        registros: rawData.sellOut.length
      },
      inventario: {
        totalExistencia: inventarioTotal,
        sucursales: sucursalesUnicas,
        registros: rawData.inventario.length
      },
      general: {
        productosUnicos,
        ratioSellOutSellIn,
        fechaMin: fechaMin?.toISOString(),
        fechaMax: fechaMax?.toISOString()
      }
    };
  },

  createTimeSeries(rawData) {
    // Agrupar por mes y año
    const sellInByMonth = {};
    const sellOutByMonth = {};

    rawData.sellIn.forEach(item => {
      const mes = parseInt(item.Mes) || 1;
      const año = parseInt(item['Año']) || 2023;
      const key = `${año}-${String(mes).padStart(2, '0')}`;
      const ventas = parseFloat(item.Ventas) || 0;
      const unidades = parseInt(item.Unidades) || 0;

      if (!sellInByMonth[key]) {
        sellInByMonth[key] = { ventas: 0, unidades: 0 };
      }
      sellInByMonth[key].ventas += ventas;
      sellInByMonth[key].unidades += unidades;
    });

    rawData.sellOut.forEach(item => {
      const mes = parseInt(item.Mes) || 1;
      const año = parseInt(item['Año']) || 2023;
      const key = `${año}-${String(mes).padStart(2, '0')}`;
      const ventas = parseFloat(item.Ventas) || 0;
      const cantidad = parseInt(item.Cantidad) || 0;

      if (!sellOutByMonth[key]) {
        sellOutByMonth[key] = { ventas: 0, cantidad: 0 };
      }
      sellOutByMonth[key].ventas += ventas;
      sellOutByMonth[key].cantidad += cantidad;
    });

    // Convertir a arrays ordenados
    const allKeys = [...new Set([...Object.keys(sellInByMonth), ...Object.keys(sellOutByMonth)])].sort();

    return allKeys.map(key => ({
      fecha: key,
      sellIn: sellInByMonth[key] || { ventas: 0, unidades: 0 },
      sellOut: sellOutByMonth[key] || { ventas: 0, cantidad: 0 }
    }));
  }
};

