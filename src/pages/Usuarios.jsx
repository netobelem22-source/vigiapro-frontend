import { useState, useEffect } from 'react'
import api from '../services/api'

const roleLabel = { GESTOR: 'Gestor', GERENTE: 'Gerente', VIGIA: 'Vigilante', TERCEIRO: 'Terceiro' }
const roleBadge = {
  GESTOR:   { bg: '#EEEDFE', color: '#26215C' },
  GERENTE:  { bg: '#E6F1FB', color: '#185FA5' },
  VIGIA:    { bg: '#E8F5F1', color: '#085041' },
  TERCEIRO: { bg: '#FDF0E3', color: '#8A4B10' },
}

const Modal = ({ usuario, onClose, onSaved }) => {
  const [form, setForm] = useState(usuario || { nome: '', email: '', senha: '', role: 'VIGIA', telefone: '', unidadeId: '', ativo: true })
  const [unidades, setUnidades] = useState([])
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState(new Set())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/unidades?limit=1000').then(r => setUnidades(r.data.unidades || [])).catch(() => {})
    if (usuario?.id && usuario.role === 'TERCEIRO') {
      api.get(`/usuarios/${usuario.id}/unidades`).then(r => setUnidadesSelecionadas(new Set(r.data.map(u => u.id)))).catch(() => {})
    }
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleUnidade = (id) => setUnidadesSelecionadas(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const sincronizarUnidadesTerceiro = async (usuarioId) => {
    const atuais = usuario?.id ? new Set((await api.get(`/usuarios/${usuarioId}/unidades`)).data.map(u => u.id)) : new Set()
    const adicionar = [...unidadesSelecionadas].filter(id => !atuais.has(id))
    const remover = [...atuais].filter(id => !unidadesSelecionadas.has(id))
    await Promise.all([
      ...adicionar.map(unidadeId => api.post(`/usuarios/${usuarioId}/unidades`, { unidadeId })),
      ...remover.map(unidadeId => api.delete(`/usuarios/${usuarioId}/unidades/${unidadeId}`))
    ])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const data = { ...form, unidadeId: form.role === 'TERCEIRO' ? null : (form.unidadeId || null) }
      if (!data.senha) delete data.senha
      let usuarioId = usuario?.id
      if (usuarioId) await api.put(`/usuarios/${usuarioId}`, data)
      else usuarioId = (await api.post('/usuarios', data)).data.id
      if (form.role === 'TERCEIRO') await sincronizarUnidadesTerceiro(usuarioId)
      onSaved()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const inp = (label, campo, tipo = 'text', props = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{label}</label>
      <input type={tipo} value={form[campo] ?? ''} onChange={e => set(campo, e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} {...props} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{usuario?.id ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>{inp('Nome completo', 'nome', 'text', { required: true })}</div>
            {inp('Email', 'email', 'email', { required: true })}
            {inp('Telefone', 'telefone', 'tel', { placeholder: '(48) 99999-0000' })}
            {inp(usuario?.id ? 'Nova senha (deixe em branco para manter)' : 'Senha', 'senha', 'password', { required: !usuario?.id })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Perfil</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                <option value="VIGIA">Vigilante</option>
                <option value="GERENTE">Gerente</option>
                <option value="GESTOR">Gestor</option>
                <option value="TERCEIRO">Terceiro (acesso limitado)</option>
              </select>
            </div>
            {form.role !== 'TERCEIRO' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Unidade</label>
                <select value={form.unidadeId || ''} onChange={e => set('unidadeId', e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                  <option value="">Sem unidade</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.cidade}</option>)}
                </select>
              </div>
            )}
          </div>
          {form.role === 'TERCEIRO' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Unidades que este terceiro pode atender</label>
              <div style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
                {unidades.length === 0 && <div style={{ fontSize: 12, color: '#999' }}>Nenhuma unidade cadastrada.</div>}
                {unidades.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={unidadesSelecionadas.has(u.id)} onChange={() => toggleUnidade(u.id)} />
                    {u.nome} — {u.cidade}
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{unidadesSelecionadas.size} unidade(s) selecionada(s)</div>
            </div>
          )}
          {erro && <div style={{ background: '#FCEBEB', color: '#501313', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>{erro}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={salvando} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroRole, setFiltroRole] = useState('')
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [modal, setModal] = useState(null)

  const excluir = async (id, nome) => {
    if (!confirm(`Excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      const { data } = await api.delete(`/usuarios/${id}`)
      if (!data.excluido) alert(data.motivo || 'Usuário tinha histórico no sistema e foi desativado em vez de excluído.')
      carregar()
    } catch { alert('Erro ao excluir usuário') }
  }

  const carregar = () => {
    setCarregando(true)
    api.get('/usuarios').then(r => setUsuarios(r.data)).catch(console.error).finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [])

  const filtrados = usuarios.filter(u => {
    const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase())
    const matchRole = !filtroRole || u.role === filtroRole
    const matchAtivo = mostrarInativos || u.ativo
    return matchBusca && matchRole && matchAtivo
  })
  const inativos = usuarios.filter(u => !u.ativo).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Usuários</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{usuarios.length} usuários cadastrados</div>
        </div>
        <button onClick={() => setModal('novo')}
          style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo usuário
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}></span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou email..."
            style={{ width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <select value={filtroRole} onChange={e => setFiltroRole(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
          <option value="">Todos os perfis</option>
          <option value="GESTOR">Gestor</option>
          <option value="GERENTE">Gerente</option>
          <option value="VIGIA">Vigia</option>
          <option value="TERCEIRO">Terceiro</option>
        </select>
        {inativos > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={mostrarInativos} onChange={e => setMostrarInativos(e.target.checked)} />
            Mostrar inativos ({inativos})
          </label>
        )}
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
            Nenhum usuário encontrado.{' '}
            <span style={{ color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setModal('novo')}>Cadastrar</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Usuário', 'Perfil', 'Unidade', 'Telefone', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F5F6FA' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: roleBadge[u.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: roleBadge[u.role]?.color, flexShrink: 0 }}>
                        {u.nome.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#111' }}>{u.nome}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...roleBadge[u.role], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{roleLabel[u.role]}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 12 }}>
                    {u.unidade ? <div><div>{u.unidade.nome}</div><div style={{ color: '#aaa' }}>{u.unidade.cidade}</div></div> : <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{u.telefone || <span style={{ color: '#ccc' }}>—</span>}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: u.ativo ? '#E8F5F1' : '#FCEBEB', color: u.ativo ? '#085041' : '#501313', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(u)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                      Editar
                    </button>
                    <button onClick={() => excluir(u.id, u.nome)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, cursor: 'pointer', color: '#991B1B' }}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          usuario={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); carregar() }}
        />
      )}
    </div>
  )
}
