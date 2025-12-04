import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { login as loginAPI } from '../api'
import { LogIn, User, Lock } from 'lucide-react'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await loginAPI(username, password)
      
      if (response.success && response.user) {
        // Login exitoso, actualizar el contexto de autenticación
        login(response.user.username, password, response.user.role as 'analista' | 'comercial')
      } else {
        setError('Credenciales inválidas')
      }
    } catch (err: any) {
      console.error('Error en login:', err)
      setError(err.response?.data?.error || 'Error al iniciar sesión. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">✓</div>
            <div className="logo-text">
              <h1>Northbay International</h1>
              <p>Dashboard de Ventas e Inventario</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <User size={18} />
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            <LogIn size={20} />
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Ingresa tus credenciales para acceder al dashboard</p>
          <p>Usuario analista: analista / password123 </p>
          <p>Usuario comercial: comercial / password123</p>
        </div>
      </div>
    </div>
  )
}

