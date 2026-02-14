import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, LayoutDashboard } from 'lucide-react';

export default function Layout() {
  const { user, signOut, isAdmin, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Força login quando não autenticado
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // Enquanto carrega sessão/perfil
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  // Se não tem usuário, não renderiza o app (useEffect vai redirecionar)
  if (!user) return null;

  // Exigir perfil completo (se você ainda usa esse requisito)
  if (!profile?.full_name || !profile?.rg5) {
    return <Navigate to="/profile-setup" replace />;
  }

  const navItemClass = (path) =>
    `flex flex-col items-center p-2 text-xs ${
      location.pathname === path ? 'text-blue-600' : 'text-gray-500'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg text-blue-800">Controle Veículos</h1>

        <header className="bg-white shadow px-4 py-3 flex justify-between items-center">
  <h1 className="font-bold text-lg text-blue-800">Controle Veículos</h1>

  <button
    onClick={handleSignOut}
    className="text-sm font-semibold text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50"
  >
    Sair
  </button>
</header>

      </header>

      <main className="flex-1 p-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-2 pb-safe">
        <Link to="/" className={navItemClass('/')}>
          <Home size={24} />
          <span>Início</span>
        </Link>

        {isAdmin && (
          <Link to="/admin" className={navItemClass('/admin')}>
            <LayoutDashboard size={24} />
            <span>Admin</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
