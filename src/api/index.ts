import axios from 'axios'
import { FilterOptions } from '../contexts/FilterContext'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fetchKPIs = async (filters?: FilterOptions) => {
  const params = filters ? { filters: JSON.stringify(filters) } : {}
  const response = await api.get('/kpis', { params })
  return response.data
}

export const fetchTimeSeries = async (filters?: FilterOptions) => {
  const params = filters ? { filters: JSON.stringify(filters) } : {}
  const response = await api.get('/time-series', { params })
  return response.data
}

export const fetchPredictions = async () => {
  const response = await api.get('/predictions')
  return response.data
}

export const fetchClusters = async () => {
  const response = await api.get('/clusters')
  return response.data
}

export const fetchProductClusters = async () => {
  const response = await api.get('/clusters/productos')
  return response.data
}

export const fetchSucursalClusters = async () => {
  const response = await api.get('/clusters/sucursales')
  return response.data
}

export const sendChatMessage = async (message: string) => {
  const response = await api.post('/chat', { message })
  return response.data
}

export const fetchSellIn = async (limit = 1000, offset = 0) => {
  const response = await api.get('/sell-in', { params: { limit, offset } })
  return response.data
}

export const fetchSellOut = async (limit = 1000, offset = 0) => {
  const response = await api.get('/sell-out', { params: { limit, offset } })
  return response.data
}

export const fetchInventario = async (limit = 1000, offset = 0) => {
  const response = await api.get('/inventario', { params: { limit, offset } })
  return response.data
}

export const fetchInventoryOptimization = async () => {
  const response = await api.get('/inventory-optimization')
  return response.data
}

