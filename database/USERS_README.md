# Tabla de Usuarios - Sistema de Autenticación

## Descripción

Esta tabla almacena los usuarios del sistema con sus credenciales y roles para el sistema de autenticación.

## Crear Tabla y Usuarios de Prueba

Para crear la tabla de usuarios e insertar usuarios de prueba, ejecuta:

```bash
cd server
npm run create-users
```

O directamente:

```bash
node server/create-users.js
```

## Usuarios de Prueba

El script crea automáticamente dos usuarios de prueba:

### Usuario Analista
- **Username:** `analista`
- **Contraseña:** `password123`
- **Rol:** `analista`
- **Email:** analista@nike.com

### Usuario Comercial
- **Username:** `comercial`
- **Contraseña:** `password123`
- **Rol:** `comercial`
- **Email:** comercial@nike.com

## Estructura de la Tabla

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('analista', 'comercial') NOT NULL,
  nombre_completo VARCHAR(200),
  email VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Seguridad

⚠️ **IMPORTANTE:** El sistema actual usa un hash SHA-256 simple para las contraseñas. 

**Para producción, se recomienda:**
- Usar bcrypt o argon2 para hashear contraseñas
- Implementar tokens JWT para sesiones
- Agregar rate limiting en el endpoint de login
- Implementar políticas de contraseñas seguras
- Agregar logs de auditoría

## Endpoint de Login

El backend expone un endpoint `/api/login` que acepta:

```json
{
  "username": "analista",
  "password": "password123"
}
```

Y retorna:

```json
{
  "success": true,
  "user": {
    "username": "analista",
    "role": "analista",
    "nombreCompleto": "Usuario Analista",
    "email": "analista@nike.com"
  }
}
```

## Notas

- El script es idempotente: puedes ejecutarlo múltiples veces sin problemas
- Si los usuarios ya existen, no se duplicarán
- Las contraseñas se hashean automáticamente antes de guardarse
- Solo usuarios con `activo = TRUE` pueden autenticarse

