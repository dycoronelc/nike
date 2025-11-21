# 📥 Comando para Importar Base de Datos a Railway

## ✅ Usa la URL Pública

Para conectarte desde tu máquina local, usa la URL pública:

**Host:** `gondola.proxy.rlwy.net`
**Port:** `18127`
**User:** `root`
**Password:** `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
**Database:** `railway`

---

## 🚀 Comando de Importación

Reemplaza `ruta\a\tu\archivo.sql` con la ruta completa a tu archivo SQL:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < ruta\a\tu\archivo.sql
```

**Ejemplo si tu archivo está en C:\react\nike:**
```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < C:\react\nike\nike_dashboard_export.sql
```

---

## 🔧 Si tienes problemas con caracteres especiales en PowerShell

En PowerShell de Windows, usa variables de entorno:

```powershell
$env:MYSQL_PWD="AssyoByxyfuUFSMhabDjUYPWtUbwyrJx"
mysql -h gondola.proxy.rlwy.net -P 18127 -u root railway < ruta\a\tu\archivo.sql
```

O usa comillas simples en lugar de dobles:
```powershell
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway < ruta\a\tu\archivo.sql
```

---

## ⚠️ Para archivos grandes (218 MB)

El archivo puede tardar varios minutos. Si tienes timeout, agrega estas opciones:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' \
      --max_allowed_packet=1G \
      --net_buffer_length=16384 \
      --compress \
      railway < ruta\a\tu\archivo.sql
```

---

## 🔍 Verificar Conexión Primero

Antes de importar, prueba que puedas conectarte:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' railway -e "SELECT 'Conexión exitosa' as status;"
```

Si esto funciona, puedes proceder con la importación.

---

## 📝 Nota Importante

- **URL Pública (`gondola.proxy.rlwy.net:18127`)**: Usa esta para conectarte desde tu máquina local
- **URL Interna (`mysql.railway.internal:3306`)**: Solo funciona desde otros servicios dentro de Railway (como el backend)

