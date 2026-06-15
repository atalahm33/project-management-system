import apiClient from './apiClient'

export const createContract = async (formData, onUploadProgress) => {
  const response = await apiClient.post('/contracts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      if (onUploadProgress) onUploadProgress(percentCompleted)
    },
  })
  return response.data
}

export const fetchAllContracts = async () => {
  const response = await apiClient.get('/contracts')
  return response.data?.data?.contracts ?? []
}

export const addSupplementaryContract = async (parentId, formData, onUploadProgress) => {
  const response = await apiClient.post(`/contracts/${parentId}/supplementary`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      if (onUploadProgress) onUploadProgress(percentCompleted)
    },
  })
  return response.data
}
