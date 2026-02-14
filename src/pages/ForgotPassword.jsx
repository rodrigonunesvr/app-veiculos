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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            })
            if (error) throw error
            setMessage('Verifique seu e-mail para redefinir a senha.')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className ="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                < h2 className ="text-xl font-bold mb-4 text-center text-blue-800">Recuperar Senha</h2>
                    < form onSubmit = { handleSubmit } >
                        <Input
                            label="E-mail" 
    type ="email"
    value = { email }
    onChange = { e => setEmail(e.target.value) }
    required
        />

        { message && <p className="text-green-600 text-sm mb-3">{message}</p>}
    {
        error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            < Button type ="submit" loading={loading}>Enviar Link</Button>

                <div className ="mt-4 text-center text-sm">
                    < Link to ="/login" className="text-blue-600 hover:underline">Voltar para Login</Link>
          </div >
        </form >
      </div >
    </div >
  )
    }
