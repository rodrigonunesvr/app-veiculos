import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        try {
            // Envia o link de redefinição padrão do Supabase
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            })
            if (error) throw error
            setMessage('Se este e-mail estiver cadastrado, um link de redefinição foi enviado para ele.')
        } catch (err) {
            setError('Erro ao enviar e-mail. Verifique a conexão ou se o e-mail é válido.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center text-blue-800">Recuperar Senha</h2>
                
                <p className="text-xs text-gray-600 mb-6 text-center">
                    Será enviado um link para o seu e-mail cadastrado para que você possa criar uma nova senha.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="E-mail Cadastrado"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="seu@email.com"
                    />

                    {message && <p className="text-green-600 text-xs font-bold mb-3">{message}</p>}
                    {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                    <Button type="submit" loading={loading}>
                        Enviar Link de Redefinição
                    </Button>

                    <div className="mt-6 text-center text-sm">
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">Voltar para o Login</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
