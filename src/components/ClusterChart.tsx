import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Info } from 'lucide-react'
import './ClusterChart.css'

interface ClusterChartProps {
  data: {
    clusters: Array<{
      fecha: string
      cluster: number
      sellIn: { ventas: number }
      sellOut: { ventas: number }
    }>
    caracteristicas: Array<{
      cluster: number
      nombre: string
      cantidad: number
      promedioVentasSellIn: number
      promedioVentasSellOut: number
      meses: string[]
    }>
    centroides: number[][]
    generoArreglado?: Array<{
      cluster: number
      nombre: string
      generos: Array<{
        genero: string
        ventas: number
        cantidad: number
      }>
    }>
  }
  onInfoClick?: () => void
}

export default function ClusterChart({ data, onInfoClick }: ClusterChartProps) {
  const clusterData = data.caracteristicas.map(c => ({
    nombre: c.nombre,
    cantidad: c.cantidad,
    'Promedio Sell In': c.promedioVentasSellIn,
    'Promedio Sell Out': c.promedioVentasSellOut,
  }))

  const scatterData = data.clusters.map(item => ({
    x: item.sellIn.ventas,
    y: item.sellOut.ventas,
    cluster: item.cluster,
    fecha: item.fecha,
  }))

  const clusterColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="cluster-chart">
      <div className="cluster-header">
        <div className="cluster-header-content">
          <div>
            <h4>Segmentación por Patrones</h4>
            <p>Se identificaron {data.caracteristicas.length} clusters distintos</p>
          </div>
          {onInfoClick && (
            <button className="chart-info-button" onClick={onInfoClick} title="Ver información">
              <Info size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="cluster-grid">
        <div className="chart-container">
          <h5>Ventas por Género Arreglado</h5>
          {data.generoArreglado && data.generoArreglado.length > 0 ? (
            (() => {
              // Agrupar todas las ventas por género (sumando todos los clusters)
              const generosAgrupados: { [key: string]: number } = {};
              data.generoArreglado.forEach(cluster => {
                cluster.generos.forEach(gen => {
                  if (!generosAgrupados[gen.genero]) {
                    generosAgrupados[gen.genero] = 0;
                  }
                  generosAgrupados[gen.genero] += gen.ventas;
                });
              });

              const generoChartData = Object.entries(generosAgrupados)
                .map(([genero, ventas]) => ({ genero, ventas }))
                .sort((a, b) => b.ventas - a.ventas);

              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={generoChartData} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="genero" 
                      stroke="#a0a0a0" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis stroke="#a0a0a0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Bar dataKey="ventas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clusterData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="nombre" stroke="#a0a0a0" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="Promedio Sell In" fill="#3b82f6" />
                <Bar dataKey="Promedio Sell Out" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-container">
          <h5>Distribución de Clusters (Sell In vs Sell Out)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number"
                dataKey="x"
                name="Sell In"
                stroke="#a0a0a0"
                label={{ value: 'Sell In (Ventas)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Sell Out"
                stroke="#a0a0a0"
                label={{ value: 'Sell Out (Ventas)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="Clusters" dataKey="y" fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <circle
                    key={index}
                    cx={entry.x}
                    cy={entry.y}
                    r={6}
                    fill={clusterColors[entry.cluster % clusterColors.length]}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="cluster-details">
        <h5>Detalles de Clusters</h5>
        <div className="cluster-list">
          {data.generoArreglado && data.generoArreglado.length > 0 ? (
            data.generoArreglado.map((cluster) => {
              const totalVentas = cluster.generos.reduce((sum, g) => sum + g.ventas, 0);
              const totalCantidad = cluster.generos.reduce((sum, g) => sum + g.cantidad, 0);
              return (
                <div key={cluster.cluster} className="cluster-item">
                  <div className="cluster-name">{cluster.nombre}</div>
                  <div className="cluster-stats">
                    <div className="stat">
                      <span className="stat-label">Géneros:</span>
                      <span className="stat-value">{cluster.generos.length}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Ventas:</span>
                      <span className="stat-value">
                        ${totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Unidades:</span>
                      <span className="stat-value">
                        {totalCantidad.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <div className="cluster-months">
                    {cluster.generos
                      .sort((a, b) => b.ventas - a.ventas)
                      .slice(0, 5)
                      .map((genero, idx) => (
                        <span key={idx} className="month-tag" title={`${genero.cantidad} unidades - $${genero.ventas.toLocaleString('es-CO')}`}>
                          {genero.genero}: ${genero.ventas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      ))}
                    {cluster.generos.length > 5 && (
                      <span className="month-tag">+{cluster.generos.length - 5} géneros más</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback a datos de características si no hay datos de género
            data.caracteristicas.map((cluster) => (
              <div key={cluster.cluster} className="cluster-item">
                <div className="cluster-name">{cluster.nombre}</div>
                <div className="cluster-stats">
                  <div className="stat">
                    <span className="stat-label">Meses:</span>
                    <span className="stat-value">{cluster.cantidad}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Prom. Sell In:</span>
                    <span className="stat-value">
                      ${cluster.promedioVentasSellIn.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Prom. Sell Out:</span>
                    <span className="stat-value">
                      ${cluster.promedioVentasSellOut.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="cluster-months">
                  {cluster.meses.slice(0, 5).map((mes, idx) => (
                    <span key={idx} className="month-tag">
                      {mes}
                    </span>
                  ))}
                  {cluster.meses.length > 5 && (
                    <span className="month-tag">+{cluster.meses.length - 5} más</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

