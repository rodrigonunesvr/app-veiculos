import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Admin() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    setLoading(true)
    // v3.2: Use view 'movements_report' instead of join
    let query = supabase
      .from('movements_report')
      .select('*')
      .order('event_at', { ascending: false })
      .limit(500)

    if (startDate) query = query.gte('event_at', startDate + 'T00:00:00')
    if (endDate) query = query.lte('event_at', endDate + 'T23:59:59')
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
    const doc = new jsPDF('l', 'mm', 'a4') // Mudando para Paisagem (Landscape) para caber tudo
    doc.setFontSize(14)
    doc.text("RELATÓRIO DE AUDITORIA - CONTROLE DE ACESSO (V5)", 14, 15)
    doc.setFontSize(10)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 22)

    const tableColumn = ["Ocorrência", "Sistema", "Ação", "Tipo", "ID", "Condutor/Doc", "Destino", "Responsável", "Status"]
    const tableRows = []

    movements.forEach(m => {
      const staff = m.staff_full_name ? `${m.staff_full_name} (${m.staff_rg || 'S/RG'})` : 'Sistema'
      const eventDate = new Date(m.event_at)
      const createdDate = new Date(m.created_at)
      const diffMin = Math.round((createdDate - eventDate) / 60000)
      const statusText = diffMin > 5 ? `RETRO (+${diffMin}m)` : "OK"

      const row = [
        eventDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        createdDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        m.direction === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
        m.subject_type === 'EXTERNAL_VTR' ? 'VTR EXT' : m.subject_type,
        m.subject_code,
        `${m.driver_name || m.person_name || '-'} / ${m.person_doc || '-'}`,
        m.destination || '-',
        staff,
        statusText
      ]
      tableRows.push(row)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 32 }, // Ocorrência
        1: { cellWidth: 20 }, // Sistema
        8: { cellWidth: 30 }  // Status
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          if (data.cell.raw !== "OK") {
            data.cell.styles.textColor = [200, 0, 0]; // Red
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    })

    doc.save(`relatorio_${startDate}.pdf`)
  }

  return (
    <div className="space-y-4 pb-20">
      < div className ="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
        < div className ="flex flex-wrap gap-2 items-end">
          < div >
          <label className="block text-xs text-gray-500">Início</label>
            < input type ="date" className="border p-1 rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
           </div >
           <div>
             <label className="block text-xs text-gray-500">Fim</label>
             <input type="date" className="border p-1 rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div >
           <div>
             <label className="block text-xs text-gray-500">Tipo</label>
             <select className="border p-1 rounded" value={filterType} onChange={e => setFilterType(e.target.value)}>
        <option value="ALL">Todos</option>
        <option value="VEHICLE">Veículo</option>
        <option value="VTR">Viatura</option>
        <option value="EXTERNAL_VTR">VTR Externa</option>
        <option value="PEDESTRIAN">Pedestre</option>
             </select >
           </div >
    <Button className="!w-auto py-1 px-3" onClick={fetchMovements}>Filtrar</Button>
        </div >

    <div className="border-t pt-2">
      < Button variant ="primary" className="!w-auto" onClick={exportPDF}>Exportar PDF Oficial</Button>
        </div >
      </div >

    <div className="bg-white rounded-lg shadow overflow-x-auto">
      < table className ="min-w-full text-sm">
        < thead className ="bg-gray-50 border-b">
          <tr>
            <th className="p-3 text-left">Ocorrência</th>
            <th className="p-3 text-left">Registro / Status</th>
            <th className="p-3 text-left">Ação</th>
            <th className="p-3 text-left">Identificação</th>
            <th className="p-3 text-left">Info / Doc</th>
            <th className="p-3 text-left">Responsável</th>
          </tr>
          </thead >
    <tbody>
      {movements.length === 0 && !loading && <tr><td colSpan="5" className="p-4 text-center text-gray-500">Sem registros.</td></tr>
}
          {movements.map(m => {
            const eventDate = new Date(m.event_at)
            const createdDate = new Date(m.created_at)
            const diffMin = Math.round((createdDate - eventDate) / 60000)
            const isRetroactive = diffMin > 5

            return (
              <tr key={m.id} className={`border-b hover:bg-gray-50 ${isRetroactive ? 'bg-red-50' : ''}`}>
                <td className="p-3">
                  <p className="font-bold text-gray-800">{eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-gray-400">{eventDate.toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="p-3">
                  <p className={`text-xs ${isRetroactive ? 'text-red-600 font-bold' : ''}`}>{createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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
          </tbody >
        </table >
      </div >
    </div >
  )
}

