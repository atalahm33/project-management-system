import { FUNDING_SOURCES, DASHBOARD_STATS } from '../data/mockData'
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

export const fetchFundingSources = async () => {
  await delay()
  return { data: FUNDING_SOURCES }
}

export const fetchDashboardStats = async () => {
  await delay(300)
  return { data: DASHBOARD_STATS }
}

export const fetchBudgetAnalytics = async () => {
  await delay(400)
  return {
    data: {
      monthly: [
        { month: 'يناير', budget: 6500, spent: 3200 },
        { month: 'فبراير', budget: 7000, spent: 3800 },
        { month: 'مارس',  budget: 7200, spent: 4100 },
        { month: 'أبريل', budget: 6800, spent: 3600 },
        { month: 'مايو',  budget: 7500, spent: 4400 },
        { month: 'يونيو', budget: 8000, spent: 4900 },
      ]
    }
  }
}
