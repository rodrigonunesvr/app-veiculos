import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { error } = await signIn(email, password)
            if (error) throw error
            navigate('/')
        } catch (err) {
            console.error(err)
            if (err.message && err.message.includes('Email not confirmed')) {
                setError('E-mail não confirmado. Verifique sua caixa de entrada.')
            } else if (err.message && err.message.includes('Invalid login credentials')) {
                setError('E-mail ou senha incorretos.')
            } else {
                setError('Erro ao entrar. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            < div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                < h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Controle de Veículos</h2>
                < form onSubmit={handleSubmit} >
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
                    <Button type="submit" loading={loading}>Entrar</Button>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Ainda não tem conta?{' '}
                            <a href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                                Criar Conta
                            </a>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            <a href="/forgot-password" className="hover:underline">Esqueci minha senha</a>
                        </p>
                    </div>

                </form>
            </div>
        </div >
    )
}

