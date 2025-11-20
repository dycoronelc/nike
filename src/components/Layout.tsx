import { ReactNode } from 'react'
import { Activity, MessageCircle } from 'lucide-react'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  activeView: 'dashboard' | 'chatbot'
  setActiveView: (view: 'dashboard' | 'chatbot') => void
}

export default function Layout({ children, activeView, setActiveView }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">✓</div>
            <div className="logo-text">
              <h1>Nike Dashboard</h1>
              <p>Northbay International Inc.</p>
            </div>
          </div>
          <nav className="nav">
            <button
              className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              <Activity size={20} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-button ${activeView === 'chatbot' ? 'active' : ''}`}
              onClick={() => setActiveView('chatbot')}
            >
              <MessageCircle size={20} />
              <span>Asistente IA</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="main">
        {children}
      </main>
    </div>
  )
}

