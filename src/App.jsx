import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Opportunities from "./pages/Opportunities"
import NewOpportunity from "./pages/NewOpportunity"
import OpportunityDetail from "./pages/OpportunityDetail"
import Discovery from "./pages/Discovery"
import NewDiscovery from "./pages/NewDiscovery"
import DiscoveryDetail from "./pages/DiscoveryDetail"
import Scope from "./pages/Scope"
import NewScope from "./pages/NewScope"
import ScopeDetail from "./pages/ScopeDetail"
import Projects from "./pages/Projects"
import NewProject from "./pages/NewProject"
import ProjectDetail from "./pages/ProjectDetail"
import Testing from "./pages/Testing"
import NewTestCycle from "./pages/NewTestCycle"
import TestCycleDetail from "./pages/TestCycleDetail"

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/opportunities/new" element={<ProtectedRoute><NewOpportunity /></ProtectedRoute>} />
      <Route path="/opportunities/:id" element={<ProtectedRoute><OpportunityDetail /></ProtectedRoute>} />
      <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/discovery/new" element={<ProtectedRoute><NewDiscovery /></ProtectedRoute>} />
      <Route path="/discovery/:id" element={<ProtectedRoute><DiscoveryDetail /></ProtectedRoute>} />
      <Route path="/scope" element={<ProtectedRoute><Scope /></ProtectedRoute>} />
      <Route path="/scope/new" element={<ProtectedRoute><NewScope /></ProtectedRoute>} />
      <Route path="/scope/:id" element={<ProtectedRoute><ScopeDetail /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/testing" element={<ProtectedRoute><Testing /></ProtectedRoute>} />
      <Route path="/testing/new" element={<ProtectedRoute><NewTestCycle /></ProtectedRoute>} />
      <Route path="/testing/:id" element={<ProtectedRoute><TestCycleDetail /></ProtectedRoute>} />
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
