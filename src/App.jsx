import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import SectorsPage from './pages/SectorsPage'
import FundingPage from './pages/FundingPage'
import MapPage from './pages/MapPage'
import ReportsPage from './pages/ReportsPage'
import { getCurrentUser } from './api/authApi'

function ProtectedLayout({ children }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <ProtectedLayout><DashboardPage /></ProtectedLayout>
      } />
      <Route path="/projects" element={
        <ProtectedLayout><ProjectsPage /></ProtectedLayout>
      } />
      <Route path="/projects/:id" element={
        <ProtectedLayout><ProjectDetailsPage /></ProtectedLayout>
      } />
      <Route path="/sectors" element={
        <ProtectedLayout><SectorsPage /></ProtectedLayout>
      } />
      <Route path="/funding" element={
        <ProtectedLayout><FundingPage /></ProtectedLayout>
      } />
      <Route path="/map" element={
        <ProtectedLayout><MapPage /></ProtectedLayout>
      } />
      <Route path="/reports" element={
        <ProtectedLayout><ReportsPage /></ProtectedLayout>
      } />
      <Route path="/settings" element={
        <ProtectedLayout>
          <div className="card text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">الإعدادات</p>
            <p className="text-sm mt-1">قريباً...</p>
          </div>
        </ProtectedLayout>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
