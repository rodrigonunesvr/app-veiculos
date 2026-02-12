import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

const DESTINATIONS = [
    '7º GBM', 'SOCORRO', 'CSM', 'ESTAFETA', 'ODONTO.', 'CRSI', 'MANUTENÇÃO', 'OUTROS'
]

export default function Entry() {
    const [vehicleCode, setVehicleCode] = useState('')
    const [driver, setDriver] = useState('')
    const [destination, setDestination] = useState(DESTINATIONS[0])
    const [destinationOther, setDestinationOther] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleBlur = async () => {
        if (vehicleCode.length < 3) return
        const { data } = await supabase.from('vehicles').select('last_driver').eq('plate', vehicleCode).single()
        if (data?.last_driver) {
            setDriver(data.last_driver)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Check if already inside (optional in flexible mode, but good to warn)
            // For v2.1, we allow flexible, so maybe just proceed or warn?
            // User requirement: "Modelo de dados para suportar saída antes de entrada" -> implied loose constraints.
            // But let's check active_vehicles view if we want to prevent double entry.
            // "Validações: se já existe evento aberto... alertar" (from v1). Let's keep it for ENTRY.

            const { data: active } = await supabase
                .from('active_vehicles')
                .select('id')
                .eq('vehicle_code', vehicleCode)
                .eq('type', 'ENTRY')
                .single()

            if (active) {
                throw new Error('Veículo já consta como DENTRO (Último evento foi Entrada).')
            }

            const finalDest = destination === 'OUTROS' ? destinationOther : destination
            if (!finalDest) throw new Error('Informe o destino.')

            const { error: insertError } = await supabase.from('vehicle_movements').insert({
                vehicle_code: vehicleCode,
                driver_name: driver,
                destination: finalDest,
                type: 'ENTRY'
            })

            if (insertError) throw insertError

            // Update vehicle registry (last_driver) - Handled by trigger usually, 
            // but v2.1 didn't specify trigger update, assume v1 trigger on vehicle_events? 
            // We moved to vehicle_movements. Let's update manually to be safe or create trigger later.
            await supabase.from('vehicles').upsert({ plate: vehicleCode, last_driver: driver })

            navigate('/')
        } catch (err) {
            console.error(err)
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
                        label=\"Placa / Prefixo\" 
    value = { vehicleCode }
    onChange = { e => setVehicleCode(e.target.value.toUpperCase().replace(/\\s/g, '')) }
    onBlur = { handleBlur }
    placeholder =\"ABC-1234 ou 12345\"
    required
        />
        <Input
            label=\"Condutor\" 
    value = { driver }
    onChange = { e => setDriver(e.target.value) }
    required
        />

        <div className=\"mb-3\">
            < label className =\"block text-sm font-medium text-gray-700 mb-1\">Destino</label>
                < select
    className =\"w-full p-2 border rounded-md border-gray-300\"
    value = { destination }
    onChange = { e => setDestination(e.target.value) }
        >
        { DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>) }
          </select >
        </div >

        { destination === 'OUTROS' && (
            <Input
                label=\"Qual destino?\" 
    value = { destinationOther }
    onChange = { e => setDestinationOther(e.target.value) }
    required
    placeholder =\"Digite o destino...\"
        />
        )
}

{
    error && <p className=\"text-red-500 mb-3 text-sm\">{error}</p>}
        < div className =\"flex gap-2\">
            < Button variant =\"secondary\" onClick={() => navigate('/')}>Cancelar</Button>
                < Button type =\"submit\" variant=\"primary\" loading={loading}>Confirmar Entrada</Button>
        </div >
      </form >
    </div >
  )
}
