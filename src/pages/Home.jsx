import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogIn, LogOut, Car, Filter } from 'lucide-react'

export default function Home() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('inside') // inside | outside
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchList()
    }, [tab])

    const fetchList = async () => {
        setLoading(true)
        const viewName = tab === 'inside' ? 'inside_subjects' : 'outside_subjects'

        const { data } = await supabase
            .from(viewName)
            .select('*')
            .order('event_at', { ascending: false })
            .limit(50)

        setList(data || [])
        setLoading(false)
    }

    return (
        <div className="space-y-4">
    {/* Big Actions */ }
    <div className="grid grid-cols-2 gap-4">
        < button
    onClick = {() => navigate('/entry')
}
className ="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
    >
          <LogIn size={32} />
          <span className="font-bold">Entrada</span>
        </button >

    <button
        onClick={() => navigate('/exit')}
        className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            >
            <LogOut size={32} className="rotate-180" />
                < span className ="font-bold">Saída</span>
        </button >
      </div >

    {/* Lists */ }
    <div className ="bg-white rounded-lg shadow min-h-[300px]">
        <div className ="flex border-b">
            < button
className = {`flex-1 p-3 font-medium text-sm ${tab === 'inside' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
onClick = {() => setTab('inside')}
          >
    No Pátio({ tab === 'inside' ? list.length : '...'})
          </button >
    <button
        className={`flex-1 p-3 font-medium text-sm ${tab === 'outside' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        onClick={() => setTab('outside')}
    >
        Estiveram Aqui
    </button>
        </div >

    <div className="p-2 space-y-2">
{
    loading && <p className="text-center text-gray-400 p-4">Carregando...</p>}
    {
        !loading && list.length === 0 && <p className="text-center text-gray-400 p-4">Lista vazia.</p>}

        {
            list.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div >
            <p className="font-bold text-gray-800">{item.subject_code}</p>
            < p className ="text-xs text-gray-500">
                  { item.subject_type } • { new Date(item.event_at).toLocaleTimeString().slice(0, 5) }
                </p >
              </div >
                <div className="text-right">
            < span className = {`text-xs font-bold px-2 py-1 rounded ${item.direction === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                { item.direction === 'ENTRY' ? 'DENTRO' : 'SAIU' }
                </span >
              </div >
            </div >
          ))
    }
        </div >
      </div >
    </div >
  )
}
