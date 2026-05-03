import apiClient from './apiClient'
import { PROJECTS } from '../data/mockData'

// ── Mock helpers ─────────────────────────────────────────────────────────────
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchProjects = async (filters = {}) => {
  // TODO: replace with → apiClient.get('/projects', { params: filters })
  await delay()
  let results = [...PROJECTS]
  if (filters.sector)  results = results.filter(p => p.sector === filters.sector)
  if (filters.status)  results = results.filter(p => p.status === filters.status)
  if (filters.search)  results = results.filter(p =>
    p.name.includes(filters.search) || p.id.includes(filters.search))
  return { data: results, total: results.length }
}

export const fetchProjectById = async (id) => {
  await delay(300)
  const project = PROJECTS.find(p => p.id === id)
  if (!project) throw new Error('المشروع غير موجود')
  return { data: project }
}

export const createProject = async (payload) => {
  // TODO: replace with → apiClient.post('/projects', payload)
  await delay(500)
  return { data: { ...payload, id: `PRJ-${Date.now()}` }, message: 'تم إنشاء المشروع بنجاح' }
}

export const updateProject = async (id, payload) => {
  // TODO: replace with → apiClient.put(`/projects/${id}`, payload)
  await delay(400)
  return { data: { id, ...payload }, message: 'تم تحديث المشروع بنجاح' }
}

export const deleteProject = async (id) => {
  // TODO: replace with → apiClient.delete(`/projects/${id}`)
  await delay(300)
  return { message: 'تم حذف المشروع بنجاح' }
}
