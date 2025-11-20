import { useState, useRef, useEffect } from 'react'
import { Send, Bot, X } from 'lucide-react'
import { sendChatMessage } from '../api'
import { ChatMessage } from './'
import './Chatbot.css'

interface ChatbotProps {
  onClose?: () => void
}

export default function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; data?: any; graphType?: string; config?: any }>>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA para análisis de datos. Puedo ayudarte con:\n\n• Consultas sobre ventas totales\n• Evolución y tendencias temporales\n• Predicciones de ventas futuras\n• Análisis de clusters y patrones\n• Estado de inventario\n• Análisis por sucursal o producto\n\n¿Qué te gustaría saber?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await sendChatMessage(userMessage)
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.texto,
          data: response.grafico?.datos,
          graphType: response.grafico?.tipo,
          config: response.grafico?.config,
        },
      ])
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <div>
            <h2>Asistente de IA</h2>
            <p>Haz preguntas sobre tus datos y recibe respuestas con análisis y gráficos</p>
          </div>
          {onClose && (
            <button className="chatbot-close-button" onClick={onClose} title="Cerrar asistente">
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
            data={message.data}
            graphType={message.graphType}
            config={message.config}
          />
        ))}
        {isLoading && (
          <div className="message message-assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu pregunta aquí..."
          rows={1}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

