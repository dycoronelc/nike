import { Bot, User } from 'lucide-react'
import TimeSeriesChart from './TimeSeriesChart'
import PredictionChart from './PredictionChart'
import ClusterChart from './ClusterChart'
import DataTable from './DataTable'
import './ChatMessage.css'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  data?: any
  graphType?: string
  config?: any
}

export default function ChatMessage({ role, content, data, graphType, config }: ChatMessageProps) {
  const renderGraph = () => {
    if (!data || !graphType) return null

    switch (graphType) {
      case 'line':
        return <TimeSeriesChart data={data} />
      case 'prediction':
        return <PredictionChart data={data} />
      case 'cluster':
        return <ClusterChart data={data} />
      case 'bar':
        return <DataTable data={data} config={config} />
      default:
        return null
    }
  }

  return (
    <div className={`message message-${role}`}>
      <div className="message-avatar">
        {role === 'user' ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="message-content">
        <div className="message-text">{content.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}</div>
        {renderGraph() && <div className="message-graph">{renderGraph()}</div>}
      </div>
    </div>
  )
}

