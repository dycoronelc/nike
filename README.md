# Nike Dashboard PWA - Northbay International Inc.

Aplicación web tipo PWA (Progressive Web App) para análisis de ventas e inventario de Nike, desarrollada para Northbay International Inc.

## Características

### 🎯 Indicadores Descriptivos
- **Sell In**: Ventas a clientes (total, unidades, ticket promedio)
- **Sell Out**: Ventas de clientes a usuarios finales
- **Inventario**: Estado de stock y sucursales
- **Ratios**: Métricas comparativas y KPIs generales

### 🔮 Indicadores Predictivos
- Modelos de Machine Learning para predecir ventas futuras
- Intervalos de confianza
- Métricas de evaluación del modelo (R²)

### 📊 Análisis de Clustering
- Segmentación automática de períodos por patrones
- Identificación de clusters (Alto Stock, Alta Demanda, Picos de Ventas, etc.)
- Visualización de distribuciones

### 🤖 Chatbot Agente con IA
- Respuestas inteligentes a preguntas sobre los datos
- Generación automática de gráficos y reportes
- Análisis de consultas en lenguaje natural

## Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **Recharts** para visualizaciones
- **React Query** para manejo de estado y caché
- **PWA** con service workers y offline support

### Backend
- **Node.js** con Express
- **MySQL** para almacenamiento de datos
- **mysql2** para conexión a base de datos
- **ML-Matrix** y **Simple Statistics** para algoritmos de ML (JavaScript puro, sin dependencias nativas)
- **XLSX** para procesamiento de archivos Excel
- Análisis de datos y modelos predictivos

## Instalación

### Requisitos
- Node.js 18+ y npm
- MySQL 8.0+ instalado y ejecutándose

### Pasos

1. **Instalar dependencias del frontend y backend:**
```bash
npm run install:all
```

2. **Configurar Base de Datos MySQL:**
   - Asegúrate de tener MySQL instalado y ejecutándose
   - Crea un archivo `.env` en la raíz del proyecto (o copia `.env.example`):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=nike_dashboard
   ```

3. **Inicializar Base de Datos:**
   - El script leerá el archivo Excel y cargará los datos en MySQL
   ```bash
   cd server
   npm run init-db
   ```
   O directamente:
   ```bash
   node database/init.js
   ```

4. **Iniciar servidor de desarrollo (frontend + backend):**
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000` y el backend en `http://localhost:5000`.

### Estructura de Datos

**Importante:** Los datos ahora se almacenan en MySQL, no se leen directamente del Excel en tiempo de ejecución.

La aplicación espera un archivo Excel (`MUESTRA DE DATA CENTURY.xlsx`) en la raíz del proyecto con tres hojas:
- **Sell In**: Datos de ventas a clientes
- **Sell Out**: Datos de ventas a usuarios finales
- **Inventario**: Datos de inventario

Este archivo se usa solo para la carga inicial de datos. Una vez importado a MySQL, todos los datos se leen desde la base de datos.

Para más información sobre la base de datos, consulta `database/README.md`.

## Uso

### Dashboard
- Visualiza KPIs descriptivos en tiempo real
- Revisa evoluciones temporales de ventas
- Explora predicciones y análisis de clustering

### Chatbot
- Haz preguntas en lenguaje natural sobre los datos
- Ejemplos:
  - "¿Cuáles son las ventas totales?"
  - "Muéstrame la evolución de ventas"
  - "¿Qué predicciones tienes para el futuro?"
  - "Analiza las sucursales"
  - "Muéstrame los productos más vendidos"

## Scripts Disponibles

- `npm run dev`: Inicia frontend y backend en modo desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción

## Arquitectura

```
nike-dashboard-pwa/
├── src/                    # Código fuente del frontend
│   ├── components/         # Componentes React
│   ├── api/               # Cliente API
│   └── App.tsx            # Componente principal
├── server/                # Backend Node.js
│   ├── index.js          # Servidor Express
│   ├── data-processor.js # Procesamiento de datos
│   └── ml-service.js     # Servicios de ML
└── MUESTRA DE DATA...xlsx # Datos de prueba
```

## Licencia

Desarrollado para Northbay International Inc.

