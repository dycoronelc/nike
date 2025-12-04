import { useQuery } from '@tanstack/react-query'
import { fetchKPIs, fetchTopProductos, fetchTopSucursales } from '../api'
import { KPICard } from './'
import Chatbot from './Chatbot'
import './DashboardComercial.css'

interface TopItem {
  nombre: string
  ventas: number
  cantidad: number
}

export default function DashboardComercial() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => fetchKPIs(),
  })

  const { data: topProductos, isLoading: productosLoading } = useQuery<TopItem[]>({
    queryKey: ['topProductos'],
    queryFn: () => fetchTopProductos(3),
  })

  const { data: topSucursales, isLoading: sucursalesLoading } = useQuery<TopItem[]>({
    queryKey: ['topSucursales'],
    queryFn: () => fetchTopSucursales(3),
  })

  if (kpisLoading) {
    return (
      <div className="dashboard-comercial">
        <div className="loading">Cargando datos...</div>
      </div>
    )
  }

  const sellInTotal = kpis?.sellIn?.totalVentas || 0
  const sellOutTotal = kpis?.sellOut?.totalVentas || 0
  const ticketSellIn = kpis?.sellIn?.promedioTicket || 0
  const ticketSellOut = kpis?.sellOut?.promedioTicket || 0

  return (
    <div className="dashboard-comercial">
      <div className="comercial-header">
        <h1>Dashboard Comercial</h1>
        <p>Vista ejecutiva de ventas y rendimiento</p>
      </div>

      {/* KPIs */}
      <div className="kpis-grid">
        <KPICard
          title="Sell In Total"
          value={sellInTotal}
          format="currency"
        />
        <KPICard
          title="Sell Out Total"
          value={sellOutTotal}
          format="currency"
        />
        <KPICard
          title="Promedio Ticket Sell In"
          value={ticketSellIn}
          format="currency"
        />
        <KPICard
          title="Promedio Ticket Sell Out"
          value={ticketSellOut}
          format="currency"
        />
      </div>

      {/* Top Productos y Sucursales */}
      <div className="top-lists-container">
        <div className="top-list-card">
          <h2>Top 3 Productos Más Vendidos</h2>
          {productosLoading ? (
            <div className="loading-small">Cargando...</div>
          ) : topProductos && Array.isArray(topProductos) && topProductos.length > 0 ? (
            <div className="top-list">
              {topProductos.slice(0, 3).map((producto: TopItem, index: number) => (
                <div key={index} className="top-item">
                  <div className="top-item-rank">{index + 1}</div>
                  <div className="top-item-content">
                    <div className="top-item-name">{producto.nombre}</div>
                    <div className="top-item-value">
                      ${producto.ventas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No hay datos disponibles</div>
          )}
        </div>

        <div className="top-list-card">
          <h2>Top 3 Sucursales que Más Venden</h2>
          {sucursalesLoading ? (
            <div className="loading-small">Cargando...</div>
          ) : topSucursales && Array.isArray(topSucursales) && topSucursales.length > 0 ? (
            <div className="top-list">
              {topSucursales.slice(0, 3).map((sucursal: TopItem, index: number) => (
                <div key={index} className="top-item">
                  <div className="top-item-rank">{index + 1}</div>
                  <div className="top-item-content">
                    <div className="top-item-name">{sucursal.nombre}</div>
                    <div className="top-item-value">
                      ${sucursal.ventas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No hay datos disponibles</div>
          )}
        </div>
      </div>

      {/* Chatbot */}
      <div className="chatbot-section">
        <div className="chatbot-header-section">
          <h2>Asistente de IA</h2>
          <p>Pregunta directamente qué información quisieras visualizar</p>
        </div>
        <div className="chatbot-wrapper">
          <Chatbot />
        </div>
      </div>
    </div>
  )
}

