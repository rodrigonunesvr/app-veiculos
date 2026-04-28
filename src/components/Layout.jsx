import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, LogIn, LogOut, LayoutDashboard, UserX, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Layout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { profile, user, isAdmin } = useAuth()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navItemClass = (path) => `flex flex-col items-center p-2 text-xs ${location.pathname === path ? 'text-blue-600' : 'text-gray-500'}`

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
    {/* Header */ }
    <header className="bg-white shadow px-4 py-3 flex justify-between items-center z-10">
        < div >
        <h1 className="font-bold text-lg text-blue-800 leading-tight">Controle Veículos <span className="text-[10px] bg-blue-100 px-1 rounded">V16.2 PREMIUM</span></h1>
    {
        profile && <p className="text-xs text-gray-500">Olá, {profile.full_name?.split(' ')[0]}</p>}
        </div >

            <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        title ="Sair"
            >
            <LogOut size={20} />
        </button >
      </header >

            {/* Main Content */ }
            < main className ="flex-1 p-4 pb-24 overflow-y-auto">
                < Outlet />
      </main >

            {/* Bottom Nav */ }
            < nav className ="fixed bottom-0 w-full bg-white border-t flex justify-around py-2 pb-safe z-10 shadow-lg">
                < Link to ="/" className={navItemClass('/')}>
                    < Home size = { 24} />
                        <span>Início</span>
        </Link >
            <Link to="/entry" className={navItemClass('/entry')}>
                < LogIn size = { 24} />
                    <span>Entrada</span>
        </Link >
            <Link to="/exit" className={navItemClass('/exit')}>
                < LogOut size = { 24} className ="rotate-180" />
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

