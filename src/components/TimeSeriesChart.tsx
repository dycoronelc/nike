import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './TimeSeriesChart.css'

interface TimeSeriesChartProps {
  data: Array<{
    fecha: string
    sellIn: { ventas: number; unidades: number }
    sellOut: { ventas: number; cantidad: number }
  }>
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const chartData = data.map(item => ({
    fecha: item.fecha,
    'Sell In': item.sellIn.ventas,
    'Sell Out': item.sellOut.ventas,
  }))

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="fecha" stroke="#a0a0a0" />
          <YAxis stroke="#a0a0a0" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Sell In"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Sell Out"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

