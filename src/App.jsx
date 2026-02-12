import ProfileSetup from './pages/ProfileSetup'
import GuestLayout from './components/GuestLayout'
import Entry from './pages/Entry'
import Exit from './pages/Exit'
import Admin from './pages/Admin'
import Login from './pages/Login' // Assuming Login is also a page
import Home from './pages/Home' // Assuming Home is also a page
import Layout from './components/Layout' // Assuming Layout is a component
import { AuthProvider } from './context/AuthContext' // Assuming AuthProvider is from a context
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom' // Assuming react-router-dom imports

export default function App() {
    <Route path=\"/admin\" element={<Admin />} />
                                    </Route >
        <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
                                </Routes >
                            </BrowserRouter >
                        </AuthProvider >
                        )
}
