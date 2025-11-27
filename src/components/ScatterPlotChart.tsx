import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts'
import { Info } from 'lucide-react'
import './ScatterPlotChart.css'

interface ScatterDataPoint {
  nombre_sucursal: string
  canal: string
  ventas_sell_in: number
  ventas_sell_out: number
  unidades_sell_in: number
  unidades_sell_out: number
  dias_sell_in: number
  dias_sell_out: number
  ratio: number
}

interface ScatterPlotChartProps {
  data: ScatterDataPoint[]
  onInfoClick?: () => void
}

export default function ScatterPlotChart({ data, onInfoClick }: ScatterPlotChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="scatter-plot-chart">
        <div className="chart-loading">No hay datos disponibles para el gráfico de dispersión</div>
      </div>
    )
  }

  // Preparar datos para el gráfico
  const chartData = data.map(point => ({
    x: point.ventas_sell_in,
    y: point.ventas_sell_out,
    nombre: point.nombre_sucursal,
    canal: point.canal,
    ratio: point.ratio,
    unidades_in: point.unidades_sell_in,
    unidades_out: point.unidades_sell_out
  }))

  // Función para determinar el color según el ratio
  const getColor = (ratio: number) => {
    if (ratio >= 100) return '#10b981' // Verde: venden más de lo comprado (excelente)
    if (ratio >= 80) return '#3b82f6' // Azul: buen balance
    if (ratio >= 50) return '#f59e0b' // Amarillo: balance medio
    return '#ef4444' // Rojo: bajo balance (stock acumulado)
  }

  // Calcular línea de referencia (diagonal perfecta: Sell Out = Sell In)
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.x, d.y)),
    ...chartData.map(d => Math.max(d.x, d.y))
  )

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="scatter-tooltip">
          <p className="tooltip-title"><strong>{data.nombre}</strong></p>
          <p className="tooltip-item">Canal: {data.canal}</p>
          <p className="tooltip-item">Sell In: ${data.x.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
          <p className="tooltip-item">Sell Out: ${data.y.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
          <p className="tooltip-item">Ratio: {data.ratio.toFixed(1)}%</p>
          {data.ratio >= 100 && (
            <p className="tooltip-note">✅ Excelente: Venden más de lo comprado</p>
          )}
          {data.ratio < 50 && (
            <p className="tooltip-note">⚠️ Atención: Stock acumulado</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="scatter-plot-chart">
      <div className="chart-header">
        <div className="chart-header-content">
          <div>
            <h4>Análisis de Balance: Sell In vs Sell Out</h4>
            <p className="chart-subtitle">
              Relación entre ventas a distribuidores (Sell In) y ventas de distribuidores (Sell Out) por sucursal
            </p>
          </div>
          {onInfoClick && (
            <button 
              className="chart-info-button" 
              onClick={onInfoClick} 
              title="Ver información"
            >
              <Info size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="scatter-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span>Ratio ≥ 100% (Excelente)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span>Ratio 80-100% (Bueno)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Ratio 50-80% (Medio)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Ratio &lt; 50% (Atención)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="x"
            name="Sell In"
            label={{ value: 'Ventas Sell In ($)', position: 'insideBottom', offset: -5 }}
            stroke="#a0a0a0"
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Sell Out"
            label={{ value: 'Ventas Sell Out ($)', angle: -90, position: 'insideLeft' }}
            stroke="#a0a0a0"
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={maxValue} 
            stroke="#666" 
            strokeDasharray="5 5" 
            label={{ value: 'Línea de balance (Sell Out = Sell In)', position: 'topRight' }}
          />
          <ReferenceLine 
            segment={[{ x: 0, y: 0 }, { x: maxValue, y: maxValue }]}
            stroke="#666" 
            strokeDasharray="5 5"
            label={{ value: 'Balance ideal', position: 'topRight' }}
          />
          <Scatter name="Sucursales" data={chartData} fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.ratio)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="scatter-insights">
        <h5>Interpretación:</h5>
        <ul>
          <li><strong>Arriba de la línea diagonal:</strong> Los distribuidores venden más de lo que compraron (usan stock previo o compran de otras fuentes)</li>
          <li><strong>En la línea diagonal:</strong> Balance ideal - venden exactamente lo que compraron</li>
          <li><strong>Abajo de la línea diagonal:</strong> Los distribuidores tienen stock acumulado sin vender</li>
        </ul>
      </div>
    </div>
  )
}

