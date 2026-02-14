import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [rg, setRg] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // 1. Sign up auth user
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError

            if (user) {
                // 2. Create profile (Trigger might handle this, but let's be safe/explicit for v3 fields)
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    full_name: fullName,
                    rg5: rg, // keeping column name rg5 for compatibility or migration
                    email: email,
                    role: 'staff'
                })

                if (profileError) {
                    console.error('Profile cleanup needed:', profileError)
                    // Optional: delete user if profile fails? 
                }

                alert('Cadastro realizado! Faça login.')
                navigate('/login')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className ="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                < h2 className ="text-2xl font-bold mb-6 text-center text-blue-800">Criar Conta</h2>
                    < form onSubmit = { handleSubmit } >
                        <Input
                            label="Nome Completo" 
    value = { fullName }
    onChange = { e => setFullName(e.target.value) }
    required
        />
        <Input
            label="E-mail" 
    type ="email"
    value = { email }
    onChange = { e => setEmail(e.target.value) }
    required
        />
        <Input
            label="RG (apenas números)" 
    value = { rg }
    onChange = { e => setRg(e.target.value.replace(/\\D/g, '').slice(0, 12)) }
    required
        />
        <Input
            label="Senha" 
    type ="password" 
    value = { password }
    onChange = { e => setPassword(e.target.value) }
    required
        />

        { error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            < Button type ="submit" loading={loading}>Cadastrar</Button>

                <div className ="mt-4 text-center text-sm">
                    < Link to ="/login" className="text-blue-600 hover:underline">Já tenho conta</Link>
          </div >
        </form >
      </div >
    </div >
  )
}
