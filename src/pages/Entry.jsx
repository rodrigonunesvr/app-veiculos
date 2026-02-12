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

    // Audit Fields (v2.2)
    const [staffName, setStaffName] = useState('')
    const [staffRg, setStaffRg] = useState('')

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
            // Validation Check (Audit)
            if (staffName.length < 3) throw new Error('Nome do militar deve ter no mínimo 3 letras.')
            if (!/^\\d{5}$/.test(staffRg)) throw new Error('RG do militar deve ter exatamente 5 dígitos.')

            // Check Active
            const { data: active } = await supabase
                .from('active_vehicles')
                .select('id')
                .eq('vehicle_code', vehicleCode)
                .eq('type', 'ENTRY')
                .single()

            if (active) throw new Error('Veículo já consta como DENTRO.')

            const finalDest = destination === 'OUTROS' ? destinationOther : destination
            if (!finalDest) throw new Error('Informe o destino.')

            const { error: insertError } = await supabase.from('vehicle_movements').insert({
                vehicle_code: vehicleCode,
                driver_name: driver,
                destination: finalDest,
                type: 'ENTRY',
                staff_name: staffName,
                staff_rg5: staffRg
            })

            if (insertError) throw insertError

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
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            < h2 className ="text-xl font-bold mb-4 text-green-700">Registrar Entrada</h2>
                < form onSubmit = { handleSubmit } >
                    <div className="bg-green-50 p-3 rounded mb-4 border border-green-200">
                        < p className ="text-xs font-bold text-green-800 uppercase mb-2">Quem está registrando?</p>
                            <div className ="grid grid-cols-2 gap-2">
                                < Input
    label ="Militar (Nome)" 
    value = { staffName }
    onChange = { e => setStaffName(e.target.value) }
    placeholder ="Sd Fulano"
    required
        />
        <Input
            label="RG (5 dígitos)" 
    value = { staffRg }
    onChange = { e => setStaffRg(e.target.value.replace(/\\D/g, '').slice(0, 5)) }
    placeholder ="12345"
    maxLength = { 5}
    required
        />
          </div >
        </div >

        <Input
            label="Placa / Prefixo" 
    value = { vehicleCode }
    onChange = { e => setVehicleCode(e.target.value.toUpperCase().replace(/\\s/g, '')) }
    onBlur = { handleBlur }
    placeholder ="ABC-1234"
    required
        />
        <Input
            label="Condutor" 
    value = { driver }
    onChange = { e => setDriver(e.target.value) }
    required
        />

        <div className="mb-3">
            < label className ="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                < select
    className ="w-full p-2 border rounded-md border-gray-300"
    value = { destination }
    onChange = { e => setDestination(e.target.value) }
        >
        { DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>) }
          </select >
        </div >

        { destination === 'OUTROS' && (
            <Input
                label="Qual destino?" 
    value = { destinationOther }
    onChange = { e => setDestinationOther(e.target.value) }
    required
    placeholder ="Digite o destino..."
        />
        )
}

{
    error && <p className="text-red-500 mb-3 text-sm">{error}</p>}
        <div className ="flex gap-2">
            < Button variant ="secondary" onClick={() => navigate('/')}>Cancelar</Button>
                < Button type ="submit" variant="primary" loading={loading}>Confirmar Entrada</Button>
        </div >
      </form >
    </div >
  )
}
