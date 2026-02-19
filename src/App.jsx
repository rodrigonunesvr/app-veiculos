import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Exit from './pages/Exit'
import Admin from './pages/Admin'

// Error Boundary Component
function ErrorFallback({ error }) {
    return (
        <div className=\"p-6 text-center\">
            < h2 className =\"text-red-600 font-bold mb-2\">Algo deu errado</h2>
                < p className =\"text-sm text-gray-600 mb-4\">{error?.message || 'Erro desconhecido'}</p>
                    < button onClick = {() => window.location.href = '/'
} className =\"bg-blue-600 text-white px-4 py-2 rounded\">
Recarregar
      </button >
    </div >
  )
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return <div className=\"p-10 text-center text-gray-500\">Carregando...</div>
    if (!user) return <Navigate to=\"/login\" replace />

    return children
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path=\"/login\" element={<Login />} />
                    <Route path=\"/signup\" element={<SignUp />} />
                    <Route path=\"/forgot-password\" element={<ForgotPassword />} />

                    {/* Setup */}
                    <Route path=\"/profile-setup\" element={
                        <ProtectedRoute><ProfileSetup /></ProtectedRoute>
                    } />

                    {/* Protected Main App */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path=\"/\" element={<Home />} />
                        <Route path=\"/entry\" element={<Entry />} />
                        <Route path=\"/exit\" element={<Exit />} />
                        <Route path=\"/admin\" element={<Admin />} />
                    </Route>

                    {/* Fallback */}
                    <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
