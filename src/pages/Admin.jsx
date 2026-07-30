import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Admin() {
  const [movements, setMovements] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  
  // Paginação
  const [movementsPage, setMovementsPage] = useState(1)
  const MOVEMENTS_PER_PAGE = 10
  const [usersPage, setUsersPage] = useState(1)
  const USERS_PER_PAGE = 10

  // Edição de Usuário
  const [editingUser, setEditingUser] = useState(null)

  // Catálogo de Viaturas (VTR)
  const [vtrs, setVtrs] = useState([])
  const [newVtrCode, setNewVtrCode] = useState('')
  const [vtrLoading, setVtrLoading] = useState(false)

  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    fetchMovements()
    fetchUsers()
    fetchVtrs()
  }, [])

  const fetchVtrs = async () => {
    const { data } = await supabase.from('vtr_catalog').select('code').order('code')
    setVtrs(data || [])
  }

  const handleAddVtr = async (e) => {
    e.preventDefault()
    const code = newVtrCode.trim().toUpperCase()
    if (!code) return
    setVtrLoading(true)
    try {
      const { error } = await supabase.from('vtr_catalog').insert({ code })
      if (error) throw error
      setNewVtrCode('')
      await fetchVtrs()
    } catch (err) {
      alert('Erro ao adicionar viatura: ' + err.message)
    } finally {
      setVtrLoading(false)
    }
  }

  const handleDeleteVtr = async (code) => {
    if (!window.confirm(`Remover a viatura "${code}" do catálogo?`)) return
    setVtrLoading(true)
    try {
      const { error } = await supabase.from('vtr_catalog').delete().eq('code', code)
      if (error) throw error
      await fetchVtrs()
    } catch (err) {
      alert('Erro ao remover viatura: ' + err.message)
    } finally {
      setVtrLoading(false)
    }
  }

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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    
    if (error) {
      console.error('Erro na busca de usuários:', error)
      alert(`Erro BD: ${error.code} - ${error.message}`)
    }
    
    if (data) {
      console.log('Usuários brutos recebidos:', data)
    }
    
    setUsers(data || [])
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          rg5: editingUser.rg5,
          is_admin: editingUser.is_admin
        })
        .eq('id', editingUser.id)

      if (error) throw error
      alert('Usuário atualizado com sucesso!')
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4') // Mudando para Paisagem (Landscape) para caber tudo
    doc.setFontSize(14)
    doc.text("RELATÓRIO DE AUDITORIA - CONTROLE DE ACESSO (V5)", 14, 15)
    doc.setFontSize(10)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 22)

    const tableColumn = ["Sistema (Fato)", "Lançamento", "Ação", "Tipo", "ID", "Condutor/Doc", "Destino", "Responsável", "Status"]
    const tableRows = []

    movements.forEach(m => {
      const staff = m.staff_full_name ? `${m.staff_full_name} (${m.staff_rg || 'S/RG'})` : 'Sistema'
      const eventDate = new Date(m.event_at)
      const createdDate = new Date(m.created_at)
      const diffMin = Math.round((createdDate - eventDate) / 60000)
      const statusText = diffMin > 5 ? `RETRO (+${diffMin}m)` : "OK"

      const row = [
        eventDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' }),
        createdDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' }),
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

  const paginatedMovements = movements.slice((movementsPage - 1) * MOVEMENTS_PER_PAGE, movementsPage * MOVEMENTS_PER_PAGE)
  const totalMovementPages = Math.ceil(movements.length / MOVEMENTS_PER_PAGE)

  const paginatedUsers = users.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE)
  const totalUserPages = Math.ceil(users.length / USERS_PER_PAGE)

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500">Início</label>
            <input type="date" className="border p-1 rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Fim</label>
            <input type="date" className="border p-1 rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
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

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            👥 Gestão de Equipe & Suporte
          </h3>
          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">
            DEBUG: {users.length} usuários
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Funcionários Cadastrados</h4>
            <div className="border rounded divide-y overflow-hidden">
              {users.length === 0 && <p className="p-4 text-center text-xs text-gray-400">Nenhum funcionário encontrado.</p>}
              {paginatedUsers.map((u, i) => (
                <div key={i} className="p-2 flex justify-between items-center text-sm hover:bg-gray-50">
                  <div className="flex-grow">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-[10px] text-gray-500">{u.email} • RG: {u.rg5}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.is_admin && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">ADM</span>}
                    <button 
                      onClick={() => setEditingUser(u)}
                      className="text-blue-600 hover:text-blue-800 text-[10px] font-bold"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <button 
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage(p => p - 1)}
                  className="px-2 py-1 bg-gray-100 border rounded text-[10px] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-[10px] text-gray-500">{usersPage} / {totalUserPages}</span>
                <button 
                  disabled={usersPage === totalUserPages}
                  onClick={() => setUsersPage(p => p + 1)}
                  className="px-2 py-1 bg-gray-100 border rounded text-[10px] disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3 font-sans">
            <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1">
              🔑 Redefinição de Senha
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Como as senhas são protegidas, você deve redefini-las manualmente no painel principal:
            </p>
            <ol className="text-xs text-amber-900 list-decimal ml-4 space-y-1">
              <li>Acesse o <strong>Supabase Dashboard</strong>.</li>
              <li>Vá em <strong>Authentication</strong> → <strong>Users</strong>.</li>
              <li>Busque o e-mail do funcionário.</li>
              <li>Clique em <strong>Actions</strong> → <strong>Change Password</strong>.</li>
              <li>Informe a nova senha e envie para o funcionário.</li>
            </ol>
            <a 
              href="https://supabase.com/dashboard/project/_/auth/users" 
              target="_blank" 
              className="inline-block mt-2 text-xs font-bold text-amber-700 underline"
            >
              Ir para o Painel de Usuários →
            </a>
          </div>
        </div>
      </div>

      {/* ===== GESTÃO DE VIATURAS (VTR) ===== */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            🚒 Catálogo de VTR Socorro
          </h3>
          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">
            {vtrs.length} viatura(s)
          </span>
        </div>

        {/* Formulário de adição */}
        <form onSubmit={handleAddVtr} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: AR-363, VL-101(CMDT)"
            className="flex-1 p-2 border rounded text-sm uppercase"
            value={newVtrCode}
            onChange={e => setNewVtrCode(e.target.value)}
            disabled={vtrLoading}
          />
          <button
            type="submit"
            disabled={vtrLoading || !newVtrCode.trim()}
            className="px-4 py-2 bg-red-700 text-white text-sm font-bold rounded hover:bg-red-800 disabled:opacity-50"
          >
            + Adicionar
          </button>
        </form>

        {/* Lista de viaturas */}
        <div className="border rounded divide-y overflow-hidden max-h-72 overflow-y-auto">
          {vtrs.length === 0 && (
            <p className="p-4 text-center text-xs text-gray-400">Nenhuma viatura cadastrada.</p>
          )}
          {vtrs.map(v => (
            <div key={v.code} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
              <span className="font-bold text-sm text-gray-800 font-mono">{v.code}</span>
              <button
                onClick={() => handleDeleteVtr(v.code)}
                disabled={vtrLoading}
                className="text-red-500 hover:text-red-700 text-xs font-bold disabled:opacity-40"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-400 italic">
          * As alterações são salvas imediatamente e refletem em todas as telas de entrada/saída.
        </p>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-4">Editar Funcionário</h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-sm"
                  value={editingUser.full_name}
                  onChange={e => setEditingUser({...editingUser, full_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">E-mail (Apenas Leitura)</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-dashed">{editingUser.email}</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">RG</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-sm"
                  value={editingUser.rg5}
                  onChange={e => setEditingUser({...editingUser, rg5: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="isAdminMode"
                  checked={editingUser.is_admin}
                  onChange={e => setEditingUser({...editingUser, is_admin: e.target.checked})}
                />
                <label htmlFor="isAdminMode" className="text-sm font-medium text-gray-700">Privilégios de Administrador</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <Button type="submit" loading={loading} className="flex-1">
                  Salvar
                </Button>
              </div>
              <p className="text-[9px] text-gray-400 text-center italic mt-2">
                * O e-mail não pode ser alterado por ser o identificador de login.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

