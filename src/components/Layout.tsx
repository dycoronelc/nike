import { ReactNode, useState } from 'react'
import { MessageCircle, Sun, Moon, Filter, LogOut } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useFilters } from '../contexts/FilterContext'
import { useAuth } from '../contexts/AuthContext'
import Filters from './Filters'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  activeView: 'dashboard' | 'chatbot'
  setActiveView: (view: 'dashboard' | 'chatbot') => void
  isComercial?: boolean
}

export default function Layout({ children, activeView, setActiveView, isComercial = false }: LayoutProps) {
  const { theme, toggleTheme } = useTheme()
  const { hasActiveFilters } = useFilters()
  const { user, logout } = useAuth()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleDashboardClick = () => {
    setActiveView('dashboard')
    toggleTheme()
  }

  const handleLogout = () => {
    logout()
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
            {!isComercial && activeView === 'dashboard' && (
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
            {!isComercial && (
              <button
                className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={handleDashboardClick}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span>Dashboard</span>
              </button>
            )}
            {!isComercial && (
              <button
                className={`nav-button ${activeView === 'chatbot' ? 'active' : ''}`}
                onClick={() => setActiveView('chatbot')}
              >
                <MessageCircle size={20} />
                <span>Asistente IA</span>
              </button>
            )}
            <div className="user-info">
              <span className="user-role">{user?.role === 'analista' ? 'Analista' : 'Comercial'}</span>
              <button
                className="nav-button logout-button"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <LogOut size={20} />
                <span>Salir</span>
              </button>
            </div>
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

