import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Entry() {
    const [plate, setPlate] = useState('')
    const [driver, setDriver] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handlePlateBlur = async () => {
        if (plate.length < 3) return
        // Auto-fill driver from last record
        const { data } = await supabase.from('vehicles').select('last_driver').eq('plate', plate).single()
        if (data?.last_driver) {
            setDriver(data.last_driver)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Check if already inside
            const { data: active } = await supabase
                .from('vehicle_events')
                .select('id')
                .eq('plate', plate)
                .is('exit_at', null)
                .single() // returns error if 0 or >1, handling below is safer usually but single works if RLS fits

            if (active) {
                throw new Error('Veículo já está no pátio!')
            }

            const { error: insertError } = await supabase.from('vehicle_events').insert({
                plate,
                driver_name: driver,
            })

            if (insertError) throw insertError

            navigate('/')
        } catch (err) {
            setError(err.message || 'Erro ao registrar entrada.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className=\"max-w-md mx-auto bg-white p-6 rounded-lg shadow\">
            < h2 className =\"text-xl font-bold mb-4 text-green-700\">Registrar Entrada</h2>
                < form onSubmit = { handleSubmit } >
                    <Input
                        label=\"Placa\" 
    value = { plate }
    onChange = { e => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')) }
    onBlur = { handlePlateBlur }
    maxLength = { 7}
    required
        />
        <Input
            label=\"Nome do Condutor\" 
    value = { driver }
    onChange = { e => setDriver(e.target.value) }
    required
        />
        { error && <p className=\"text-red-500 mb-3 text-sm\">{error}</p>}
            < div className =\"flex gap-2\">
                < Button variant =\"secondary\" onClick={() => navigate('/')}>Cancelar</Button>
                    < Button type =\"submit\" variant=\"primary\" loading={loading}>Confirmar</Button>
        </div >
      </form >
    </div >
  )
}
