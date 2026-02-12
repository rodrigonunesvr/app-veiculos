import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

const DESTINATIONS = [
    '7º GBM', 'SOCORRO', 'CSM', 'ESTAFETA', 'ODONTO.', 'CRSI', 'MANUTENÇÃO', 'OUTROS'
]

export default function Exit() {
    const [vehicleCode, setVehicleCode] = useState('')
    const [activeVehicles, setActiveVehicles] = useState([])
    const [driver, setDriver] = useState('') // For manual exit

    // Destination for Exit
    const [destination, setDestination] = useState(DESTINATIONS[0])
    const [destinationOther, setDestinationOther] = useState('')

    const [loading, setLoading] = useState(false)
    const [isManual, setIsManual] = useState(false) // Toggle for manual exit without list
    const navigate = useNavigate()

    useEffect(() => {
        fetchActive()
    }, [])

    const fetchActive = async () => {
        // Determine active from view
        const { data } = await supabase
            .from('active_vehicles')
            .select('*')
            .eq('type', 'ENTRY')
            .order('entry_time', { ascending: false })
        setActiveVehicles(data || [])
    }

    const handleSelect = (vehicle) => {
        setVehicleCode(vehicle.vehicle_code)
        setDriver(vehicle.driver_name)
        setIsManual(true) // Switch to form view
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()

        if (!vehicleCode || !driver) return
        const finalDest = destination === 'OUTROS' ? destinationOther : destination
        if (!finalDest) return alert('Informe o destino')

        setLoading(true)
        try {
            const { error } = await supabase.from('vehicle_movements').insert({
                vehicle_code: vehicleCode,
                driver_name: driver,
                destination: finalDest,
                type: 'EXIT'
            })

            if (error) throw error
            navigate('/')
        } catch (err) {
            alert('Erro ao registrar saída: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filtered = activeVehicles.filter(v => v.vehicle_code.includes(vehicleCode.toUpperCase()))

    if (isManual) {
        return (
            <div className=\"max-w-md mx-auto bg-white p-6 rounded-lg shadow\">
                < h2 className =\"text-xl font-bold mb-4 text-orange-700\">Confirmar Saída</h2>
                    < form onSubmit = { handleSubmit } >
                        <Input
                            label=\"Placa / Prefixo\" 
        value = { vehicleCode }
        onChange = { e => setVehicleCode(e.target.value.toUpperCase()) }
        readOnly
            />
            <Input
                label=\"Condutor\" 
        value = { driver }
        onChange = { e => setDriver(e.target.value) }
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
            />
          )
    }

    <div className=\"flex gap-2 mt-4\">
        < Button variant =\"secondary\" onClick={() => setIsManual(false)}>Voltar</Button>
            < Button type =\"submit\" variant=\"danger\" loading={loading}>Registrar Saída</Button>
          </div >
        </form >
      </div >
    )
}

return (
    <div className=\"max-w-md mx-auto\">
        < h2 className =\"text-xl font-bold mb-4 text-orange-700\">Registrar Saída</h2>

            < div className =\"bg-white p-4 rounded-lg shadow mb-4\">
                < Input
label =\"Buscar Placa\" 
value = { vehicleCode }
onChange = { e => setVehicleCode(e.target.value.toUpperCase()) }
placeholder =\"Digitar...\"
    />
    {/* Support manual exit if not found */ }
    < div className =\"text-right\">
        < button type =\"button\" className=\"text-sm text-blue-600 underline\" onClick={() => { setIsManual(true); setDriver(''); }}>
                Não encontrou ? Registrar Saída Avulsa
             </button >
        </div >
      </div >

    <div className=\"space-y-3\">
{
    filtered.length === 0 && <p className=\"text-center text-gray-500\">Nenhum veículo no pátio.</p>}
    {
        filtered.map(vehicle => (
            <div key={vehicle.id} className=\"bg-white p-4 rounded-lg shadow flex justify-between items-center\">
            < div >
        <p className=\"font-bold text-lg\">{vehicle.vehicle_code}</p>
        < p className =\"text-sm text-gray-600\">{vehicle.driver_name}</p>
        < p className =\"text-xs text-gray-400\">Entrada: {new Date(vehicle.entry_time).toLocaleString('pt-BR')}</p>
            </div >
            <Button
                variant=\"danger\" 
              className =\"!w-auto px-4\" 
              onClick = {() => handleSelect(vehicle)}
            >
        Sair
            </Button >
          </div >
        ))
}
      </div >
    </div >
  )
}
