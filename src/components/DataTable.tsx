import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './DataTable.css'

interface DataTableProps {
  data: Array<{ nombre: string; ventas: number; cantidad?: number }>
  config?: {
    x?: string
    y?: string
    titulo?: string
  }
}

export default function DataTable({ data, config }: DataTableProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map(item => ({
    nombre: item.nombre.length > 20 ? item.nombre.substring(0, 20) + '...' : item.nombre,
    [config?.y || 'ventas']: item[config?.y as keyof typeof item] || item.ventas,
    nombreCompleto: item.nombre,
  }))

  return (
    <div className="data-table-chart">
      {config?.titulo && <h5>{config.titulo}</h5>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="nombre"
            stroke="#a0a0a0"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="#a0a0a0" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: number) => {
              if (config?.y === 'ventas' || !config?.y) {
                return `$${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`
              }
              return value.toLocaleString('es-CO')
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]?.payload?.nombreCompleto) {
                return payload[0].payload.nombreCompleto
              }
              return label
            }}
          />
          <Legend />
          <Bar
            dataKey={config?.y || 'ventas'}
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

