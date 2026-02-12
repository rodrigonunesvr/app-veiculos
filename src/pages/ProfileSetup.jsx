import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ProfileSetup() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [fullName, setFullName] = useState('')
    const [rg5, setRg5] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (rg5.length !== 5) {
            setError('O RG deve ter exatamente 5 dígitos.')
            return
        }
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, rg5, phone })
                .eq('id', user.id)

            if (error) throw error

            // Force reload or redirect
            window.location.href = '/'
        } catch (err) {
            setError('Erro ao salvar perfil.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className ="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                < h2 className ="text-xl font-bold mb-4 text-blue-800">Completar Cadastro</h2>
                    < p className ="text-sm text-gray-500 mb-6">Para continuar, precisamos de alguns dados.</p>

                        < form onSubmit = { handleSubmit } >
                            <Input
                                label="Nome Completo" 
    value = { fullName }
    onChange = { e => setFullName(e.target.value) }
    required
        />
        <Input
            label="RG (5 dígitos)" 
    value = { rg5 }
    onChange = { e => setRg5(e.target.value.replace(/\\D/g, '').slice(0, 5)) }
    maxLength = { 5}
    placeholder ="12345"
    required
        />
        <Input
            label="Telefone (Opcional)" 
    value = { phone }
    onChange = { e => setPhone(e.target.value) }
        />

        { error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            < Button type ="submit" loading={loading}>Salvar e Continuar</Button>
        </form >
      </div >
    </div >
  )
}
