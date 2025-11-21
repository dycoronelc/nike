import { Info } from 'lucide-react'
import './KPICard.css'

interface KPICardProps {
  title: string
  value: number | undefined
  format?: 'currency' | 'number' | 'percentage'
  subtitle?: string
  color?: 'info' | 'success' | 'warning' | 'danger'
  infoKey?: string
  onInfoClick?: (infoKey: string) => void
}

export default function KPICard({ title, value, format = 'number', subtitle, color = 'info', infoKey, onInfoClick }: KPICardProps) {
  const formatValue = (val: number | undefined) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A'

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`
      case 'percentage':
        return `${val.toFixed(2)}%`
      case 'number':
      default:
        return val.toLocaleString('es-CO')
    }
  }

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (infoKey && onInfoClick) {
      onInfoClick(infoKey)
    }
  }

  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-header">
        <h4 className="kpi-title">{title}</h4>
        {infoKey && (
          <button className="kpi-info-button" onClick={handleInfoClick} title="Ver información">
            <Info size={16} />
          </button>
        )}
      </div>
      <div className="kpi-value">{formatValue(value)}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  )
}

