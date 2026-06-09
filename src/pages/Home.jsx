import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'

const TYPE_LABELS = {
  VEHICLE: 'Veículo',
  VTR: 'Viatura',
  EXTERNAL_VTR: 'VTR Externa',
  PEDESTRIAN: 'Pedestre',
}

const TYPE_COLORS = {
  VEHICLE: 'bg-blue-100 text-blue-800',
  VTR: 'bg-red-100 text-red-800',
  EXTERNAL_VTR: 'bg-purple-100 text-purple-800',
  PEDESTRIAN: 'bg-yellow-100 text-yellow-800',
}

export default function Home() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inside_subjects')
      .select('*')
      .order('event_at', { ascending: false })
      .limit(15)

    setList(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Botões de Ação */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/entry')}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
        >
          <LogIn size={32} />
          <span className="font-bold">Entrada</span>
        </button>

        <button
          onClick={() => navigate('/exit')}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
        >
          <LogOut size={32} className="rotate-180" />
          <span className="font-bold">Saída</span>
        </button>
      </div>

      {/* Lista: No Pátio Agora */}
      <div className="bg-white rounded-lg shadow min-h-[300px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-sm">
              🏁 No Pátio Agora
            </h2>
            <p className="text-[10px] text-gray-400">
              {loading ? 'Carregando...' : `${list.length} registro(s)`}
            </p>
          </div>
          <button
            onClick={fetchList}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-2 space-y-2">
          {!loading && list.length === 0 && (
            <p className="text-center text-gray-400 p-8 text-sm">Pátio vazio.</p>
          )}

          {list.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div>
                <p className="font-bold text-gray-800 text-sm">{item.subject_code}</p>
                {(item.driver_name || item.person_name) && (
                  <p className="text-xs text-gray-500">
                    {item.driver_name || item.person_name}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">
                  Entrou: {new Date(item.event_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {new Date(item.event_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${TYPE_COLORS[item.subject_type] || 'bg-gray-100 text-gray-700'}`}>
                  {TYPE_LABELS[item.subject_type] || item.subject_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
