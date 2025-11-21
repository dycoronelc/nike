# Configuración de Variables de Entorno en Railway

## Paso 1: Conectar MySQL (Connect Database)

Cuando haces clic en **"Connect Database"** en Railway, se crean automáticamente estas variables:

- `MYSQL_HOST` o `MYSQLHOST`
- `MYSQL_USER` o `MYSQLUSER`  
- `MYSQL_PASSWORD` o `MYSQLPASSWORD`
- `MYSQL_DATABASE` o `MYSQLDATABASE`
- `MYSQL_PORT` o `MYSQLPORT`
- `MYSQL_URL` (URL completa de conexión)

**✅ SÍ, debes seleccionar TODAS las variables que Railway te muestre al conectar MySQL.**

## Paso 2: Variables Adicionales Requeridas

Tu código espera estas variables con estos nombres específicos. Debes crearlas manualmente:

### Variables de Base de Datos (Mapeo)

Crea estas variables adicionales que mapean los nombres de Railway a los que tu código espera:

| Variable a Crear | Valor (usa las variables de Railway) |
|-----------------|--------------------------------------|
| `DB_HOST` | Usa el valor de `MYSQLHOST` o `MYSQL_HOST` |
| `DB_USER` | Usa el valor de `MYSQLUSER` o `MYSQL_USER` |
| `DB_PASSWORD` | Usa el valor de `MYSQLPASSWORD` o `MYSQL_PASSWORD` |
| `DB_NAME` | Usa el valor de `MYSQLDATABASE` o `MYSQL_DATABASE` |

### Variables del Servidor

| Variable | Valor | ¿Requerida? |
|----------|-------|-------------|
| `PORT` | `5000` o déjala vacía (Railway asignará una automáticamente) | **Opcional** |
| `NODE_ENV` | `production` | **Recomendada** |

## Paso 3: Cómo Crear las Variables en Railway

1. En el servicio Backend, ve a la pestaña **"Variables"**
2. Haz clic en **"+ New Variable"**
3. Para cada variable de mapeo:
   - **Nombre**: `DB_HOST`
   - **Valor**: Haz clic en el ícono de referencia (🔗) y selecciona `MYSQLHOST` (esto crea una referencia)
   - Repite para `DB_USER`, `DB_PASSWORD`, `DB_NAME`
4. Para `NODE_ENV`:
   - **Nombre**: `NODE_ENV`
   - **Valor**: `production`
5. Para `PORT`: Puedes dejarla vacía o poner `5000` (Railway la sobrescribirá con su puerto interno)

## Resumen Rápido

✅ **Selecciona TODAS las variables de MySQL** cuando hagas "Connect Database"

✅ **Crea estas variables adicionales:**
- `DB_HOST` → referencia a `MYSQLHOST`
- `DB_USER` → referencia a `MYSQLUSER`
- `DB_PASSWORD` → referencia a `MYSQLPASSWORD`
- `DB_NAME` → referencia a `MYSQLDATABASE`
- `NODE_ENV` → `production`
- `PORT` → (opcional, Railway la asigna automáticamente)

## Nota Importante

Railway asigna automáticamente el `PORT` cuando despliega. Tu código ya tiene un fallback (`process.env.PORT || 5000`), así que si no creas la variable `PORT`, funcionará igual.

