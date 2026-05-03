const delay = (ms = 500) => new Promise(r => setTimeout(r, ms))

const MOCK_USERS = [
  { id: 1, name: 'محمد العتيبي', role: 'admin',   email: 'admin@nspo.gov.sa',    token: 'mock-admin-token' },
  { id: 2, name: 'سارة الزهراني', role: 'official', email: 'official@nspo.gov.sa', token: 'mock-official-token' },
  { id: 3, name: 'خالد المالكي',  role: 'viewer',  email: 'viewer@nspo.gov.sa',   token: 'mock-viewer-token' },
]

export const login = async ({ username, password, role }) => {
  await delay()
  const user = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0]
  if (!username || !password) throw new Error('يرجى إدخال بيانات الدخول')
  localStorage.setItem('auth_token', user.token)
  localStorage.setItem('auth_user', JSON.stringify(user))
  return { data: user, message: 'تم تسجيل الدخول بنجاح' }
}

export const logout = async () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  return { message: 'تم تسجيل الخروج' }
}

export const getCurrentUser = () => {
  const raw = localStorage.getItem('auth_user')
  return raw ? JSON.parse(raw) : null
}
