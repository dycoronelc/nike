import { useQuery } from '@tanstack/react-query'
import { fetchKPIs } from '../api'
import { KPICard } from './'
import Chatbot from './Chatbot'
import './DashboardComercial.css'

export default function DashboardComercial() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => fetchKPIs(),
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

      {/* Chatbot */}
      <div className="chatbot-section">        
        <div className="chatbot-wrapper">
          <Chatbot />
        </div>
      </div>
    </div>
  )
}

