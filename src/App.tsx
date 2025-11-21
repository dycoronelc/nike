import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { FilterProvider } from './contexts/FilterContext'
import { Layout, Dashboard, Chatbot } from './components'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'chatbot'>('dashboard')

  return (
    <ThemeProvider>
      <FilterProvider>
        <Layout activeView={activeView} setActiveView={setActiveView}>
          {activeView === 'dashboard' ? <Dashboard /> : <Chatbot onClose={() => setActiveView('dashboard')} />}
        </Layout>
      </FilterProvider>
    </ThemeProvider>
  )
}

export default App

