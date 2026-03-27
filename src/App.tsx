// App.tsx — Routeur principal avec lazy loading sur toutes les pages
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ToastContainer } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Spinner'

// Auth
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))

// Layout
const AppLayout          = lazy(() => import('@/components/layout/AppLayout'))

// Pages applicatives
const DashboardPage      = lazy(() => import('@/pages/dashboard/DashboardPage'))
const PatientsPage       = lazy(() => import('@/pages/patients/PatientsPage'))
const PatientDetailPage  = lazy(() => import('@/pages/patients/PatientDetailPage'))
const PatientFormPage    = lazy(() => import('@/pages/patients/PatientFormPage'))
const PlanningPage       = lazy(() => import('@/pages/planning/PlanningPage'))
const ItinerairePage     = lazy(() => import('@/pages/itineraire/ItinerairePage'))
const NotesSoinsPage     = lazy(() => import('@/pages/soins/NotesSoinsPage'))
const SoinDetailPage     = lazy(() => import('@/pages/soins/SoinDetailPage'))
const TransmissionsPage  = lazy(() => import('@/pages/transmissions/TransmissionsPage'))
const SMSPage            = lazy(() => import('@/pages/sms/SMSPage'))
const MessageriePage     = lazy(() => import('@/pages/messagerie/MessageriePage'))
const ContratsPage       = lazy(() => import('@/pages/contrats/ContratsPage'))
const RetrocessionsPage  = lazy(() => import('@/pages/retrocessions/RetrocessionsPage'))
const RemplacantesPage   = lazy(() => import('@/pages/remplacantes/RemplacantesPage'))
const SecretairePage     = lazy(() => import('@/pages/secretaire/SecretairePage'))
const StatistiquesPage   = lazy(() => import('@/pages/statistiques/StatistiquesPage'))
const StockPage          = lazy(() => import('@/pages/stock/StockPage'))
const FichesSoinsPage    = lazy(() => import('@/pages/fiches/FichesSoinsPage'))
const NotificationsPage  = lazy(() => import('@/pages/notifications/NotificationsPage'))
const SecuritePage       = lazy(() => import('@/pages/securite/SecuritePage'))
const FacturationPage    = lazy(() => import('@/pages/facturation/FacturationPage'))
const AdminPage          = lazy(() => import('@/pages/admin/AdminPage'))

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-navy-700 dark:text-navy-300">Chargement...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="/patients"           element={<PatientsPage />} />
              <Route path="/patients/nouveau"   element={<PatientFormPage />} />
              <Route path="/patients/:id"       element={<ErrorBoundary><PatientDetailPage /></ErrorBoundary>} />
              <Route path="/patients/:id/edit"  element={<PatientFormPage />} />
              <Route path="/planning"           element={<PlanningPage />} />
              <Route path="/itineraire"         element={<ItinerairePage />} />
              <Route path="/soins"              element={<NotesSoinsPage />} />
              <Route path="/soins/:visitId"     element={<SoinDetailPage />} />
              <Route path="/transmissions"      element={<TransmissionsPage />} />
              <Route path="/sms"                element={<SMSPage />} />
              <Route path="/messagerie"         element={<MessageriePage />} />
              <Route path="/contrats"           element={<ContratsPage />} />
              <Route path="/retrocessions"      element={<RetrocessionsPage />} />
              <Route path="/remplacantes"       element={<RemplacantesPage />} />
              <Route path="/secretaire"         element={<SecretairePage />} />
              <Route path="/statistiques"       element={<StatistiquesPage />} />
              <Route path="/stock"              element={<StockPage />} />
              <Route path="/fiches"             element={<FichesSoinsPage />} />
              <Route path="/notifications"      element={<NotificationsPage />} />
              <Route path="/securite"           element={<SecuritePage />} />
              <Route path="/facturation"        element={<FacturationPage />} />
              <Route path="/admin"              element={<AdminPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
