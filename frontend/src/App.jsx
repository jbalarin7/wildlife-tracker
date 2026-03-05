import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import MapView from './pages/MapView'
import NewOccurrence from './pages/NewOccurrence'
import OccurrenceDetail from './pages/OccurrenceDetail'
import OccurrenceList from './pages/OccurrenceList'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/list" element={<OccurrenceList />} />
          <Route path="/occurrences/:id" element={<OccurrenceDetail />} />
          <Route
            path="/occurrences/new"
            element={
              <ProtectedRoute>
                <NewOccurrence />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
        </Routes>
      </main>
    </div>
  )
}
