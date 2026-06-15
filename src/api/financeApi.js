import apiClient from './apiClient'

export const fetchFundingSources = async () => {
  const response = await apiClient.get('/finance/funding-sources')
  return response.data.data
}

export const fetchAvailableCurrencies = async () => {
  const response = await apiClient.get('/finance/currencies')
  return response.data.data.currencies
}

export const fetchDashboardStats = async (currency = 'all') => {
  const response = await apiClient.get(`/analytics/dashboard?currency=${currency}`)
  return response.data.data
}

export const fetchFundingStats = async () => {
  const response = await apiClient.get('/analytics/funding-stats')
  return response.data.data
}

export const fetchBudgetAnalytics = async (currency = 'all') => {
  const response = await apiClient.get(`/analytics/budget?currency=${currency}`)
  return response.data.data
}

export const fetchProjectExpenses = async (projectId) => {
  const response = await apiClient.get(`/finance/expenses/${projectId}`)
  return response.data.data
}

export const createExpense = async (payload) => {
  const response = await apiClient.post('/finance/expenses', payload)
  return response.data
}

export const createFundingAllocation = async (payload) => {
  const response = await apiClient.post('/finance/allocations', payload)
  return response.data
}

export const createFundingTransaction = async (payload) => {
  const response = await apiClient.post('/finance/transactions', payload)
  return response.data
}

export const fetchProjectAllocations = async (projectId) => {
  const response = await apiClient.get(`/finance/allocations/${projectId}`)
  return response.data.data.funding
}

export const getProjectReportUrl = (projectId) => {
  const host = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
  return `${host}/reports/pdf/project/${projectId}`
}

export const downloadProjectReport = async (projectId) => {
  const response = await apiClient.get(`/reports/pdf/project/${projectId}`, {
    responseType: 'blob'
  })
  return response.data
}
