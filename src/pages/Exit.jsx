import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Exit() {
    const [plate, setPlate] = useState('')
    const [activeVehicles, setActiveVehicles] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchActive()
    }, [])

    const fetchActive = async () => {
        const { data } = await supabase
            .from('vehicle_events')
            .select('*')
            .is('exit_at', null)
            .order('entry_at', { ascending: false })
        setActiveVehicles(data || [])
    }

    const handleExit = async (event) => {
        if (!confirm(`Confirmar saída da placa ${event.plate}?`)) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('vehicle_events')
                .update({ exit_at: new Date().toISOString() })
                .eq('id', event.id)

            if (error) throw error
            fetchActive() // refresh list
        } catch (err) {
            alert('Erro ao registrar saída')
        } finally {
            setLoading(false)
        }
    }

    const filtered = activeVehicles.filter(v => v.plate.includes(plate))

    return (
        <div className="max-w-md mx-auto">
            < h2 className ="text-xl font-bold mb-4 text-orange-700">Registrar Saída</h2>

                <div className ="bg-white p-4 rounded-lg shadow mb-4">
                    < Input
    label ="Buscar Placa" 
    value = { plate }
    onChange = { e => setPlate(e.target.value.toUpperCase()) }
    placeholder ="ABC1234"
        />
      </div >

        <div className="space-y-3">
    {
        filtered.length === 0 && <p className="text-center text-gray-500">Nenhum veículo encontrado.</p>}
        {
            filtered.map(vehicle => (
                <div key={vehicle.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div >
            <p className="font-bold text-lg">{vehicle.plate}</p>
            < p className ="text-sm text-gray-600">{vehicle.driver_name}</p>
            < p className ="text-xs text-gray-400">Entrada: {new Date(vehicle.entry_at).toLocaleString('pt-BR')}</p>
            </div >
                <Button
                    variant="danger" 
              className ="!w-auto px-4" 
              onClick = {() => handleExit(vehicle)}
        loading = { loading }
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
