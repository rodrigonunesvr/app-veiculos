import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import TypeSelector from '../components/TypeSelector'
import ConfirmationModal from '../components/ConfirmationModal'

const DESTINATIONS = [
    '7º GBM', 'SOCORRO', 'CSM', 'ESTAFETA', 'ODONTO.', 'CRSI', 'MANUTENÇÃO', 'OUTROS'
]

export default function Exit() {
    const { profile } = useAuth()
    const navigate = useNavigate()

    const [type, setType] = useState('VEHICLE')
    const [data, setData] = useState({
        code: '',
        driver: '',
        destination: DESTINATIONS[0],
        destOther: ''
    })

    const [insideList, setInsideList] = useState([])
    const [search, setSearch] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchInside()
    }, [])

    const fetchInside = async () => {
        const { data } = await supabase.from('inside_subjects').select('*')
        setInsideList(data || [])
    }

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }))

    const handleSelectFromList = (item) => {
        // Auto-fill form and switch type
        setType(item.subject_type)
        setData({
            code: item.subject_code,
            driver: item.driver_name || item.person_name || '',
            destination: DESTINATIONS[0],
            destOther: ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handlePreSubmit = (e) => {
        e.preventDefault()
        if (!data.code) return alert('Identificação obrigatória.')
        setConfirming(true)
    }

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const finalDest = data.destination === 'OUTROS' ? data.destOther : data.destination

            const payload = {
                direction: 'EXIT',
                subject_type: type,
                subject_code: data.code,
                destination: finalDest,
                driver_name: type === 'VEHICLE' ? data.driver : null,
                person_name: type === 'PEDESTRIAN' ? data.driver : null,
                person_doc: type === 'PEDESTRIAN' ? data.code : null,
            }

            const { error } = await supabase.from('movements').insert(payload)
            if (error) throw error

            navigate('/')
        } catch (err) {
            alert('Erro: ' + err.message)
            setConfirming(false)
        } finally {
            setLoading(false)
        }
    }

    const filteredList = insideList.filter(i =>
        i.subject_code.includes(search.toUpperCase()) ||
        (i.driver_name && i.driver_name.toUpperCase().includes(search.toUpperCase()))
    )

    return (
        <div className="max-w-md mx-auto pb-24">
            <div className ="bg-white p-6 rounded-lg shadow mb-6">
                < h2 className ="text-xl font-bold mb-4 text-orange-700">Registrar Saída</h2>

                    < TypeSelector value = { type } onChange = { setType } />
        
        <form onSubmit={handlePreSubmit}>
          <Input 
             label={type === 'VTR' ? 'Código Viatura' : type === 'PEDESTRIAN' ? 'Documento' : 'Placa'}
             value={data.code} 
             onChange={e => handleChange('code', e.target.value.toUpperCase())}
             placeholder={type === 'VEHICLE' ? 'ABC-1234' : ''}
          />
           <Input 
             label={type === 'PEDESTRIAN' ? 'Nome' : 'Condutor'}
             value={data.driver}
             onChange={e => handleChange('driver', e.target.value)}
          />
           
           {/* Destination on Exit too per requirements */}
           <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
            <select 
              className="w-full p-2 border rounded-md"
    value = { data.destination }
    onChange = { e => handleChange('destination', e.target.value) }
        >
        { DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>) }
            </select >
          </div >
    {
        data.destination === 'OUTROS' && (
            <Input
                label="Qual destino?" 
              value = { data.destOther } 
              onChange={ e => handleChange('destOther', e.target.value) }
        />
          )
    }

        < Button type ="submit" variant="danger" className="mt-2">Registrar Saída</Button>
        </form >
      </div >

        {/* List for Quick Selection */ }
        <div className ="bg-white p-4 rounded-lg shadow">
            < h3 className ="font-bold mb-2 text-gray-700 text-sm uppercase">Selecionar de quem está DENTRO</h3>
                < Input
    placeholder ="Buscar..." 
    value = { search }
    onChange = { e => setSearch(e.target.value) }
    className ="mb-2"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
    {
        filteredList.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectFromList(item)}>
            <div >
        <p className="font-bold">{item.subject_code}</p>
        < p className ="text-xs text-gray-500">{item.subject_type}</p>
               </div >
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Selecionar</span>
            </div >
          ))
    }
    {
        filteredList.length === 0 && <p className="text-center text-gray-400 text-sm">Nenhum registro encontrado.</p>}
        </div >
      </div >

            <ConfirmationModal
                show={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={handleConfirm}
                loading={loading}
                data={{
                    type: 'EXIT',
                    subject_type: type,
                    subject_code: data.code,
                    driver_name: data.driver,
                    destination: data.destination === 'OUTROS' ? data.destOther : data.destination,
                    staff_name: profile?.full_name + ' (' + profile?.rg5 + ')'
                }}
            />
    </div >
  )
    }
