import apiClient from './apiClient'

export const fetchCompanies = async () => {
  const response = await apiClient.get('/companies')
  return response.data.data.companies
}

export const fetchCompanyById = async (id) => {
  const response = await apiClient.get(`/companies/${id}`)
  return response.data.data.company
}
