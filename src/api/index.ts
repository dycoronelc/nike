import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fetchKPIs = async () => {
  const response = await api.get('/kpis')
  return response.data
}

export const fetchTimeSeries = async () => {
  const response = await api.get('/time-series')
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

