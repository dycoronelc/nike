import { ReactNode, useState } from 'react'
import { MessageCircle, Sun, Moon, Filter } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useFilters } from '../contexts/FilterContext'
import Filters from './Filters'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  activeView: 'dashboard' | 'chatbot'
  setActiveView: (view: 'dashboard' | 'chatbot') => void
}

export default function Layout({ children, activeView, setActiveView }: LayoutProps) {
  const { theme, toggleTheme } = useTheme()
  const { hasActiveFilters } = useFilters()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleDashboardClick = () => {
    setActiveView('dashboard')
    toggleTheme()
  }

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
            {activeView === 'dashboard' && (
              <button
                className={`nav-button filters-button ${hasActiveFilters ? 'has-filters' : ''}`}
                onClick={() => setFiltersOpen(true)}
                title="Filtros"
              >
                <Filter size={20} />
                <span>Filtros</span>
                {hasActiveFilters && <span className="filter-badge">•</span>}
              </button>
            )}
            <button
              className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={handleDashboardClick}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
      <Filters isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  )
}

