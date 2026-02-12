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

  useEffect(() => {
    // Default: Last 7 days
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    setLoading(true)
    let query = supabase
      .from('vehicle_movements')
      .select(`
        *,
        created_by_user:created_by (
          full_name,
          rg5
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (startDate) query = query.gte('created_at', startDate + 'T00:00:00')
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')

    const { data, error } = await query
    if (error) console.error(error)
    setMovements(data || [])
    setLoading(false)
  }

  const exportPDF = () => {
    const doc = new jsPDF()

    doc.text(\"Relatório de Movimentação - Controle de Veículos\", 14, 15)
    doc.setFontSize(10)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 22)

    const tableColumn = [\"Data/Hora\", \"Tipo\", \"Veículo\", \"Condutor\", \"Destino\", \"Registrado Por\"]
    const tableRows = []

    movements.forEach(m => {
      const movementData = [
        new Date(m.created_at).toLocaleString('pt-BR'),
        m.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
        m.vehicle_code,
        m.driver_name,
        m.destination || '-',
        m.created_by_user ? `${m.created_by_user.full_name} (${m.created_by_user.rg5})` : 'Sistema'
      ]
      tableRows.push(movementData)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    })

    doc.save(`relatorio_veiculos_${startDate}_${endDate}.pdf`)
  }

  return (
    <div className=\"space-y-4\">
      < div className =\"flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow\">
        < div className =\"flex gap-2 items-end\">
          < div >
          <label className=\"block text-xs text-gray-500\">Início</label>
            < input type =\"date\" className=\"border p-1 rounded\" value={startDate} onChange={e => setStartDate(e.target.value)} />
           </div >
           <div>
             <label className=\"block text-xs text-gray-500\">Fim</label>
             <input type=\"date\" className=\"border p-1 rounded\" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div >
    <Button className=\"!w-auto py-1\" onClick={fetchMovements}>Filtrar</Button>
        </div >
    <div className=\"flex gap-2\">
      < Button variant =\"primary\" className=\"!w-auto\" onClick={exportPDF}>Exportar PDF</Button>
        </div >
      </div >

    <div className=\"bg-white rounded-lg shadow overflow-x-auto\">
      < table className =\"min-w-full text-sm\">
        < thead className =\"bg-gray-50 border-b\">
          < tr >
          <th className=\"p-3 text-left\">Data</th>
            < th className =\"p-3 text-left\">Tipo</th>
              < th className =\"p-3 text-left\">Veículo</th>
                < th className =\"p-3 text-left\">Condutor</th>
                  < th className =\"p-3 text-left\">Destino</th>
                    < th className =\"p-3 text-left\">Funcionário</th>
            </tr >
          </thead >
    <tbody>
      {loading ? <tr><td colSpan=\"6\" className=\"p-4 text-center\">Carregando...</td></tr> :
  movements.length === 0 ? <tr><td colSpan=\"6\" className=\"p-4 text-center\">Sem registros no período.</td></tr > :
  movements.map(m => (
    <tr key={m.id} className=\"border-b hover:bg-gray-50\">
  < td className =\"p-3\">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
  < td className = {`p-3 font-bold ${m.type === 'ENTRY' ? 'text-green-600' : 'text-orange-600'}`}>
    { m.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA' }
                </td >
  <td className=\"p-3 font-medium\">{m.vehicle_code}</td>
    < td className =\"p-3\">{m.driver_name}</td>
      < td className =\"p-3\">{m.destination || '-'}</td>
        < td className =\"p-3 text-xs text-gray-500\">
{ m.created_by_user?.full_name }<br/>
                  <span className=\"opacity-75\">{m.created_by_user?.rg5}</span>
                </td >
              </tr >
            ))}
          </tbody >
        </table >
      </div >
    </div >
  )
}
