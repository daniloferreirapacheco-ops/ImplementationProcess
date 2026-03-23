import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import NewOpportunity from './pages/NewOpportunity'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" /> : <Login />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/opportunities" element={
        <ProtectedRoute><Opportunities /></ProtectedRoute>
      } />
      <Route path="/opportunities/new" element={
        <ProtectedRoute><NewOpportunity /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
