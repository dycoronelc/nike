-- Script para agregar índices que mejoran el rendimiento de las queries
-- Ejecutar este script después de crear las tablas
-- NOTA: MySQL no soporta IF NOT EXISTS en CREATE INDEX, el script Node.js maneja los errores

-- Índices para tabla sell_out (usada frecuentemente en clustering y análisis)
CREATE INDEX idx_sellout_silueta ON sell_out(silueta);
CREATE INDEX idx_sellout_nombre_sucursal ON sell_out(nombre_sucursal);
CREATE INDEX idx_sellout_fecha ON sell_out(fecha);
CREATE INDEX idx_sellout_categoria ON sell_out(categoria);
CREATE INDEX idx_sellout_genero ON sell_out(genero_arreglado);
CREATE INDEX idx_sellout_ventas ON sell_out(ventas);
CREATE INDEX idx_sellout_cantidad ON sell_out(cantidad);
-- Índice compuesto para queries de clustering de productos
CREATE INDEX idx_sellout_silueta_categoria ON sell_out(silueta, categoria);
-- Índice compuesto para queries de clustering de sucursales
CREATE INDEX idx_sellout_sucursal_fecha ON sell_out(nombre_sucursal, fecha);

-- Índices para tabla sell_in (usada para calcular ratios)
CREATE INDEX idx_sellin_silueta ON sell_in(silueta);
CREATE INDEX idx_sellin_nombre_sucursal ON sell_in(nombre_sucursal);
CREATE INDEX idx_sellin_fecha ON sell_in(fecha);
CREATE INDEX idx_sellin_ventas ON sell_in(ventas);
-- Índice compuesto para JOINs optimizados
CREATE INDEX idx_sellin_silueta_ventas ON sell_in(silueta, ventas);
CREATE INDEX idx_sellin_sucursal_ventas ON sell_in(nombre_sucursal, ventas);

-- Índices para tabla inventario (usada en optimización de inventario)
CREATE INDEX idx_inventario_sucursal ON inventario(nombre_sucursal);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_genero ON inventario(genero_arreglado);
CREATE INDEX idx_inventario_año_mes ON inventario(año, mes);
CREATE INDEX idx_inventario_existencia ON inventario(existencia);
-- Índice compuesto para queries de optimización
CREATE INDEX idx_inventario_sucursal_categoria ON inventario(nombre_sucursal, categoria);
CREATE INDEX idx_inventario_año_mes_existencia ON inventario(año, mes, existencia);

-- Índices para mejorar COUNT(DISTINCT) - MySQL puede usar estos índices para optimizar
-- Nota: Estos índices ya están cubiertos por los anteriores, pero los dejamos explícitos

-- Verificar índices creados (opcional, para debugging)
-- SHOW INDEX FROM sell_out;
-- SHOW INDEX FROM sell_in;
-- SHOW INDEX FROM inventario;

