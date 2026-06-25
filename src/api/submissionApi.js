import apiClient from './apiClient'

export const createSubmission = async (type, data) => {
  const response = await apiClient.post(`/submissions/${type}`, data)
  return response.data
}

export const getMySubmissions = async () => {
  const response = await apiClient.get('/submissions/my-submissions')
  return response.data
}

export const getPendingSubmissions = async () => {
  const response = await apiClient.get('/submissions/pending')
  return response.data
}

export const reviewSubmission = async (type, id, actionData) => {
  const response = await apiClient.post(`/submissions/${type}/${id}/review`, actionData)
  return response.data
}

export const updateSubmission = async (type, id, updateData) => {
  const response = await apiClient.patch(`/submissions/${type}/${id}`, updateData)
  return response.data
}

export const deleteSubmission = async (type, id) => {
  const response = await apiClient.delete(`/submissions/${type}/${id}`)
  return response.data
}
