import { useQuery } from '@tanstack/react-query'
import { fetchInventoryOptimization } from '../api'
import { Info } from 'lucide-react'
import './InventoryOptimization.css'

interface InventoryOptimizationProps {
  onInfoClick?: (section: string) => void
}

export default function InventoryOptimization({ onInfoClick }: InventoryOptimizationProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventoryOptimization'],
    queryFn: fetchInventoryOptimization,
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="inventory-optimization">
        <div className="loading">Cargando métricas de optimización...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-optimization">
        <div className="error">Error al cargar métricas de optimización</div>
      </div>
    )
  }

  if (!data) return null

  const { diasInventarioDisponible, analisisABC, tiempoReposicion, indiceCoberturaInventario } = data

  // Filtrar productos con días de inventario disponibles (excluir -1 que significa sin datos)
  const productosConDias = diasInventarioDisponible?.filter(p => p.dias_inventario_disponible > 0) || []
  const productosBajoStock = productosConDias.filter(p => p.dias_inventario_disponible < 30)
  const productosSobreStock = productosConDias.filter(p => p.dias_inventario_disponible > 90)

  // Productos con cobertura insuficiente
  const productosInsuficientes = indiceCoberturaInventario?.filter(p => p.estado === 'insuficiente') || []

  return (
    <div className="inventory-optimization">
      <div className="optimization-header">
        <h3>Optimización de Inventario</h3>
        <p className="optimization-subtitle">Métricas basadas en comparación estacional (mismo período año anterior)</p>
      </div>

      <div className="optimization-grid">
        {/* Días de Inventario Disponible */}
        <div className="optimization-card">
          <div className="card-header">
            <h4>Días de Inventario Disponible</h4>
            {onInfoClick && (
              <button 
                className="chart-info-button" 
                onClick={() => onInfoClick('diasInventario')}
                title="Ver información"
              >
                <Info size={18} />
              </button>
            )}
          </div>
          <div className="card-content">
            <div className="metric-summary">
              <div className="metric-item">
                <span className="metric-label">Productos analizados:</span>
                <span className="metric-value">{productosConDias.length}</span>
              </div>
              <div className="metric-item warning">
                <span className="metric-label">Bajo stock (&lt;30 días):</span>
                <span className="metric-value">{productosBajoStock.length}</span>
              </div>
              <div className="metric-item info">
                <span className="metric-label">Sobre stock (&gt;90 días):</span>
                <span className="metric-value">{productosSobreStock.length}</span>
              </div>
            </div>
            {productosBajoStock.length > 0 && (
              <div className="alert-list">
                <h5>⚠️ Productos que requieren reposición:</h5>
                <ul>
                  {productosBajoStock.slice(0, 5).map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.sucursal}</strong> - {p.categoria} ({p.genero}):{' '}
                      <span className="highlight">
                        {Math.round(p.dias_inventario_disponible)} días
                      </span>
                    </li>
                  ))}
                </ul>
                {productosBajoStock.length > 5 && (
                  <p className="more-items">+ {productosBajoStock.length - 5} productos más</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Análisis ABC */}
        <div className="optimization-card">
          <div className="card-header">
            <h4>Análisis ABC de Productos</h4>
            {onInfoClick && (
              <button 
                className="chart-info-button" 
                onClick={() => onInfoClick('analisisABC')}
                title="Ver información"
              >
                <Info size={18} />
              </button>
            )}
          </div>
          <div className="card-content">
            {analisisABC?.resumen && (
              <div className="abc-summary">
                <div className="abc-class class-a">
                  <h5>Clase A (Alta Prioridad)</h5>
                  <div className="abc-stats">
                    <span>{analisisABC.resumen.claseA.cantidad} productos</span>
                    <span>{analisisABC.resumen.claseA.porcentaje_ventas.toFixed(1)}% ventas</span>
                  </div>
                  <p className="abc-description">
                    {analisisABC.resumen.claseA.porcentaje_productos.toFixed(1)}% de productos generan{' '}
                    {analisisABC.resumen.claseA.porcentaje_ventas.toFixed(1)}% de las ventas
                  </p>
                </div>
                <div className="abc-class class-b">
                  <h5>Clase B (Media Prioridad)</h5>
                  <div className="abc-stats">
                    <span>{analisisABC.resumen.claseB.cantidad} productos</span>
                    <span>{analisisABC.resumen.claseB.porcentaje_ventas.toFixed(1)}% ventas</span>
                  </div>
                </div>
                <div className="abc-class class-c">
                  <h5>Clase C (Baja Prioridad)</h5>
                  <div className="abc-stats">
                    <span>{analisisABC.resumen.claseC.cantidad} productos</span>
                    <span>{analisisABC.resumen.claseC.porcentaje_ventas.toFixed(1)}% ventas</span>
                  </div>
                </div>
              </div>
            )}
            {analisisABC?.claseA && analisisABC.claseA.length > 0 && (
              <div className="top-products">
                <h5>Top 5 Productos Clase A:</h5>
                <ul>
                  {analisisABC.claseA.slice(0, 5).map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.silueta}</strong> - {p.categoria} ({p.genero}):{' '}
                      <span className="highlight">
                        ${p.ventas_totales.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Tiempo de Reposición */}
        <div className="optimization-card">
          <div className="card-header">
            <h4>Tiempo de Reposición (Lead Time)</h4>
            {onInfoClick && (
              <button 
                className="chart-info-button" 
                onClick={() => onInfoClick('tiempoReposicion')}
                title="Ver información"
              >
                <Info size={18} />
              </button>
            )}
          </div>
          <div className="card-content">
            {tiempoReposicion?.estadisticas && (
              <div className="metric-summary">
                <div className="metric-item">
                  <span className="metric-label">Promedio:</span>
                  <span className="metric-value">
                    {tiempoReposicion.estadisticas.promedio_lead_time} días
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Mínimo:</span>
                  <span className="metric-value">
                    {tiempoReposicion.estadisticas.minimo_lead_time} días
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Máximo:</span>
                  <span className="metric-value">
                    {tiempoReposicion.estadisticas.maximo_lead_time} días
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Registros analizados:</span>
                  <span className="metric-value">
                    {tiempoReposicion.estadisticas.total_registros}
                  </span>
                </div>
              </div>
            )}
            <p className="info-text">
              Tiempo estimado entre pedidos basado en frecuencia histórica de compras
            </p>
          </div>
        </div>

        {/* Índice de Cobertura */}
        <div className="optimization-card">
          <div className="card-header">
            <h4>Índice de Cobertura de Inventario</h4>
            {onInfoClick && (
              <button 
                className="chart-info-button" 
                onClick={() => onInfoClick('indiceCobertura')}
                title="Ver información"
              >
                <Info size={18} />
              </button>
            )}
          </div>
          <div className="card-content">
            <div className="metric-summary">
              <div className="metric-item">
                <span className="metric-label">Categorías analizadas:</span>
                <span className="metric-value">
                  {indiceCoberturaInventario?.length || 0}
                </span>
              </div>
              <div className="metric-item warning">
                <span className="metric-label">Cobertura insuficiente:</span>
                <span className="metric-value">{productosInsuficientes.length}</span>
              </div>
            </div>
            {productosInsuficientes.length > 0 && (
              <div className="alert-list">
                <h5>⚠️ Categorías con cobertura insuficiente:</h5>
                <ul>
                  {productosInsuficientes.slice(0, 5).map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.categoria}</strong> ({p.genero}):{' '}
                      <span className="highlight">
                        {p.indice_cobertura}% de cobertura
                      </span>
                      <br />
                      <small>
                        Inventario: {p.existencia_actual.toLocaleString('es-CO')} | 
                        Demanda esperada: {p.demanda_periodo_anterior.toLocaleString('es-CO')}
                      </small>
                    </li>
                  ))}
                </ul>
                {productosInsuficientes.length > 5 && (
                  <p className="more-items">+ {productosInsuficientes.length - 5} categorías más</p>
                )}
              </div>
            )}
            {indiceCoberturaInventario && indiceCoberturaInventario.length > 0 && (
              <p className="info-text">
                Comparación con período: {indiceCoberturaInventario[0]?.periodo_comparacion}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

