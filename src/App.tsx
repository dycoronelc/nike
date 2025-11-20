import { useState } from 'react'
import { Layout, Dashboard, Chatbot } from './components'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'chatbot'>('dashboard')

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'dashboard' ? <Dashboard /> : <Chatbot onClose={() => setActiveView('dashboard')} />}
    </Layout>
  )
}

export default App

