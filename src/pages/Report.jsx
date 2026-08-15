import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import { generateReportPDF } from '../lib/pdfGenerator'

export default function Report() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  
  // Paginação
  const [movementsPage, setMovementsPage] = useState(1)
  const MOVEMENTS_PER_PAGE = 15

  useEffect(() => {
    const end = new Date()
    end.setHours(8, 0, 0, 0)
    
    const start = new Date(end)
    start.setDate(end.getDate() - 1)
    
    const formatDateTimeLocal = (d) => {
        const offset = d.getTimezoneOffset()
        const dLocal = new Date(d.getTime() - (offset*60*1000))
        return dLocal.toISOString().slice(0,16)
    }

    setStartDate(formatDateTimeLocal(start))
    setEndDate(formatDateTimeLocal(end))
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    setLoading(true)
    let query = supabase
      .from('movements_report')
      .select('*')
      .order('event_at', { ascending: false })
      .limit(500)

    if (startDate) query = query.gte('event_at', new Date(startDate).toISOString())
    if (endDate) query = query.lte('event_at', new Date(endDate).toISOString())
    if (filterType !== 'ALL') query = query.eq('subject_type', filterType)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching movements:', error)
      alert('Erro ao carregar relatório.')
    }
    setMovements(data || [])
    setLoading(false)
  }

  const exportPDF = () => {
    generateReportPDF(movements, new Date(startDate), new Date(endDate))
  }

  const paginatedMovements = movements.slice((movementsPage - 1) * MOVEMENTS_PER_PAGE, movementsPage * MOVEMENTS_PER_PAGE)
  const totalMovementPages = Math.ceil(movements.length / MOVEMENTS_PER_PAGE)

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
        <h2 className="font-bold text-gray-800 text-lg">📄 Relatório de Serviço</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500">Início</label>
            <input type="datetime-local" className="border p-1 rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Fim</label>
            <input type="datetime-local" className="border p-1 rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Tipo</label>
            <select className="border p-1 rounded" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">Todos</option>
              <option value="VEHICLE">Veículo</option>
              <option value="VTR">VTR Socorro</option>
              <option value="EXTERNAL_VTR">VTR Externa</option>
              <option value="PEDESTRIAN">Pedestre</option>
            </select>
          </div>
          <Button className="!w-auto py-1 px-3" onClick={() => { setMovementsPage(1); fetchMovements(); }}>Filtrar</Button>
        </div>

        <div className="border-t pt-2">
          <Button variant="primary" className="!w-auto" onClick={exportPDF}>Exportar PDF Oficial</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Sistema (Fato)</th>
              <th className="p-3 text-left">Lançamento / Status</th>
              <th className="p-3 text-left">Ação</th>
              <th className="p-3 text-left">Identificação</th>
              <th className="p-3 text-left">Info / Doc</th>
              <th className="p-3 text-left">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && !loading && <tr><td colSpan="6" className="p-4 text-center text-gray-500">Sem registros.</td></tr>}
            {paginatedMovements.map(m => {
            const eventDate = new Date(m.event_at)
            const createdDate = new Date(m.created_at)
            const diffMin = Math.round((createdDate - eventDate) / 60000)
            const isRetroactive = diffMin > 5

            return (
              <tr key={m.id} className={`border-b hover:bg-gray-50 ${isRetroactive ? 'bg-red-50' : ''}`}>
                <td className="p-3">
                  <p className="font-bold text-gray-800">{eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  <p className="text-[10px] text-gray-400">{eventDate.toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="p-3">
                  <p className="text-xs font-bold text-gray-800">{createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  <p className="text-[10px] text-gray-500">{createdDate.toLocaleDateString('pt-BR')}</p>
                  {isRetroactive && (
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded block w-fit">
                      RETROATIVO (+{diffMin}m)
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${m.direction === 'ENTRY' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {m.direction === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                  </span>
                </td>
                <td className="p-3">
                  <p className="font-bold text-xs">{m.subject_code}</p>
                  <p className="text-[9px] text-gray-500">{m.subject_type === 'EXTERNAL_VTR' ? 'VTR EXT' : m.subject_type}</p>
                </td>
                <td className="p-3">
                  <p className="text-xs font-medium">{m.driver_name || m.person_name || '-'}</p>
                  <p className="text-[10px] text-gray-500">Doc: {m.person_doc || '-'}</p>
                  <p className="text-[10px] text-gray-400">Dst: {m.destination}</p>
                </td>
                <td className="p-3 text-[10px]">
                  <p className="font-medium text-gray-600">{m.staff_full_name}</p>
                  <p className="text-[9px] text-gray-400">RG: {m.staff_rg || 'S/RG'}</p>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>

        {totalMovementPages > 1 && (
          <div className="p-3 flex items-center justify-between border-t bg-gray-50">
            <button 
              disabled={movementsPage === 1}
              onClick={() => setMovementsPage(p => p - 1)}
              className="px-3 py-1 bg-white border rounded text-xs disabled:opacity-50 font-bold"
            >
              Anterior
            </button>
            <span className="text-[10px] text-gray-500">Página {movementsPage} de {totalMovementPages}</span>
            <button 
              disabled={movementsPage === totalMovementPages}
              onClick={() => setMovementsPage(p => p + 1)}
              className="px-3 py-1 bg-white border rounded text-xs disabled:opacity-50 font-bold"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
