import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Paginação
  const [usersPage, setUsersPage] = useState(1)
  const USERS_PER_PAGE = 10

  // Edição de Usuário
  const [editingUser, setEditingUser] = useState(null)

  // Catálogo de Viaturas (VTR)
  const [vtrs, setVtrs] = useState([])
  const [newVtrCode, setNewVtrCode] = useState('')
  const [vtrLoading, setVtrLoading] = useState(false)

  useEffect(() => {
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



  const paginatedUsers = users.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE)
  const totalUserPages = Math.ceil(users.length / USERS_PER_PAGE)

  return (
    <div className="space-y-4 pb-20">

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

