# Optimizaciones de Rendimiento Implementadas

Este documento describe las optimizaciones implementadas para mejorar el rendimiento del backend.

## 🚀 Optimizaciones Aplicadas

### 1. Optimización de Queries SQL
**Problema:** Subconsultas correlacionadas ejecutándose por cada fila (muy costosas)
**Solución:** Reemplazadas por JOINs optimizados

**Archivos modificados:**
- `server/db.js`: 
  - `getProductosForClustering()`: Ahora usa LEFT JOINs en lugar de subconsultas
  - `getSucursalesForClustering()`: Optimizado con JOINs

**Mejora esperada:** 3-5x más rápido en queries de clustering

### 2. Sistema de Cache
**Problema:** Cálculos costosos (clusters, predicciones) se ejecutaban en cada request
**Solución:** Sistema de cache en memoria con TTL configurable

**Archivos creados:**
- `server/cache.js`: Sistema de cache simple pero efectivo

**Endpoints con cache:**
- `/api/predictions` - Cache: 10 minutos
- `/api/clusters/productos` - Cache: 15 minutos
- `/api/clusters/sucursales` - Cache: 15 minutos
- `/api/inventory-optimization` - Cache: 10 minutos
- `/api/kpis` - Cache: 5 minutos (solo sin filtros)

**Mejora esperada:** 10-100x más rápido en requests repetidos

### 3. Optimización de Algoritmo K-means
**Problema:** Algoritmo K-means lento con muchas iteraciones
**Solución:** 
- Reducido maxIterations de 100 a 50
- Implementado inicialización K-means++ (mejor que aleatorio)
- Detección temprana de convergencia

**Archivos modificados:**
- `server/ml-service.js`: Función `kMeans()` optimizada

**Mejora esperada:** 2-3x más rápido en clustering

### 4. Índices de Base de Datos
**Problema:** Queries lentas sin índices en columnas frecuentemente consultadas
**Solución:** Script SQL para agregar índices estratégicos

**Archivos creados:**
- `database/add-indexes.sql`: Script con todos los índices necesarios
- `server/add-indexes.js`: Script Node.js para ejecutar los índices

**Índices agregados:**
- `sell_out`: silueta, nombre_sucursal, fecha, categoria, genero_arreglado
- `sell_in`: silueta, nombre_sucursal, fecha
- `inventario`: nombre_sucursal, categoria, año_mes, existencia
- Índices compuestos para queries específicas

**Mejora esperada:** 2-10x más rápido en queries con WHERE y JOINs

## 📋 Instrucciones para Aplicar Optimizaciones

### Paso 1: Aplicar Índices a la Base de Datos

**Opción A: Usando el script Node.js (recomendado)**
```bash
node server/add-indexes.js
```

**Opción B: Ejecutar SQL directamente**
```bash
mysql -u [usuario] -p [nombre_base_datos] < database/add-indexes.sql
```

**Opción C: Desde MySQL Workbench o cliente SQL**
1. Abrir `database/add-indexes.sql`
2. Ejecutar todo el script

### Paso 2: Verificar que el Cache Funciona

El cache se activa automáticamente. Para verificar:

1. Hacer una request a `/api/clusters/productos` (primera vez será lenta)
2. Hacer la misma request inmediatamente (debería ser instantánea, verás "✅ obtenidos del cache" en logs)
3. Ver estadísticas del cache: `GET /api/cache/stats`

### Paso 3: Limpiar Cache cuando sea Necesario

Si actualizas datos y necesitas invalidar el cache:

```bash
# Limpiar todo el cache
POST /api/cache/clear
Body: {}

# Limpiar solo clusters
POST /api/cache/clear
Body: { "pattern": "clusters:*" }
```

## 📊 Mejoras de Rendimiento Esperadas

| Endpoint | Antes | Después | Mejora |
|----------|-------|---------|--------|
| `/api/clusters/productos` | 5-10s | 0.5-1s (primera vez)<br>0.01s (cache) | 5-10x (primera)<br>500-1000x (cache) |
| `/api/clusters/sucursales` | 5-10s | 0.5-1s (primera vez)<br>0.01s (cache) | 5-10x (primera)<br>500-1000x (cache) |
| `/api/predictions` | 2-5s | 0.3-0.8s (primera vez)<br>0.01s (cache) | 3-5x (primera)<br>200-500x (cache) |
| `/api/inventory-optimization` | 3-8s | 0.5-1.5s (primera vez)<br>0.01s (cache) | 3-5x (primera)<br>300-800x (cache) |

## 🔍 Monitoreo

### Ver Estadísticas del Cache
```bash
GET /api/cache/stats
```

Respuesta:
```json
{
  "total": 5,
  "valid": 4,
  "expired": 1
}
```

### Logs del Servidor
El servidor ahora muestra cuando usa cache:
- `✅ [endpoint] obtenidos del cache` - Cache hit
- Sin mensaje - Cache miss (primera vez o expirado)

## ⚠️ Notas Importantes

1. **Cache en Memoria:** El cache se pierde al reiniciar el servidor. Para producción, considera usar Redis.

2. **Invalidación de Cache:** Si actualizas datos manualmente en la BD, limpia el cache con `/api/cache/clear`

3. **Índices:** Los índices ocupan espacio adicional en la BD, pero mejoran significativamente las queries. Son esenciales para buen rendimiento.

4. **TTL del Cache:** Los tiempos de cache están configurados para balance entre frescura de datos y rendimiento. Ajusta según tus necesidades.

## 🚀 Próximas Optimizaciones (Opcionales)

Si aún necesitas más rendimiento:

1. **Redis para Cache Distribuido:** Si tienes múltiples instancias del servidor
2. **Vistas Materializadas:** Para queries muy complejas que se ejecutan frecuentemente
3. **Particionamiento de Tablas:** Si las tablas crecen mucho (>1M registros)
4. **Connection Pooling Avanzado:** Optimizar configuración del pool de MySQL
5. **Migración a Python:** Para algoritmos ML más complejos (numpy, scikit-learn)

## 📝 Archivos Modificados

- `server/db.js` - Queries SQL optimizadas
- `server/ml-service.js` - Algoritmo K-means optimizado
- `server/index.js` - Integración de cache en endpoints
- `server/cache.js` - **NUEVO** - Sistema de cache
- `server/add-indexes.js` - **NUEVO** - Script para aplicar índices
- `database/add-indexes.sql` - **NUEVO** - Script SQL de índices

