import { useState, useEffect } from 'react'
import { X, Calendar, Tag, Building, FolderTree, Users, ShoppingBag, Package, Filter as FilterIcon } from 'lucide-react'
import { useFilters, FilterOptions } from '../contexts/FilterContext'
import './Filters.css'

interface FilterOptionsData {
  generos: string[]
  sucursales: string[]
  categorias: string[]
  cuentas: string[]
  canales: string[]
  siluetas: string[]
  fechaMin: string
  fechaMax: string
}

interface FiltersProps {
  isOpen: boolean
  onClose: () => void
}

export default function Filters({ isOpen, onClose }: FiltersProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useFilters()
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<FilterOptionsData>({
    generos: [],
    sucursales: [],
    categorias: [],
    cuentas: [],
    canales: [],
    siluetas: [],
    fechaMin: '',
    fechaMax: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
    }
  }, [isOpen])

  const fetchFilterOptions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/filter-options`)
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters({
      ...filters,
      [key]: value
    })
  }

  const handleMultiSelect = (key: keyof FilterOptions, value: string) => {
    const currentValues = (filters[key] as string[]) || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    handleFilterChange(key, newValues)
  }

  const handleApply = () => {
    onClose()
  }

  const handleClear = () => {
    clearFilters()
  }

  if (!isOpen) return null

  return (
    <div className="filters-overlay" onClick={onClose}>
      <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filters-header">
          <div className="filters-header-content">
            <FilterIcon size={24} />
            <h2>Filtros</h2>
          </div>
          <button className="filters-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="filters-content">
          {loading ? (
            <div className="filters-loading">Cargando opciones...</div>
          ) : (
            <>
              {/* Fechas */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <Calendar size={20} />
                  <h3>Rango de Fechas</h3>
                </div>
                <div className="filter-dates">
                  <div className="filter-date-input">
                    <label>Desde</label>
                    <input
                      type="date"
                      value={filters.fechaDesde || options.fechaMin}
                      min={options.fechaMin}
                      max={options.fechaMax}
                      onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                    />
                  </div>
                  <div className="filter-date-input">
                    <label>Hasta</label>
                    <input
                      type="date"
                      value={filters.fechaHasta || options.fechaMax}
                      min={options.fechaMin || filters.fechaDesde}
                      max={options.fechaMax}
                      onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Géneros */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <Tag size={20} />
                  <h3>Géneros</h3>
                </div>
                <div className="filter-multiselect">
                  {options.generos.map(genero => (
                    <label key={genero} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.generos || []).includes(genero)}
                        onChange={() => handleMultiSelect('generos', genero)}
                      />
                      <span>{genero}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sucursales */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <Building size={20} />
                  <h3>Sucursales</h3>
                </div>
                <div className="filter-multiselect scrollable">
                  {options.sucursales.map(sucursal => (
                    <label key={sucursal} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.sucursales || []).includes(sucursal)}
                        onChange={() => handleMultiSelect('sucursales', sucursal)}
                      />
                      <span>{sucursal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <FolderTree size={20} />
                  <h3>Categorías</h3>
                </div>
                <div className="filter-multiselect scrollable">
                  {options.categorias.map(categoria => (
                    <label key={categoria} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.categorias || []).includes(categoria)}
                        onChange={() => handleMultiSelect('categorias', categoria)}
                      />
                      <span>{categoria}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cuentas */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <Users size={20} />
                  <h3>Cuentas</h3>
                </div>
                <div className="filter-multiselect scrollable">
                  {options.cuentas.map(cuenta => (
                    <label key={cuenta} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.cuentas || []).includes(cuenta)}
                        onChange={() => handleMultiSelect('cuentas', cuenta)}
                      />
                      <span>{cuenta}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Canales */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <ShoppingBag size={20} />
                  <h3>Canales</h3>
                </div>
                <div className="filter-multiselect scrollable">
                  {options.canales.map(canal => (
                    <label key={canal} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.canales || []).includes(canal)}
                        onChange={() => handleMultiSelect('canales', canal)}
                      />
                      <span>{canal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Siluetas */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <Package size={20} />
                  <h3>Productos (Siluetas)</h3>
                </div>
                <div className="filter-multiselect scrollable">
                  {options.siluetas.map(silueta => (
                    <label key={silueta} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.siluetas || []).includes(silueta)}
                        onChange={() => handleMultiSelect('siluetas', silueta)}
                      />
                      <span>{silueta}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="filters-footer">
          <button className="filter-button clear" onClick={handleClear} disabled={!hasActiveFilters}>
            Limpiar Filtros
          </button>
          <button className="filter-button apply" onClick={handleApply}>
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}

