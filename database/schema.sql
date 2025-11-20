-- Base de datos para Nike Dashboard - Northbay International
-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS nike_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nike_dashboard;

-- Tabla Sell In (Ventas a clientes)
CREATE TABLE IF NOT EXISTS sell_in (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    temp VARCHAR(10),
    mes INT,
    año INT,
    cuenta VARCHAR(50),
    canal VARCHAR(50),
    marca_codigo VARCHAR(50),
    genero_descripcion VARCHAR(100),
    genero_arreglado VARCHAR(100),
    sucursal VARCHAR(50),
    nombre_sucursal VARCHAR(200),
    categoria_descripcion VARCHAR(200),
    familia VARCHAR(200),
    silueta VARCHAR(200),
    unidades INT,
    ventas DECIMAL(15, 2),
    temp_code VARCHAR(10),
    bu VARCHAR(50),
    comp_noncomp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha),
    INDEX idx_cuenta (cuenta),
    INDEX idx_sucursal (sucursal),
    INDEX idx_marca (marca_codigo),
    INDEX idx_categoria (categoria_descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Sell Out (Ventas de clientes a usuarios finales)
CREATE TABLE IF NOT EXISTS sell_out (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    temp VARCHAR(10),
    mes INT,
    año INT,
    cuenta VARCHAR(50),
    canal VARCHAR(50),
    codigo_marca VARCHAR(50),
    genero_desc VARCHAR(100),
    genero_arreglado VARCHAR(100),
    sucursal VARCHAR(50),
    nombre_sucursal VARCHAR(200),
    categoria VARCHAR(200),
    familia VARCHAR(200),
    silueta VARCHAR(200),
    cantidad INT,
    ventas DECIMAL(15, 2),
    ventas_moneda_local DECIMAL(15, 2),
    temp_code VARCHAR(10),
    bu VARCHAR(50),
    comp_noncomp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha),
    INDEX idx_cuenta (cuenta),
    INDEX idx_sucursal (sucursal),
    INDEX idx_marca (codigo_marca),
    INDEX idx_categoria (categoria),
    INDEX idx_silueta (silueta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Inventario
CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    año INT NOT NULL,
    mes INT NOT NULL,
    dia INT,
    cuenta VARCHAR(50),
    canal VARCHAR(50),
    codigo_marca VARCHAR(50),
    nombre_sucursal VARCHAR(200),
    store_type VARCHAR(50),
    genero_desc VARCHAR(100),
    genero_arreglado VARCHAR(100),
    existencia DECIMAL(15, 2),
    bu_arreglado VARCHAR(50),
    categoria VARCHAR(200),
    temp_code VARCHAR(50),
    comp_nocomp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_año_mes (año, mes),
    INDEX idx_cuenta (cuenta),
    INDEX idx_sucursal (nombre_sucursal),
    INDEX idx_marca (codigo_marca),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para control de sincronización
CREATE TABLE IF NOT EXISTS data_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_count INT,
    status VARCHAR(50),
    error_message TEXT,
    UNIQUE KEY unique_table (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

