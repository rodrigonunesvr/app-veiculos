<<<<<<< HEAD
import ProfileSetup from './pages/ProfileSetup'
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Entry from './pages/Entry';
import Exit from './pages/Exit';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
>>>>>>> b4892f26520e0b98bd3aa2239c5183f209b265b4

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        import Entry from './pages/Entry'
                        import Exit from './pages/Exit'
                        import Admin from './pages/Admin'

                        export default function App() {
    return (
                        <AuthProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path=\"/login\" element={<Login />} />
                                    <Route element={<Layout />}>
                                        <Route path=\"/\" element={<Home />} />
                                        <Route path=\"/entry\" element={<Entry />} />
                                        <Route path=\"/exit\" element={<Exit />} />
                                        <Route path=\"/admin\" element={<Admin />} />
                                    </Route>
                                    <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
                                </Routes>
                            </BrowserRouter>
                        </AuthProvider>
                        )
}
