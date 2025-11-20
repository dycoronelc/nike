import { useQuery } from '@tanstack/react-query'
import { KPICard, TimeSeriesChart, PredictionChart, ClusterChart } from './'
import { fetchKPIs, fetchTimeSeries, fetchPredictions, fetchClusters } from '../api'
import './Dashboard.css'

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: fetchKPIs,
  })

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['timeSeries'],
    queryFn: fetchTimeSeries,
  })

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: fetchPredictions,
  })

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['clusters'],
    queryFn: fetchClusters,
  })

  if (kpisLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Análisis de Ventas e Inventario</h2>
        <p>KPIs descriptivos, predictivos y análisis de clustering</p>
      </div>

      {/* KPIs Descriptivos */}
      <section className="section">
        <h3 className="section-title">Indicadores Descriptivos</h3>
        <div className="kpis-grid">
          <KPICard
            title="Sell In - Total Ventas"
            value={kpis?.sellIn?.totalVentas}
            format="currency"
            subtitle={`${kpis?.sellIn?.totalUnidades?.toLocaleString()} unidades`}
            color="info"
          />
          <KPICard
            title="Sell Out - Total Ventas"
            value={kpis?.sellOut?.totalVentas}
            format="currency"
            subtitle={`${kpis?.sellOut?.totalUnidades?.toLocaleString()} unidades`}
            color="success"
          />
          <KPICard
            title="Inventario Total"
            value={kpis?.inventario?.totalExistencia}
            format="number"
            subtitle={`${kpis?.inventario?.sucursales} sucursales`}
            color="warning"
          />
          <KPICard
            title="Ratio Sell Out/Sell In"
            value={kpis?.general?.ratioSellOutSellIn}
            format="percentage"
            subtitle={`${kpis?.general?.productosUnicos} productos únicos`}
            color="info"
          />
          <KPICard
            title="Promedio Ticket Sell In"
            value={kpis?.sellIn?.promedioTicket}
            format="currency"
            subtitle="Ticket promedio"
            color="info"
          />
          <KPICard
            title="Promedio Ticket Sell Out"
            value={kpis?.sellOut?.promedioTicket}
            format="currency"
            subtitle="Ticket promedio"
            color="success"
          />
          <KPICard
            title="Total Registros"
            value={kpis?.general?.totalRegistros}
            format="number"
            subtitle={`${kpis?.general?.totalUnidades?.toLocaleString()} unidades totales`}
            color="warning"
          />
          <KPICard
            title="Promedio Mensual Ventas"
            value={kpis?.general?.promedioMensual}
            format="currency"
            subtitle={`${kpis?.general?.sucursalesSellOut} sucursales Sell Out`}
            color="info"
          />
        </div>
      </section>

      {/* Gráficos Temporales */}
      <section className="section">
        <h3 className="section-title">Evolución Temporal</h3>
        {timeSeriesLoading ? (
          <div className="chart-loading">Cargando gráfico...</div>
        ) : (
          <TimeSeriesChart data={timeSeries || []} />
        )}
      </section>

      {/* Predicciones */}
      <section className="section">
        <h3 className="section-title">Indicadores Predictivos</h3>
        {predictionsLoading ? (
          <div className="chart-loading">Calculando predicciones...</div>
        ) : (
          predictions && <PredictionChart data={predictions} />
        )}
      </section>

      {/* Clustering */}
      <section className="section">
        <h3 className="section-title">Análisis de Clustering</h3>
        {clustersLoading ? (
          <div className="chart-loading">Calculando clusters...</div>
        ) : (
          clusters && <ClusterChart data={clusters} />
        )}
      </section>
    </div>
  )
}

