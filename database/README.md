# Base de Datos MySQL - Nike Dashboard

## Configuración Inicial

### 1. Instalar MySQL

Asegúrate de tener MySQL instalado y ejecutándose en tu sistema.

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (o copia `.env.example`) con la configuración de tu base de datos:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nike_dashboard
```

### 3. Inicializar Base de Datos

Ejecuta el script de inicialización que creará las tablas y cargará los datos del Excel:

```bash
# Desde la raíz del proyecto
cd server
npm run init-db

# O directamente
node database/init.js
```

Este script:
- Creará la base de datos `nike_dashboard` si no existe
- Creará las tablas necesarias (sell_in, sell_out, inventario, data_sync)
- Leerá el archivo Excel `MUESTRA DE DATA CENTURY.xlsx` de la raíz
- Insertará todos los datos en MySQL

### 4. Verificar Datos

Puedes verificar que los datos se cargaron correctamente:

```sql
USE nike_dashboard;

SELECT COUNT(*) FROM sell_in;
SELECT COUNT(*) FROM sell_out;
SELECT COUNT(*) FROM inventario;
```

## Estructura de Tablas

### sell_in
Almacena datos de ventas a clientes (Sell In)

### sell_out
Almacena datos de ventas de clientes a usuarios finales (Sell Out)

### inventario
Almacena datos de inventario por sucursal

### data_sync
Registro de sincronización y control de carga de datos

## Reimportar Datos

Si necesitas reimportar los datos desde el Excel:

1. Elimina los datos existentes (opcional):
```sql
TRUNCATE TABLE sell_in;
TRUNCATE TABLE sell_out;
TRUNCATE TABLE inventario;
```

2. Ejecuta nuevamente:
```bash
node database/init.js
```

El script detectará si ya hay datos y te avisará. Si quieres forzar la reimportación, primero elimina los datos manualmente.

## Notas

- El script procesa los datos en lotes de 1000 registros para mejor rendimiento
- Las fechas de Excel se convierten automáticamente a formato DATE de MySQL
- Los valores nulos y vacíos se manejan correctamente
- Se crean índices en las columnas más consultadas para optimizar las consultas

