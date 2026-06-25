import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import HomePage from './pages/home'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import ProjectReportPage from './pages/ProjectReportPage'
import SectorsPage from './pages/SectorsPage'
import FundingSourcesPage from './pages/FundingSourcesPage'
import ReportsPage from './pages/ReportsPage'
import Setting from './pages/Setting'
import SubmissionsPage from './pages/SubmissionsPage'

// Admin Pages
import AddProjectPage from './pages/admin/AddProjectPage'
import AddExpensePage from './pages/admin/AddExpensePage'
import AddContractPage from './pages/admin/AddContractPage'
import AddFundingPage from './pages/admin/AddFundingPage'
import AddTransactionPage from './pages/admin/AddTransactionPage'
import AddProgressPage from './pages/admin/AddProgressPage'
import AddSubContractPage from './pages/admin/AddSubContractPage'
import ReviewProjectPage from './pages/admin/ReviewProjectPage'

// Protected Routes
import AdminRoute from './components/AdminRoute'
import { useAuth } from './context/AuthContext'

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-gray-50/50" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col min-h-screen transition-all duration-300">
        <Header />
        <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id/report" element={<ProjectReportPage />} />

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

        <Route path="/funding-sources" element={
          <ProtectedLayout><FundingSourcesPage /></ProtectedLayout>
        } />

        <Route path="/submissions" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Reviewer', 'Financial Manager', 'Engineering Manager']}>
              <SubmissionsPage />
            </AdminRoute>
          </ProtectedLayout>
        } />

        <Route path="/add-project" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Reviewer']}><AddProjectPage /></AdminRoute>
          </ProtectedLayout>
        } />

        {/* Self-review page — accessible by anyone who is logged in */}
        <Route path="/review-project/:id" element={
          <ProtectedLayout><ReviewProjectPage /></ProtectedLayout>
        } />

        <Route path="/add-expense" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Financial Manager']}><AddExpensePage /></AdminRoute>
          </ProtectedLayout>
        } />
        <Route path="/add-contract" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Financial Manager']}><AddContractPage /></AdminRoute>
          </ProtectedLayout>
        } />
        <Route path="/add-funding/:projectId?" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Financial Manager']}><AddFundingPage /></AdminRoute>
          </ProtectedLayout>
        } />
        <Route path="/add-transaction/:projectId?/:sourceId?" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Financial Manager']}><AddTransactionPage /></AdminRoute>
          </ProtectedLayout>
        } />
        <Route path="/add-progress/:projectId?" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Engineering Manager']}><AddProgressPage /></AdminRoute>
          </ProtectedLayout>
        } />
        <Route path="/add-subcontract/:parentId?" element={
          <ProtectedLayout>
            <AdminRoute allowedRoles={['Admin', 'Super Admin', 'Financial Manager']}><AddSubContractPage /></AdminRoute>
          </ProtectedLayout>
        } />

        <Route path="/reports" element={
          <ProtectedLayout><ReportsPage /></ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout><Setting /></ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
