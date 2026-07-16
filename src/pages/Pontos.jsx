import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import Paginacao from '../components/Paginacao'

const Badge = ({ status }) => {
  const map = {
    CONFIRMADO: { bg: '#E1F5EE', color: '#085041', label: 'Confirmado' },
    ABERTO:     { bg: '#FAEEDA', color: '#633806', label: 'Aguardando' },
    FECHADO:    { bg: '#EEEDFE', color: '#26215C', label: 'Fechado' },
  }
  const s = map[status] || map.ABERTO
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

const BadgeTipo = ({ tipo, manual }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ background: tipo === 'ENTRADA' ? '#E1F5EE' : '#FCEBEB', color: tipo === 'ENTRADA' ? '#085041' : '#501313', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
      {tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
    </span>
    {manual && <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500 }}>Manual</span>}
  </div>
)

const ModalFoto = ({ url, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
    <div style={{ position: 'relative' }}>
      <img src={url} style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12 }} />
      <button onClick={onClose} style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: 16, background: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
    </div>
  </div>
)

const ModalManual = ({ onClose, onSalvo }) => {
  const [pedidos, setPedidos] = useState([])
  const [vigias, setVigias] = useState([])
  const [form, setForm] = useState({
    pedidoId: '',
    vigiaId: '',
    nomeVigia: '',
    tipo: 'ENTRADA',
    horario: new Date().toISOString().slice(0, 16),
    observacao: ''
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get(`/pedidos?data=${hoje}&status=CONFIRMADO&limit=200`),
      api.get('/usuarios').catch(() => ({ data: [] }))
    ]).then(([rp, ru]) => {
      const lista = rp.data.pedidos || []
      setPedidos(lista)
      setVigias(ru.data.filter(u => u.role === 'VIGIA'))
      if (lista.length > 0) setForm(f => ({ ...f, pedidoId: lista[0].id }))
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.pedidoId) return alert('Selecione um pedido')
    if (!form.nomeVigia && !form.vigiaId) return alert('Informe o Nome do vigilante')
    setSalvando(true)
    try {
      const pedido = pedidos.find(p => p.id === form.pedidoId)
      await api.post('/pontos/manual', {
        pedidoId: form.pedidoId,
        unidadeId: pedido?.unidadeId,
        vigiaId: form.vigiaId || vigias[0]?.id,
        nomeVigia: form.nomeVigia || vigias.find(v => v.id === form.vigiaId)?.nome,
        tipo: form.tipo,
        horario: new Date(form.horario).toISOString(),
        observacao: form.observacao,
        manual: true
      })
      onSalvo()
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao registrar check-in')
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Registrar check-in manual</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        <div style={{ background: '#FFF8F0', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
          Registro manual — será identificado como "Manual" na folha de pagamento.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Pedido (hoje)</label>
            <select value={form.pedidoId} onChange={e => set('pedidoId', e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
              <option value="">Selecione...</option>
              {pedidos.map(p => <option key={p.id} value={p.id}>{p.unidade?.nome} — {p.turno}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Nome do vigia</label>
            <input value={form.nomeVigia} onChange={e => set('nomeVigia', e.target.value)}
              placeholder="Digite o nome do vigilante"
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Horário</label>
              <input type="datetime-local" value={form.horario} onChange={e => set('horario', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Observação (opcional)</label>
            <input value={form.observacao} onChange={e => set('observacao', e.target.value)}
              placeholder="Ex: Vigilante esqueceu o celular"
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Registrando...' : 'Registrar check-in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Pontos() {
  const [pontos, setPontos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const paginaRef = useRef(1)
  const [fotoModal, setFotoModal] = useState(null)
  const [modalManual, setModalManual] = useState(false)

  const carregar = () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroData) params.append('data', filtroData)
    if (filtroStatus) params.append('status', filtroStatus)
    params.append('page', paginaRef.current)
    params.append('limit', 20)
    api.get(`/pontos?${params}`)
      .then(r => {
        const lista = Array.isArray(r.data) ? r.data : (r.data.pontos || [])
        setPontos(lista)
        setTotal(r.data.total ?? lista.length)
        setPaginas(r.data.paginas ?? 1)
        setPagina(r.data.pagina ?? 1)
      })
      .catch(console.error)
      .finally(() => setCarregando(false))
  }

  // Quando filtros mudam, volta pra página 1
  useEffect(() => {
    paginaRef.current = 1
  }, [filtroData, filtroStatus])

  useAutoRefresh(carregar, [filtroData, filtroStatus])

  const irParaPagina = (pg) => {
    paginaRef.current = pg
    setPagina(pg)
    carregar()
  }

  const confirmar = async (id) => {
    try { await api.patch(`/pontos/${id}/confirmar`); carregar() }
    catch { alert('Erro ao confirmar check-in') }
  }

  const pendentes = pontos.filter(p => p.status === 'ABERTO').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Check-in</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Registros de entrada e saída dos vigilantes</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendentes > 0 && (
            <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#633806' }}>
              <strong>{pendentes}</strong> aguardando confirmação
            </div>
          )}
          <button onClick={() => setModalManual(true)}
            style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Registro manual
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Data</label>
          <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="ABERTO">Aguardando</option>
            <option value="CONFIRMADO">Confirmado</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={() => { setFiltroData(''); setFiltroStatus('') }}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>
            Limpar
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
        ) : pontos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>Nenhum registro encontrado.</div>
        ) : (
          <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Foto', 'Vigilante', 'Unidade', 'Tipo', 'Horário', 'Pontualidade', 'GPS', 'Confirmado por', 'Status', 'Ação'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pontos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F5F6FA' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px' }}>
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} onClick={() => setFotoModal(p.fotoUrl)}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid #eee' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: p.manual ? '#FFF8F0' : '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {p.manual ? '✏️' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, color: '#111' }}>{p.nomeVigia || p.vigia?.nome}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{p.vigia?.email}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>
                    <div>{p.unidade?.nome}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{p.unidade?.cidade}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><BadgeTipo tipo={p.tipo} manual={p.manual} /></td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>
                    {new Date(p.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    <div style={{ fontSize: 11, color: '#999' }}>{new Date(p.horario).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
                  </td>
                  {/* Pontualidade */}
                  <td style={{ padding: '10px 14px' }}>
                    {(() => {
                      if (p.tipo !== 'ENTRADA' || !p.pedido) return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      const previsto = p.pedido.turno === 'NOITE' ? p.pedido.inicioTurnoNoite : p.pedido.inicioTurnoDia
                      if (!previsto) return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      const [h, m] = previsto.split(':').map(Number)
                      const dataBase = new Date(p.horario)
                      const esperado = new Date(dataBase)
                      esperado.setHours(h, m, 0, 0)
                      const diffMin = Math.round((new Date(p.horario) - esperado) / 60000)
                      if (Math.abs(diffMin) <= 5) return <span style={{ background: '#E8F5F1', color: '#085041', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>No horário</span>
                      if (diffMin > 5) return <span style={{ background: '#FCEBEB', color: '#991B1B', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{diffMin}min atrasado</span>
                      return <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{Math.abs(diffMin)}min adiantado</span>
                    })()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.manual ? (
                      <span style={{ fontSize: 12, color: '#6B7280' }}>—</span>
                    ) : (
                      <span style={{ fontSize: 12, color: p.gpsValido ? '#0F6E56' : '#E24B4A' }}>
                        {p.gpsValido ? 'Válido' : 'Fora do raio'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666', fontSize: 12 }}>
                    {p.confirmadoPor ? (
                      <div>
                        <div>{p.confirmadoPor.nome}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{new Date(p.confirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ) : <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge status={p.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.status === 'ABERTO' && (
                      <button onClick={() => confirmar(p.id)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #9FE1CB', background: '#E1F5EE', color: '#085041', fontSize: 12, cursor: 'pointer' }}>
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacao pagina={pagina} paginas={paginas} total={total} onChange={irParaPagina} />
          </>
        )}
      </div>

      {fotoModal && <ModalFoto url={fotoModal} onClose={() => setFotoModal(null)} />}
      {modalManual && <ModalManual onClose={() => setModalManual(false)} onSalvo={() => { setModalManual(false); carregar() }} />}
    </div>
  )
}
