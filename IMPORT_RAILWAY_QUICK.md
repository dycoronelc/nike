# 🚀 Importar Base de Datos a Railway - Guía Rápida

## Paso 1: Exportar Base de Datos Local

### Opción A: Usando el Script de Node.js (Recomendado si no tienes mysqldump)

```bash
# Asegúrate de tener las variables de entorno configuradas en tu .env local
# O ajusta el script para usar tus credenciales locales

cd C:\react\nike
node server/export-db.js
```

Esto creará el archivo `nike_dashboard_export.sql` en la raíz del proyecto.

### Opción B: Usando mysqldump (si lo tienes instalado)

```bash
mysqldump -u root -p nike_dashboard > nike_dashboard_export.sql
```

---

## Paso 2: Obtener Credenciales de Railway MySQL

1. Ve a **Railway** → Tu proyecto → **Servicio MySQL**
2. Click en **"Variables"**
3. Copia estas variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

---

## Paso 3: Importar en Railway

### Opción A: Desde tu máquina local (Más fácil)

```bash
# Reemplaza los valores con las credenciales de Railway que copiaste
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE < nike_dashboard_export.sql
```

**Ejemplo real:**
```bash
mysql -h mysql-production.railway.internal \
      -P 3306 \
      -u root \
      -p'Abc123Xyz' \
      railway \
      < nike_dashboard_export.sql
```

### Opción B: Usando Railway CLI

```bash
# Instala Railway CLI si no lo tienes
npm install -g @railway/cli

# Login
railway login

# Link a tu proyecto
railway link
# Selecciona tu proyecto y servicio MySQL

# Obtén las variables y usa mysql local
mysql -h $(railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty MYSQLHOST) \
      -u $(railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty MYSQLUSER) \
      -p$(railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty MYSQLPASSWORD) \
      $(railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty MYSQLDATABASE) \
      < nike_dashboard_export.sql
```

### Opción C: Usando Cliente MySQL (Workbench, DBeaver, HeidiSQL, etc.)

1. **Abre tu cliente MySQL** (Workbench, HeidiSQL, DBeaver, etc.)

2. **Crea una nueva conexión:**
   - Host: `MYSQLHOST_de_Railway` (ej: `mysql-production.railway.internal`)
   - Port: `MYSQLPORT_de_Railway` (generalmente `3306`)
   - Usuario: `MYSQLUSER_de_Railway`
   - Contraseña: `MYSQLPASSWORD_de_Railway`
   - Database: `MYSQLDATABASE_de_Railway`

3. **Conéctate a Railway**

4. **Importa el archivo SQL:**
   - En Workbench: File → Run SQL Script → Selecciona `nike_dashboard_export.sql`
   - En HeidiSQL: File → Load SQL file → Selecciona `nike_dashboard_export.sql`
   - En DBeaver: Click derecho en la base de datos → Tools → Execute Script → Selecciona el archivo

---

## Paso 4: Verificar Importación

Después de importar, verifica que los datos estén correctos:

```bash
mysql -h MYSQLHOST -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE -e "
  SELECT 
    (SELECT COUNT(*) FROM sell_in) as sell_in_count,
    (SELECT COUNT(*) FROM sell_out) as sell_out_count,
    (SELECT COUNT(*) FROM inventario) as inventario_count;
"
```

O desde tu cliente MySQL:

```sql
SELECT 
  (SELECT COUNT(*) FROM sell_in) as sell_in_count,
  (SELECT COUNT(*) FROM sell_out) as sell_out_count,
  (SELECT COUNT(*) FROM inventario) as inventario_count;
```

---

## ⚠️ Notas Importantes

1. **Si el archivo es muy grande:**
   - Puede tardar varios minutos
   - Asegúrate de tener buena conexión a internet

2. **Si tienes errores de timeout:**
   - Aumenta el timeout de MySQL en Railway
   - O importa por partes (estructura primero, luego datos)

3. **Si Railway no acepta conexiones externas:**
   - Algunos servicios de Railway MySQL solo aceptan conexiones desde otros servicios de Railway
   - En ese caso, usa Railway CLI o importa desde el backend una vez desplegado

---

## ✅ Checklist

- [ ] Base de datos local exportada (`nike_dashboard_export.sql`)
- [ ] Credenciales de Railway MySQL copiadas
- [ ] Archivo SQL importado en Railway
- [ ] Conteo de registros verificado
- [ ] Backend conectado a Railway MySQL

