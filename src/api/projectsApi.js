import apiClient from './apiClient'

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchProjects = async (filters = {}) => {
  const response = await apiClient.get('/projects', { params: filters })
  return response.data.data.projects
}

export const fetchProjectById = async (id) => {
  const response = await apiClient.get(`/projects/${id}`)
  return response.data.data.project
}

export const createProject = async (payload) => {
  const response = await apiClient.post('/projects', payload)
  return response.data
}

export const updateProject = async (id, payload) => {
  const response = await apiClient.patch(`/projects/${id}`, payload)
  return response.data
}

export const deleteProject = async (id) => {
  const response = await apiClient.delete(`/projects/${id}`)
  return response.data
}

// ── Self-Review & Approval ─────────────────────────────────────────────────────

/** Fetch projects created by me that are still pending review */
export const fetchMyPendingProjects = async () => {
  const response = await apiClient.get('/projects/my-pending')
  return response.data.data.projects
}

/** Approve a project (only creator or Admin) */
export const approveProject = async (id) => {
  const response = await apiClient.patch(`/projects/${id}/approve`)
  return response.data
}
