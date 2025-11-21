# 💻 Importar usando Línea de Comandos

## Si tienes MySQL instalado localmente

### Paso 1: Verificar que MySQL esté instalado

En **PowerShell** o **CMD**:
```bash
mysql --version
```

Si dice "command not found", necesitas instalar MySQL Client o usar un cliente GUI.

---

### Paso 2: Comando de Importación

**Comando completo:**
```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < ruta\a\tu\archivo.sql
```

**Ejemplo si el archivo está en C:\react\nike\backup.sql:**
```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < C:\react\nike\backup.sql
```

---

### Paso 3: En PowerShell (Windows)

Si tienes problemas con caracteres especiales, usa variables de entorno:

```powershell
$env:MYSQL_PWD="AssyoByxyfuUFSMhabDjUYPWtUbwyrJx"
mysql -h gondola.proxy.rlwy.net -P 18127 -u root railway < C:\ruta\a\tu\archivo.sql
```

O usa comillas simples:
```powershell
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < C:\ruta\a\tu\archivo.sql
```

---

### Paso 4: Para archivos grandes (218 MB)

Agrega estas opciones para evitar timeout:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' \
      --max_allowed_packet=1G \
      --net_buffer_length=16384 \
      --compress \
      railway < C:\ruta\a\tu\archivo.sql
```

En PowerShell:
```powershell
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' --max_allowed_packet=1G --net_buffer_length=16384 --compress railway < C:\ruta\a\tu\archivo.sql
```

---

## ⚠️ Si no tienes MySQL instalado

### Opción 1: Instalar solo el cliente MySQL

1. Descarga MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Durante la instalación, selecciona solo **"MySQL Client"** o **"MySQL Command Line Client"**
3. No necesitas instalar el servidor completo

### Opción 2: Usar un cliente GUI (Más fácil)

Usa uno de estos (más fácil para archivos grandes):
- **MySQL Workbench** (oficial de MySQL)
- **HeidiSQL** (ligero, Windows)
- **DBeaver** (multi-plataforma)

Ver el archivo `IMPORT_WITH_CLIENT.md` para instrucciones detalladas.

---

## 🔍 Verificar Conexión Primero

Antes de importar, prueba la conexión:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway -e "SELECT 'Conexión exitosa' as status;"
```

Si ves "Conexión exitosa", puedes proceder con la importación.

