import { createContext, useContext, useState, ReactNode } from 'react'

export interface FilterOptions {
  fechaDesde?: string
  fechaHasta?: string
  generos?: string[]
  sucursales?: string[]
  categorias?: string[]
  cuentas?: string[]
  canales?: string[]
  siluetas?: string[]
}

interface FilterContextType {
  filters: FilterOptions
  setFilters: (filters: FilterOptions) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterOptions>({})

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0 && (
    (filters.fechaDesde && filters.fechaDesde !== '') ||
    (filters.fechaHasta && filters.fechaHasta !== '') ||
    (filters.generos && filters.generos.length > 0) ||
    (filters.sucursales && filters.sucursales.length > 0) ||
    (filters.categorias && filters.categorias.length > 0) ||
    (filters.cuentas && filters.cuentas.length > 0) ||
    (filters.canales && filters.canales.length > 0) ||
    (filters.siluetas && filters.siluetas.length > 0)
  )

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        clearFilters,
        hasActiveFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

