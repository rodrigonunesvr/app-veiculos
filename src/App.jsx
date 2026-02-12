import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Home from './pages/Home';
import Entry from './pages/Entry';
import Exit from './pages/Exit';
import Admin from './pages/Admin';
import Login from './pages/Login';

import { AuthProvider, useAuth } from './contexts/AuthContext';

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;

  // não logado -> login admin
  if (!user) return <Navigate to="/login" replace />;

  // logado mas não admin -> volta pro público
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Público (totem) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/entry" element={<Entry />} />
            <Route path="/exit" element={<Exit />} />
          </Route>

          {/* Admin */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
