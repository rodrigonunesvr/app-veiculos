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

    // State
    const [type, setType] = useState('VEHICLE') // VEHICLE | VTR | PEDESTRIAN
    const [data, setData] = useState({
        code: '', // Placa, VTR Code, or Person Doc
        driver: '', // Driver (Vehicle) or Person Name (Pedestrian)
        destination: DESTINATIONS[0],
        destOther: ''
    })

    // VTR Catalog
    const [vtrList, setVtrList] = useState([])

    // UI
    const [confirming, setConfirming] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase.from('vtr_catalog').select('code').then(({ data }) => setVtrList(data || []))
    }, [])

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }))

    // Auto-complete driver for Vehicle only
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

    const validate = () => {
        if (!data.code) return 'Preencha a identificação (Placa/VTR/Doc).'
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

            const payload = {
                direction: 'ENTRY',
                subject_type: type,
                subject_code: data.code,
                destination: finalDest,
                // Map fields based on type
                driver_name: type === 'VEHICLE' ? data.driver : null,
                person_name: type === 'PEDESTRIAN' ? data.driver : null, // Reusing driver field for name in UI state
                person_doc: type === 'PEDESTRIAN' ? data.code : null, // Code is Doc for Pedestrian
            }

            // If Pedestrian, subject_code usually implies ID. Let's strictly follow schema:
            // Schema: subject_code text. 
            // For Pedestrian: subject_code = DOC is good practice for uniqueness in views.

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

    return (
        <div className=\"max-w-md mx-auto bg-white p-6 rounded-lg shadow pb-24\">
            < h2 className =\"text-xl font-bold mb-4 text-green-700\">Registrar Entrada</h2>

                < TypeSelector value = { type } onChange = {(t) => { setType(t); setData(d => ({ ...d, code: '', driver: '' })) }
} />

    < form onSubmit = { handlePreSubmit } >
        {/* VEHICLE INPUTS */ }
{
    type === 'VEHICLE' && (
        <>
            <Input
                label=\"Placa\"
            value={data.code}
            onChange={e => handleChange('code', e.target.value.toUpperCase().replace(/\\s/g, ''))}
            onBlur={handleBlur}
            placeholder=\"ABC-1234\"
            />
            <Input
                label=\"Condutor\"
            value={data.driver}
            onChange={e => handleChange('driver', e.target.value)} 
            />
        </>
    )
}

{/* VTR INPUTS */ }
{
    type === 'VTR' && (
        <div className=\"mb-3\">
            < label className =\"block text-sm font-medium text-gray-700 mb-1\">Selecione a Viatura</label>
                < select
    className =\"w-full p-2 border rounded-md\"
    value = { data.code }
    onChange = { e => handleChange('code', e.target.value) }
        >
        <option value=\"\">-- Selecione --</option>
    { vtrList.map(v => <option key={v.code} value={v.code}>{v.code}</option>) }
            </select >
          </div >
        )
}

{/* PEDESTRIAN INPUTS */ }
{
    type === 'PEDESTRIAN' && (
        <>
            <Input
                label=\"Nome Completo\"
            value={data.driver} // storing name in driver state
            onChange={e => handleChange('driver', e.target.value)} 
            />
            <Input
                label=\"Documento (RG/CPF)\"
            value={data.code}
            onChange={e => handleChange('code', e.target.value)} 
            />
        </>
    )
}

{/* DESTINATION (ALL) */ }
<div className=\"mb-3\">
    < label className =\"block text-sm font-medium text-gray-700 mb-1\">Destino</label>
        < select
className =\"w-full p-2 border rounded-md\"
value = { data.destination }
onChange = { e => handleChange('destination', e.target.value) }
    >
    { DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>) }
          </select >
        </div >
{
    data.destination === 'OUTROS' && (
        <Input
            label=\"Qual destino?\" 
            value = { data.destOther } 
            onChange={ e => handleChange('destOther', e.target.value) }
    />
        )
}

    < Button type =\"submit\" variant=\"primary\" className=\"mt-4\">Continuar</Button>
      </form >

    <ConfirmationModal
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        loading={loading}
        data={{
            type: 'ENTRY',
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
