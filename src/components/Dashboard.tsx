import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KPICard, TimeSeriesChart, PredictionChart, ClusterChart, InfoModal } from './'
import { fetchKPIs, fetchTimeSeries, fetchPredictions, fetchClusters } from '../api'
import { useFilters } from '../contexts/FilterContext'
import { indicatorsInfo } from '../data/indicatorsInfo'
import './Dashboard.css'

export default function Dashboard() {
  const { filters } = useFilters()
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; key: string }>({
    isOpen: false,
    key: ''
  })

  const handleInfoClick = (infoKey: string) => {
    setInfoModal({ isOpen: true, key: infoKey })
  }

  const handleCloseInfo = () => {
    setInfoModal({ isOpen: false, key: '' })
  }

  const getInfoData = (key: string) => {
    const info = indicatorsInfo[key]
    if (!info) return null
    
    let title = ''
    if (key === 'timeSeriesChart') {
      title = 'Gráfico de Evolución Temporal'
    } else if (key === 'predictionChart') {
      title = 'Gráfico de Predicciones'
    } else if (key === 'clusterChart') {
      title = 'Gráfico de Clustering'
    } else {
      // Para KPIs, crear título descriptivo
      const parts = key.split('-')
      if (parts[0] === 'sellIn' && parts[1] === 'totalVentas') {
        title = 'Sell In - Total Ventas'
      } else if (parts[0] === 'sellOut' && parts[1] === 'totalVentas') {
        title = 'Sell Out - Total Ventas'
      } else if (parts[0] === 'inventario' && parts[1] === 'totalExistencia') {
        title = 'Inventario Total'
      } else if (parts[0] === 'general' && parts[1] === 'ratioSellOutSellIn') {
        title = 'Ratio Sell Out/Sell In'
      } else if (parts[0] === 'sellIn' && parts[1] === 'promedioTicket') {
        title = 'Promedio Ticket Sell In'
      } else if (parts[0] === 'sellOut' && parts[1] === 'promedioTicket') {
        title = 'Promedio Ticket Sell Out'
      } else if (parts[0] === 'general' && parts[1] === 'totalRegistros') {
        title = 'Total Registros'
      } else if (parts[0] === 'general' && parts[1] === 'promedioMensual') {
        title = 'Promedio Mensual Ventas'
      } else {
        title = key.split('-').map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' - ')
      }
    }
    
    return {
      title,
      ...info
    }
  }

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', filters],
    queryFn: () => fetchKPIs(filters),
  })

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['timeSeries', filters],
    queryFn: () => fetchTimeSeries(filters),
  })

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictions', timeSeries],
    queryFn: fetchPredictions,
    enabled: !!timeSeries,
  })

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['clusters', timeSeries, kpis],
    queryFn: fetchClusters,
    enabled: !!timeSeries && !!kpis,
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
            infoKey="sellIn-totalVentas"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Sell Out - Total Ventas"
            value={kpis?.sellOut?.totalVentas}
            format="currency"
            subtitle={`${kpis?.sellOut?.totalUnidades?.toLocaleString()} unidades`}
            color="success"
            infoKey="sellOut-totalVentas"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Inventario Total"
            value={kpis?.inventario?.totalExistencia}
            format="number"
            subtitle={`${kpis?.inventario?.sucursales} sucursales`}
            color="warning"
            infoKey="inventario-totalExistencia"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Ratio Sell Out/Sell In"
            value={kpis?.general?.ratioSellOutSellIn}
            format="percentage"
            subtitle={`${kpis?.general?.productosUnicos} productos únicos`}
            color="info"
            infoKey="general-ratioSellOutSellIn"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Promedio Ticket Sell In"
            value={kpis?.sellIn?.promedioTicket}
            format="currency"
            subtitle="Ticket promedio"
            color="info"
            infoKey="sellIn-promedioTicket"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Promedio Ticket Sell Out"
            value={kpis?.sellOut?.promedioTicket}
            format="currency"
            subtitle="Ticket promedio"
            color="success"
            infoKey="sellOut-promedioTicket"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Total Registros"
            value={kpis?.general?.totalRegistros}
            format="number"
            subtitle={`${kpis?.general?.totalUnidades?.toLocaleString()} unidades totales`}
            color="warning"
            infoKey="general-totalRegistros"
            onInfoClick={handleInfoClick}
          />
          <KPICard
            title="Promedio Mensual Ventas"
            value={kpis?.general?.promedioMensual}
            format="currency"
            subtitle={`${kpis?.general?.sucursalesSellOut} sucursales Sell Out`}
            color="info"
            infoKey="general-promedioMensual"
            onInfoClick={handleInfoClick}
          />
        </div>
      </section>

      {/* Gráficos Temporales */}
      <section className="section">
        <h3 className="section-title">Evolución Temporal</h3>
        {timeSeriesLoading ? (
          <div className="chart-loading">Cargando gráfico...</div>
        ) : (
          <TimeSeriesChart data={timeSeries || []} onInfoClick={() => handleInfoClick('timeSeriesChart')} />
        )}
      </section>

      {/* Predicciones */}
      <section className="section">
        <h3 className="section-title">Indicadores Predictivos</h3>
        {predictionsLoading ? (
          <div className="chart-loading">Calculando predicciones...</div>
        ) : (
          predictions && <PredictionChart data={predictions} onInfoClick={() => handleInfoClick('predictionChart')} />
        )}
      </section>

      {/* Clustering */}
      <section className="section">
        <h3 className="section-title">Análisis de Clustering</h3>
        {clustersLoading ? (
          <div className="chart-loading">Calculando clusters...</div>
        ) : (
          clusters && <ClusterChart data={clusters} onInfoClick={() => handleInfoClick('clusterChart')} />
        )}
      </section>

      {/* Info Modal */}
      {infoModal.isOpen && (() => {
        const infoData = getInfoData(infoModal.key)
        if (!infoData) return null
        return (
          <InfoModal
            isOpen={infoModal.isOpen}
            onClose={handleCloseInfo}
            title={infoData.title}
            description={infoData.description}
            meaning={infoData.meaning}
            calculation={infoData.calculation}
          />
        )
      })()}
    </div>
  )
}

