import { SECTORS } from '../data/mockData'
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

export const fetchSectors = async () => {
  await delay()
  return { data: SECTORS }
}

export const fetchSectorById = async (id) => {
  await delay(300)
  const sector = SECTORS.find(s => s.id === Number(id))
  if (!sector) throw new Error('القطاع غير موجود')
  return { data: sector }
}
