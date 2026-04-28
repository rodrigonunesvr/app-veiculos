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

export default function Entry() {
    const { profile } = useAuth()
    const navigate = useNavigate()

    const [type, setType] = useState('VEHICLE')
    const [data, setData] = useState({
        code: '',
        driver: '',
        destination: DESTINATIONS[0],
        destOther: '',
        rg: ''
    })

    // VTR Multi-Select Support
    const [vtrList, setVtrList] = useState([])
    const [selectedVtrs, setSelectedVtrs] = useState([]) // Array of strings

    const [confirming, setConfirming] = useState(false)
    const [loading, setLoading] = useState(false)

    // Default to local time for datetime-local input
    const getLocalNow = () => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    }
    const [eventAt, setEventAt] = useState(getLocalNow())
    const [customVtr, setCustomVtr] = useState('')

    useEffect(() => {
        supabase.from('vtr_catalog').select('code').then(({ data }) => setVtrList(data || []))
    }, [])

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }))

    const handleBlur = async () => {
        if (type === 'VEHICLE' && data.code.length > 3) {
            const { data: log } = await supabase.from('movements')
                .select('driver_name')
                .eq('subject_code', data.code)
                .eq('subject_type', 'VEHICLE')
                .limit(1)
                .order('event_at', { ascending: false })
                .maybeSingle()
            if (log?.driver_name) handleChange('driver', log.driver_name)
        }
    }

    const toggleVtr = (code) => {
        setSelectedVtrs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
    }

    const validate = () => {
        if (type === 'VTR') {
            if (selectedVtrs.length === 0) return 'Selecione pelo menos uma viatura.'
        } else if (type === 'EXTERNAL_VTR') {
            if (!data.code) return 'Prefixo da viatura obrigatório.'
            if (!data.driver) return 'Nome do condutor obrigatório.'
            if (!data.rg) return 'RG do condutor obrigatório.'
        } else {
            if (!data.code) return 'Preencha a identificação.'
        }

        if (type === 'VEHICLE' && !data.driver) return 'Nome do condutor obrigatório.'
        if (type === 'PEDESTRIAN' && !data.driver) return 'Nome do pedestre obrigatório.'
        if (data.destination === 'OUTROS' && !data.destOther) return 'Informe o destino.'
        return null
    }

    const handlePreSubmit = (e) => {
        e.preventDefault()
        const err = validate()
        if (err) return alert(err)
        setConfirming(true)
    }

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const finalDest = data.destination === 'OUTROS' ? data.destOther : data.destination

            const payloadBase = {
                direction: 'ENTRY',
                subject_type: type,
                destination: finalDest,
                event_at: new Date(eventAt).toISOString(),
                created_by: profile?.id // Optional, default is auth.uid()
            }

            if (type === 'VTR') {
                // Insert multiple rows
                const rows = selectedVtrs.map(vtrCode => ({
                    ...payloadBase,
                    subject_code: vtrCode,
                }))
                const { error } = await supabase.from('movements').insert(rows)
                if (error) throw error
            } else {
                // Single Entry
                const payload = {
                    ...payloadBase,
                    subject_code: data.code,
                    driver_name: (type === 'VEHICLE' || type === 'EXTERNAL_VTR') ? data.driver : null,
                    person_name: type === 'PEDESTRIAN' ? data.driver : null,
                    person_doc: (type === 'PEDESTRIAN') ? data.code : (data.rg || null),
                }
                const { error } = await supabase.from('movements').insert(payload)
                if (error) throw error
            }

            navigate('/')
        } catch (err) {
            alert('Erro: ' + err.message)
            setConfirming(false)
        } finally {
            setLoading(false)
        }
    }

    // Summary String for Confirmation Modal
    const getSummaryCode = () => {
        if (type === 'VTR') return selectedVtrs.join(', ')
        return data.code
    }

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow pb-24">
            < h2 className ="text-xl font-bold mb-4 text-green-700">Registrar Entrada</h2>

                < TypeSelector value = { type } onChange = {(t) => {
        setType(t);
        setData(d => ({ ...d, code: '', driver: '' }));
        setSelectedVtrs([]);
    }
} />

    < form onSubmit = { handlePreSubmit } >
        {/* VEHICLE */ }
{
    type === 'VEHICLE' && (
        <>
            <Input
                label="Placa"
            value={data.code}
            onChange={e => handleChange('code', e.target.value.toUpperCase().replace(/\\s/g, ''))}
            onBlur={handleBlur}
            placeholder="ABC-1234"
            />
            <Input
                label="Condutor"
            value={data.driver}
            onChange={e => handleChange('driver', e.target.value)} 
            />
            <Input
                label="Documento (RG/CPF)"
                value={data.rg}
                onChange={e => handleChange('rg', e.target.value)}
            />
        </>
    )
}

{/* VTR MULTI-SELECT */ }
{
    type === 'VTR' && (
        <div className="mb-3">
            < label className ="block text-sm font-medium text-gray-700 mb-2">Selecionar Viaturas ({selectedVtrs.length})</label>
                < div className ="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded bg-gray-50">
    {
        vtrList.map(v => (
            <div
                key={v.code}
                onClick={() => toggleVtr(v.code)}
                className={`p-2 rounded text-sm cursor-pointer border text-center transition-colors font-bold
                      ${selectedVtrs.includes(v.code)
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
            >
                {v.code}
            </div>
        ))
    }
            </div >
          </div >
        )
}

{
    type === 'EXTERNAL_VTR' && (
        <>
            <Input
                label="Prefixo da Viatura"
                value={data.code}
                onChange={e => handleChange('code', e.target.value.toUpperCase())}
                placeholder="Ex: ABT-123"
            />
            <Input
                label="Nome do Condutor"
                value={data.driver}
                onChange={e => handleChange('driver', e.target.value)}
            />
            <Input
                label="Documento (RG/CPF)"
                value={data.rg}
                onChange={e => handleChange('rg', e.target.value)}
            />
        </>
    )
}

{/* PEDESTRIAN */ }
{
    type === 'PEDESTRIAN' && (
        <>
            <Input
                label="Nome Completo"
            value={data.driver}
            onChange={e => handleChange('driver', e.target.value)} 
            />
            <Input
                label="Documento (RG/CPF)"
            value={data.code}
            onChange={e => handleChange('code', e.target.value)} 
            />
        </>
    )
}

{/* DESTINATION */ }
<div className="mb-3">
    < label className ="block text-sm font-medium text-gray-700 mb-1">Destino</label>
        < select
className ="w-full p-2 border rounded-md"
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

<Input
    label="Horário do Sistema (Fato)"
    type="datetime-local"
    value={eventAt}
    onChange={e => setEventAt(e.target.value)}
/>

    < Button type ="submit" variant="primary" className="mt-4">Continuar</Button>
      </form >

    <ConfirmationModal
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        loading={loading}
        data={{
            type: 'ENTRY',
            subject_type: type,
            subject_code: getSummaryCode(),
            driver_name: data.driver,
            destination: data.destination === 'OUTROS' ? data.destOther : data.destination,
            staff_name: profile?.full_name,
            event_at: eventAt,
            rg: data.rg
        }}
    />
    </div >
  )
}

