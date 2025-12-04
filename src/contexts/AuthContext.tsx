import { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'analista' | 'comercial'

interface User {
  username: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, role: UserRole) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Siempre iniciar sin usuario para forzar login en cada sesión
  const [user, setUser] = useState<User | null>(null)

  const login = (username: string, password: string, role: UserRole): boolean => {
    // La autenticación se hace en el backend, aquí solo guardamos el usuario autenticado
    if (username && password && role) {
      const newUser: User = { username, role }
      setUser(newUser)
      localStorage.setItem('nike_user', JSON.stringify(newUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('nike_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

