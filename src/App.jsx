import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Entry from './pages/Entry';
import Exit from './pages/Exit';
import Admin from './pages/Admin';
import ProfileSetup from './pages/ProfileSetup';

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth();

  if (loading) return null;

  // não logado -> login
  if (!user) return <Navigate to="/login" replace />;

  // logado mas profile incompleto -> setup
  const needsProfile = !profile?.full_name || !profile?.rg5;
  if (needsProfile) return <Navigate to="/profile-setup" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/entry" element={<Entry />} />
            <Route path="/exit" element={<Exit />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
