import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  forceTheme?: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Leer tema guardado o usar dark por defecto
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    return savedTheme || 'dark'
  })

  // Verificar si el usuario es comercial y forzar tema claro
  useEffect(() => {
    const savedUser = localStorage.getItem('nike_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.role === 'comercial') {
          setTheme('light')
        }
      } catch {
        // Ignorar error de parsing
      }
    }
  }, [])

  // Aplicar tema al documento
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    }
    // Solo guardar en localStorage si no es comercial (para no sobrescribir)
    const savedUser = localStorage.getItem('nike_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.role !== 'comercial') {
          localStorage.setItem('theme', theme)
        }
      } catch {
        localStorage.setItem('theme', theme)
      }
    } else {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // Escuchar cambios en el usuario para forzar tema claro si es comercial
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('nike_user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          if (user.role === 'comercial') {
            setTheme('light')
          }
        } catch {
          // Ignorar error de parsing
        }
      }
    }

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // También verificar periódicamente (por si el cambio es en la misma pestaña)
    const interval = setInterval(() => {
      handleStorageChange()
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const toggleTheme = () => {
    // Si es comercial, no permitir cambiar el tema
    const savedUser = localStorage.getItem('nike_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.role === 'comercial') {
          return // No hacer nada, mantener tema claro
        }
      } catch {
        // Continuar con el toggle normal
      }
    }
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const forceTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, forceTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

