import { useState, useEffect } from 'react'
import api from '../services/api'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const Modal = ({ terceirizada, onClose, onSaved }) => {
  const [nome, setNome] = useState(terceirizada?.nome || '')
  const [valorHora, setValorHora] = useState(terceirizada?.valorHora ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const data = { nome, valorHora: parseFloat(valorHora) }
      if (terceirizada?.id) await api.put(`/terceirizadas/${terceirizada.id}`, data)
      else await api.post('/terceirizadas', data)
      onSaved()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{terceirizada?.id ? 'Editar terceirizada' : 'Nova empresa terceirizada'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Nome da empresa</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required
              placeholder="Ex: Segurança Alfa Ltda"
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Valor por hora (R$)</label>
            <input type="number" min="0" step="0.01" value={valorHora} onChange={e => setValorHora(e.target.value)} required
              placeholder="Ex: 35.00"
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
          </div>

          {erro && <div style={{ background: '#FCEBEB', color: '#501313', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{erro}</div>}

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

export default function Terceirizadas() {
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null)

  const carregar = () => {
    setCarregando(true)
    api.get('/terceirizadas').then(r => setLista(r.data)).catch(console.error).finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [])

  const excluir = async (id, nome) => {
    if (!confirm(`Desativar a empresa "${nome}"? Pedidos já criados com ela continuam com o histórico preservado.`)) return
    try {
      await api.delete(`/terceirizadas/${id}`)
      carregar()
    } catch { alert('Erro ao desativar empresa') }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Terceirizadas</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Empresas que fornecem vigias, com preço próprio por hora</div>
        </div>
        <button onClick={() => setModal('novo')}
          style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nova terceirizada
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
        ) : lista.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
            Nenhuma empresa terceirizada cadastrada.{' '}
            <span style={{ color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setModal('novo')}>Cadastrar agora</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Empresa', 'Valor/hora', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #F5F6FA' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{t.nome}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#E8F5F1', color: '#085041', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{fmt(t.valorHora)}/h</span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(t)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                      Editar
                    </button>
                    <button onClick={() => excluir(t.id, t.nome)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, cursor: 'pointer', color: '#991B1B' }}>
                      Desativar
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
          terceirizada={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); carregar() }}
        />
      )}
    </div>
  )
}
