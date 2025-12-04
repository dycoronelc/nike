-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('analista', 'comercial') NOT NULL,
  nombre_completo VARCHAR(200),
  email VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuarios de prueba
-- Contraseña: "password123" hasheada con bcrypt (hash: $2b$10$rOzJ8K8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK)
-- Para simplificar, usaremos un hash simple. En producción usar bcrypt o similar
INSERT INTO usuarios (username, password, rol, nombre_completo, email) VALUES
('analista', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'analista', 'Usuario Analista', 'analista@nike.com'),
('comercial', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'comercial', 'Usuario Comercial', 'comercial@nike.com')
ON DUPLICATE KEY UPDATE username=username;

