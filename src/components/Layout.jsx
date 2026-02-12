import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Home, Key, LogIn, LayoutDashboard } from 'lucide-react'

export default function Layout() {
    const { user, signOut, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    if (!user) return <Outlet />

    // Enforce Profile Completion (v2.1)
    // We check if "profile" is loaded and has data. 
    // If loading is true, we wait.
    // If profile is loaded but missing name/rg -> redirect.
    // Exception: Don't redirect if we are ALREADY at /profile-setup (handled by Route outside Layout).
    // Actually ProfileSetup is outside Layout, so if we render Layout, we check.

    // Use a small effect or check here
    const { profile, loading } = useAuth()
    if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>

    if (!profile?.full_name || !profile?.rg5) {
        // Force redirect to setup
        // We can't use Navigate here easily if it loop. 
        // Ensure Layout is ONLY used for protected pages.
        return <Navigate to="/profile-setup" replace />
    }

    const navItemClass = (path) => `flex flex-col items-center p-2 text-xs ${location.pathname === path ? 'text-blue-600' : 'text-gray-500'}`

    return (
        <div className="min-h-screen flex flex-col">
            < header className ="bg-white shadow px-4 py-3 flex justify-between items-center">
                < h1 className ="font-bold text-lg text-blue-800">Controle Veículos</h1>
                    < button onClick = { handleSignOut } className ="text-gray-500 hover:text-red-500">
                        < LogOut size = { 20} />
        </button >
      </header >

        <main className="flex-1 p-4 pb-20">
            < Outlet />
      </main >

        <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-2 pb-safe">
        < Link to ="/" className={navItemClass('/')}>
            < Home size = { 24} />
                <span>Início</span>
        </Link >
        <Link to="/entry" className={navItemClass('/entry')}>
            < LogIn size = { 24} />
                <span>Entrada</span>
        </Link >
        <Link to="/exit" className={navItemClass('/exit')}>
            < LogOut size = { 24} className ="rotate-180" /> {/* Visual hack for Exit */}
                < span > Saída</span >
        </Link >
        { isAdmin && (
            <Link to="/admin" className={navItemClass('/admin')}>
                < LayoutDashboard size = { 24} />
                    <span>Admin</span>
          </Link >
        )
}
      </nav >
    </div >
  )
}
