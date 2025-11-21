# 💾 Exportar e Importar Base de Datos MySQL

## 📤 Paso 1: Exportar Base de Datos Local

### Opción A: Usando mysqldump (Recomendado)

```bash
# Desde tu máquina local
mysqldump -u root -p nike_dashboard > nike_dashboard_backup.sql
```

Si tu usuario no es `root` o la base de datos tiene otro nombre, ajusta:
```bash
mysqldump -u TU_USUARIO -p nike_dashboard > nike_dashboard_backup.sql
```

### Opción B: Exportar solo datos (sin estructura)

Si solo quieres exportar los datos:
```bash
mysqldump -u root -p --no-create-info nike_dashboard > nike_dashboard_data.sql
```

### Opción C: Exportar estructura y datos por separado

```bash
# Solo estructura (tablas)
mysqldump -u root -p --no-data nike_dashboard > nike_dashboard_structure.sql

# Solo datos
mysqldump -u root -p --no-create-info nike_dashboard > nike_dashboard_data.sql
```

---

## 📥 Paso 2: Obtener Credenciales de Railway MySQL

1. Ve a Railway → Tu proyecto → Servicio MySQL
2. Ve a la pestaña **"Variables"**
3. Copia estas variables:
   - `MYSQLHOST`
   - `MYSQLPORT` (generalmente 3306)
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

---

## 📥 Paso 3: Importar en Railway MySQL

### Opción A: Desde tu máquina local (Recomendado)

```bash
# Reemplaza los valores con las credenciales de Railway
mysql -h MYSQLHOST_de_Railway \
      -P MYSQLPORT_de_Railway \
      -u MYSQLUSER_de_Railway \
      -p'MYSQLPASSWORD_de_Railway' \
      MYSQLDATABASE_de_Railway \
      < nike_dashboard_backup.sql
```

**Ejemplo:**
```bash
mysql -h mysql.railway.internal \
      -P 3306 \
      -u root \
      -p'TuPassword123' \
      railway \
      < nike_dashboard_backup.sql
```

### Opción B: Usando Railway CLI

1. **Instala Railway CLI** (si no lo tienes):
```bash
npm install -g @railway/cli
```

2. **Login y link a tu proyecto:**
```bash
railway login
railway link
# Selecciona tu proyecto y servicio MySQL
```

3. **Importa el archivo SQL:**
```bash
# Si Railway CLI permite conexión directa
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < nike_dashboard_backup.sql
```

O usando conexión local con las credenciales:
```bash
mysql -h $(railway variables MYSQLHOST) \
      -u $(railway variables MYSQLUSER) \
      -p$(railway variables MYSQLPASSWORD) \
      $(railway variables MYSQLDATABASE) \
      < nike_dashboard_backup.sql
```

### Opción C: Usando un cliente MySQL (Workbench, DBeaver, etc.)

1. Abre tu cliente MySQL favorito
2. Crea una nueva conexión con las credenciales de Railway:
   - Host: `MYSQLHOST_de_Railway`
   - Port: `MYSQLPORT_de_Railway`
   - User: `MYSQLUSER_de_Railway`
   - Password: `MYSQLPASSWORD_de_Railway`
   - Database: `MYSQLDATABASE_de_Railway`

3. Una vez conectado:
   - Ve a "Import" o "Execute SQL Script"
   - Selecciona el archivo `nike_dashboard_backup.sql`
   - Ejecuta la importación

---

## ⚠️ Notas Importantes

### Si el archivo es muy grande

Si el archivo SQL es muy grande (>100MB), puedes:

1. **Comprimir el archivo:**
```bash
# Comprimir
gzip nike_dashboard_backup.sql

# Importar comprimido (en Linux/Mac)
gunzip < nike_dashboard_backup.sql.gz | mysql -h HOST -u USER -p DB
```

2. **Usar conexión persistente:**
```bash
mysql -h HOST -u USER -p DB --max_allowed_packet=1G < nike_dashboard_backup.sql
```

### Verificar la importación

Después de importar, verifica que los datos estén correctos:

```bash
mysql -h MYSQLHOST -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE -e "
  SELECT 
    (SELECT COUNT(*) FROM sell_in) as sell_in_count,
    (SELECT COUNT(*) FROM sell_out) as sell_out_count,
    (SELECT COUNT(*) FROM inventario) as inventario_count;
"
```

---

## 🔄 Alternativa: Ejecutar Script de Inicialización

Si prefieres no exportar/importar, puedes ejecutar el script de inicialización directamente en Railway:

```bash
# Configura las variables de entorno localmente
export DB_HOST=HOST_de_Railway
export DB_PORT=PORT_de_Railway
export DB_USER=USER_de_Railway
export DB_PASSWORD=PASSWORD_de_Railway
export DB_NAME=DATABASE_de_Railway

# Ejecuta el script (necesitarás los archivos Excel localmente)
node server/init-db.js
```

---

## ✅ Checklist

- [ ] Base de datos local exportada
- [ ] Credenciales de Railway MySQL copiadas
- [ ] Archivo SQL importado en Railway
- [ ] Datos verificados (counts de tablas)
- [ ] Backend configurado con credenciales de Railway

