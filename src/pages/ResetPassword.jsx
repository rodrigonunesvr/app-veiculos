import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.updateUser({ password: password })
            if (error) throw error
            setSuccess(true)
            setTimeout(() => navigate('/'), 2000)
        } catch (err) {
            setError('Erro ao redefinir a senha.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
                <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm text-center">
                    <h2 className="text-xl font-bold mb-4 text-green-600">Senha Alterada!</h2>
                    <p className="text-gray-600">Sua senha foi atualizada com sucesso.</p>
                    <p className="text-sm text-gray-400 mt-2">Redirecionando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center text-blue-800">Nova Senha</h2>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Nova Senha"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <Button type="submit" loading={loading}>Atualizar Senha</Button>
                </form>
            </div>
        </div>
    )
}
