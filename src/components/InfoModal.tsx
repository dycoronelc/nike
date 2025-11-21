import { X, Info } from 'lucide-react'
import './InfoModal.css'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  meaning: string
  calculation: string
}

export default function InfoModal({ isOpen, onClose, title, description, meaning, calculation }: InfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <div className="info-modal-header-content">
            <Info size={24} />
            <h2>{title}</h2>
          </div>
          <button className="info-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="info-modal-content">
          <div className="info-section">
            <h3>Descripción</h3>
            <p>{description}</p>
          </div>

          <div className="info-section">
            <h3>¿Qué significa?</h3>
            <p>{meaning}</p>
          </div>

          <div className="info-section">
            <h3>¿Cómo se calcula?</h3>
            <p>{calculation}</p>
          </div>
        </div>

        <div className="info-modal-footer">
          <button className="info-modal-button" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

