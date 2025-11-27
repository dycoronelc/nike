import { Info } from 'lucide-react'
import './ClusterCard.css'

interface ClusterCardProps {
  nombre: string
  cantidad: number
  promedioVentas?: number
  promedioTicket?: number
  promedioRotacion?: number
  promedioDiversidad?: number
  productos?: Array<{ silueta: string; ventas: number }>
  sucursales?: Array<{ nombre: string; canal: string; ventas: number }>
  onInfoClick?: () => void
}

export default function ClusterCard({
  nombre,
  cantidad,
  promedioVentas,
  promedioTicket,
  promedioRotacion,
  promedioDiversidad,
  productos,
  sucursales,
  onInfoClick
}: ClusterCardProps) {
  const items = productos || sucursales || []
  const itemType = productos ? 'productos' : 'sucursales'
  const itemLabel = productos ? 'Productos' : 'Sucursales'

  return (
    <div className="cluster-card-compact">
      <div className="cluster-card-header">
        <h4 className="cluster-card-title">{nombre}</h4>
        {onInfoClick && (
          <button className="cluster-info-button" onClick={onInfoClick} title="Ver información">
            <Info size={14} />
          </button>
        )}
      </div>
      
      <div className="cluster-card-value">{cantidad.toLocaleString('es-CO')}</div>
      <div className="cluster-card-subtitle">{itemLabel} en este cluster</div>

      <div className="cluster-card-metrics">
        {promedioVentas !== undefined && (
          <div className="cluster-metric">
            <span className="metric-label">Ventas Promedio</span>
            <span className="metric-value">${promedioVentas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        {promedioTicket !== undefined && (
          <div className="cluster-metric">
            <span className="metric-label">Ticket Promedio</span>
            <span className="metric-value">${promedioTicket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        {promedioRotacion !== undefined && (
          <div className="cluster-metric">
            <span className="metric-label">Rotación</span>
            <span className="metric-value">{promedioRotacion.toFixed(2)}</span>
          </div>
        )}
        {promedioDiversidad !== undefined && (
          <div className="cluster-metric">
            <span className="metric-label">Diversidad</span>
            <span className="metric-value">{Math.round(promedioDiversidad)} productos</span>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="cluster-top-items-compact">
          <div className="top-items-header">
            <strong>Top {itemLabel} ({items.length > 3 ? `mostrando 3 de ${items.length}` : items.length})</strong>
          </div>
          <ul className="top-items-list">
            {items.slice(0, 3).map((item: any, idx: number) => (
              <li key={idx} className="top-item">
                {productos ? (
                  <>
                    <span className="item-name">{item.silueta}</span>
                    <span className="item-value">${item.ventas?.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                  </>
                ) : (
                  <>
                    <span className="item-name">{item.nombre}</span>
                    <span className="item-channel">({item.canal})</span>
                    <span className="item-value">${item.ventas?.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
          {items.length > 3 && (
            <div className="more-items-compact">+ {items.length - 3} más</div>
          )}
        </div>
      )}
    </div>
  )
}

