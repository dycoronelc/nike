import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout, Dashboard, Chatbot } from './components'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'chatbot'>('dashboard')

  return (
    <ThemeProvider>
      <Layout activeView={activeView} setActiveView={setActiveView}>
        {activeView === 'dashboard' ? <Dashboard /> : <Chatbot onClose={() => setActiveView('dashboard')} />}
      </Layout>
    </ThemeProvider>
  )
}

export default App

