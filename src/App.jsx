import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Exit from './pages/Exit'
import Admin from './pages/Admin'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Setup Route */}
                    <Route path="/profile-setup" element={<ProfileSetup />} />

                    {/* Protected Main App Routes */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/entry" element={<Entry />} />
                        <Route path="/exit" element={<Exit />} />
                        <Route path="/admin" element={<Admin />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
