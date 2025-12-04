import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { FilterProvider } from './contexts/FilterContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout, Dashboard, DashboardComercial, Login } from './components'
import './App.css'

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [activeView, setActiveView] = useState<'dashboard' | 'chatbot'>('dashboard')

  if (!isAuthenticated) {
    return <Login />
  }

  // Si es comercial, mostrar dashboard comercial directamente
  if (user?.role === 'comercial') {
    return (
      <Layout activeView={activeView} setActiveView={setActiveView} isComercial={true}>
        <DashboardComercial />
      </Layout>
    )
  }

  // Si es analista, mostrar dashboard completo
  return (
    <Layout activeView={activeView} setActiveView={setActiveView} isComercial={false}>
      {activeView === 'dashboard' ? <Dashboard /> : null}
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <AppContent />
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

