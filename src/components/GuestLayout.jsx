import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, LogIn, LogOut, Settings } from 'lucide-react'

export default function GuestLayout() {
    const location = useLocation()
    const navItemClass = (path) => `flex flex-col items-center p-2 text-xs ${location.pathname === path ? 'text-blue-600' : 'text-gray-500'}`

    return (
        <div className=\"min-h-screen flex flex-col\">
            < header className =\"bg-white shadow px-4 py-3 flex justify-between items-center\">
                < h1 className =\"font-bold text-lg text-blue-800\">Controle Veículos</h1>
                    < Link to =\"/login\" className=\"text-gray-500 hover:text-blue-500\">
                        < Settings size = { 20} />
        </Link >
      </header >

        <main className=\"flex-1 p-4 pb-20\">
            < Outlet />
      </main >

        <nav className=\"fixed bottom-0 w-full bg-white border-t flex justify-around py-2 pb-safe\">
            < Link to =\"/\" className={navItemClass('/')}>
                < Home size = { 24} />
                    <span>Início</span>
        </Link >
        <Link to=\"/entry\" className={navItemClass('/entry')}>
            < LogIn size = { 24} />
                <span>Entrada</span>
        </Link >
        <Link to=\"/exit\" className={navItemClass('/exit')}>
            < LogOut size = { 24} className =\"rotate-180\" />
                < span > Saída</span >
        </Link >
      </nav >
    </div >
  )
}
