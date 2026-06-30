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

export const updateContract = async (id, formData, onUploadProgress) => {
  const response = await apiClient.patch(`/contracts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      if (onUploadProgress) onUploadProgress(percentCompleted)
    },
  })
  return response.data
}

export const deleteContract = async (id) => {
  const response = await apiClient.delete(`/contracts/${id}`)
  return response.data
}
