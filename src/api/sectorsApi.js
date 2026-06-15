import apiClient from './apiClient'

export const fetchSectors = async () => {
  const response = await apiClient.get('/sectors')
  return response.data.data.sectors
}

export const fetchSectorById = async (id) => {
  const response = await apiClient.get(`/sectors/${id}`)
  return response.data.data.sector
}
