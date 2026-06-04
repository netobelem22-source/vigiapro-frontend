import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

const Badge = ({ status }) => {
  const map = {
    CONFIRMADO: { bg: '#E1F5EE', color: '#085041', label: 'Confirmado' },
    PENDENTE:   { bg: '#FAEEDA', color: '#633806', label: 'Pendente' },
    CANCELADO:  { bg: '#FCEBEB', color: '#501313', label: 'Cancelado' },
  }
  const s = map[status] || map.PENDENTE
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

const segmentoLabel = { LOJA: 'Loja', OBRA: 'Obra', EXPANSAO: 'Expansão' }
const segmentoCor = { LOJA: { bg: '#EEF2FF', color: '#3730A3' }, OBRA: { bg: '#FEF9C3', color: '#854D0E' }, EXPANSAO: { bg: '#F0FDF4', color: '#166534' } }

const ModalLink = ({ pedido, onClose }) => {
  const [links, setLinks] = useState({ entrada: null, saida: null })
  const [gerando, setGerando] = useState('')

  const gerarLink = async (tipo) => {
    setGerando(tipo)
    try {
      const res = await import('../services/api').then(m => m.default.post('/links/gerar', { pedidoId: pedido.id, tipo }))
      setLinks(l => ({ ...l, [tipo.toLowerCase()]: res.data.url }))
    } catch { alert('Erro ao gerar link') }
    finally { setGerando('') }
  }

  const copiar = (url) => { navigator.clipboard.writeText(url); alert('Link copiado!') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Links de ponto</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
          Gere links para <strong>{pedido.unidade?.nome}</strong>. O vigia abre o link no celular e bate o ponto com foto e GPS. Válido por 24h.
        </div>
        {['ENTRADA', 'SAIDA'].map(tipo => (
          <div key={tipo} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: links[tipo.toLowerCase()] ? 10 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tipo === 'ENTRADA' ? '#085041' : '#501313' }}>
                {tipo === 'ENTRADA' ? 'Link de Entrada' : 'Link de Saída'}
              </div>
              <button onClick={() => gerarLink(tipo)} disabled={gerando === tipo}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: tipo === 'ENTRADA' ? '#0F6E56' : '#E24B4A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {gerando === tipo ? 'Gerando...' : 'Gerar link'}
              </button>
            </div>
            {links[tipo.toLowerCase()] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input readOnly value={links[tipo.toLowerCase()]}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, color: '#555', background: '#fff' }} />
                <button onClick={() => copiar(links[tipo.toLowerCase()])}
                  style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Copiar
                </button>
              </div>
            )}
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>Links expiram em 24h após geração. Cada link só pode ser usado uma vez.</div>
      </div>
    </div>
  )
}

const ModalCancelar = ({ pedido, onClose, onCancelado }) => {
  const [salvando, setSalvando] = useState(false)
  const confirmar = async () => {
    setSalvando(true)
    try {
      await api.patch(`/pedidos/${pedido.id}/status`, { status: 'CANCELADO' })
      onCancelado()
    } catch { alert('Erro ao cancelar pedido') }
    finally { setSalvando(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 440 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Cancelar pedido</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
          Cancelar o pedido de <strong>{pedido.unidade?.nome}</strong> do dia <strong>{new Date(pedido.data).toLocaleDateString('pt-BR')}</strong>?
        </p>
        <div style={{ background: '#FFF8F0', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
          Pedidos cancelados não entram no cálculo da folha de pagamento.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Voltar</button>
          <button onClick={confirmar} disabled={salvando} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ModalHistorico = ({ pedidoId, onClose }) => {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/pedidos/${pedidoId}`)
      .then(r => setHistorico(r.data.historico || []))
      .finally(() => setCarregando(false))
  }, [pedidoId])

  const acaoCor = { CRIADO: '#0F6E56', CONFIRMADO: '#085041', CANCELADO: '#E24B4A', PENDENTE: '#BA7517' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 460, maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Histórico do pedido</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        {carregando ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Carregando...</div>
        ) : historico.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem', fontSize: 13 }}>Nenhum histórico registrado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {historico.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: acaoCor[h.acao] || '#888', flexShrink: 0, marginTop: 3 }} />
                  {i < historico.length - 1 && <div style={{ width: 1, flex: 1, background: '#EAECF0', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: acaoCor[h.acao] || '#111' }}>{h.acao}</span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{new Date(h.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{h.detalhe}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{h.usuario?.nome}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [modalCancelar, setModalCancelar] = useState(null)
  const [modalLink, setModalLink] = useState(null)
  const [modalHistorico, setModalHistorico] = useState(null)
  const [confirmandoTodos, setConfirmandoTodos] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [sucesso, setSucesso] = useState(location.state?.sucesso || '')

  const carregar = () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroData) params.append('data', filtroData)
    if (filtroStatus) params.append('status', filtroStatus)
    if (filtroCidade) params.append('cidade', filtroCidade)
    api.get(`/pedidos?${params}`)
      .then(r => setPedidos(r.data))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [filtroData, filtroStatus, filtroCidade])

  const confirmar = async (id) => {
    try { await api.patch(`/pedidos/${id}/status`, { status: 'CONFIRMADO' }); carregar() }
    catch { alert('Erro ao confirmar') }
  }

  const confirmarTodos = async () => {
    const pendentes = pedidos.filter(p => p.status === 'PENDENTE').length
    if (!pendentes) return alert('Nenhum pedido pendente para confirmar.')
    if (!window.confirm(`Confirmar todos os ${pendentes} pedidos pendentes?`)) return
    setConfirmandoTodos(true)
    try {
      const res = await api.post('/pedidos/confirmar-todos', { data: filtroData })
      alert(`${res.data.confirmados} pedido(s) confirmado(s) com sucesso!`)
      carregar()
    } catch { alert('Erro ao confirmar pedidos') }
    finally { setConfirmandoTodos(false) }
  }

  const pendentes = pedidos.filter(p => p.status === 'PENDENTE').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Pedidos</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{pedidos.length} pedido(s) encontrado(s)</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {sucesso && (
        <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>{sucesso}</strong>
          <span style={{ cursor: 'pointer', fontSize: 16, color: '#666' }} onClick={() => setSucesso('')}>×</span>
        </div>
      )}
      {pendentes > 0 && (
            <button onClick={confirmarTodos} disabled={confirmandoTodos}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #9FE1CB', background: '#E8F5F1', color: '#085041', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {confirmandoTodos ? 'Confirmando...' : `Confirmar todos (${pendentes})`}
            </button>
          )}
          <button onClick={() => navigate('/pedidos/novo')}
            style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Novo pedido
          </button>
        </div>
      </div>

      {sucesso && (
        <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>{sucesso}</strong>
          <span style={{ cursor: 'pointer', fontSize: 16, color: '#666' }} onClick={() => setSucesso('')}>×</span>
        </div>
      )}
      {pendentes > 0 && (
        <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#633806' }}>
          <strong>{pendentes} pedido(s)</strong> pendentes — confirme para entrar na folha de pagamento.
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Data</label>
          <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Cidade</label>
          <input type="text" value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)} placeholder="Filtrar por cidade..."
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, width: 160 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={() => { setFiltroData(''); setFiltroStatus(''); setFiltroCidade('') }}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
        ) : pedidos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
            Nenhum pedido encontrado.{' '}
            <span style={{ color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/pedidos/novo')}>Criar pedido</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Unidade', 'Cidade', 'Data', 'Segmento', 'Horário', 'Vigias', 'Pontos', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F5F6FA', opacity: p.status === 'CANCELADO' ? 0.5 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>{p.unidade?.nome}</td>
                  <td style={{ padding: '11px 14px', color: '#666' }}>{p.unidade?.cidade}</td>
                  <td style={{ padding: '11px 14px', color: '#666' }}>{new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: segmentoCor[p.segmento]?.bg || '#eee', color: segmentoCor[p.segmento]?.color || '#555', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {segmentoLabel[p.segmento] || p.segmento}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#666', fontSize: 12 }}>
                    {(p.turno === 'DIA' || p.turno === 'AMBOS') && p.inicioTurnoDia && <div>Dia: {p.inicioTurnoDia}</div>}
                    {(p.turno === 'NOITE' || p.turno === 'AMBOS') && p.inicioTurnoNoite && <div>Noite: {p.inicioTurnoNoite}</div>}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#666', fontSize: 12 }}>
                    {p.turno === 'AMBOS' && <div>{p.qtdVigiaDia}D / {p.qtdVigiNoite}N</div>}
                    {p.turno === 'DIA' && <div>{p.qtdVigiaDia} dia</div>}
                    {p.turno === 'NOITE' && <div>{p.qtdVigiNoite} noite</div>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {(() => {
                      if (p.status !== 'CONFIRMADO') return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
                      const pontos = p.pontos || []
                      const temEntrada = pontos.some(pt => pt.tipo === 'ENTRADA')
                      const temSaida = pontos.some(pt => pt.tipo === 'SAIDA')
                      // Verifica se já passou do horário previsto
                      const agora = new Date()
                      const dataP = new Date(p.data)
                      const mesmoDia = dataP.toDateString() === agora.toDateString()
                      const horario = p.turno === 'NOITE' ? p.inicioTurnoNoite : p.inicioTurnoDia
                      let atrasado = false
                      if (horario && mesmoDia) {
                        const [h, m] = horario.split(':').map(Number)
                        const prev = new Date(); prev.setHours(h, m + 15, 0)
                        atrasado = agora > prev
                      }
                      if (temEntrada && temSaida) return <span style={{ background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>Completo</span>
                      if (temEntrada) return <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>Em serviço</span>
                      if (atrasado) return <span style={{ background: '#FCEBEB', color: '#991B1B', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Ausente</span>
                      return <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>Aguardando</span>
                    })()}
                  </td>
                  <td style={{ padding: '11px 14px' }}><Badge status={p.status} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {p.status === 'PENDENTE' && (
                        <button onClick={() => confirmar(p.id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #9FE1CB', background: '#E1F5EE', color: '#085041', fontSize: 12, cursor: 'pointer' }}>
                          Confirmar
                        </button>
                      )}
                      {p.status !== 'CANCELADO' && (
                        <button onClick={() => setModalCancelar(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 12, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      )}
                      {p.status === 'CONFIRMADO' && (
                        <button onClick={() => setModalLink(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#3730A3', fontSize: 12, cursor: 'pointer' }}>
                          Link ponto
                        </button>
                      )}
                      <button onClick={() => setModalHistorico(p.id)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 12, cursor: 'pointer' }}>
                        Histórico
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalCancelar && <ModalCancelar pedido={modalCancelar} onClose={() => setModalCancelar(null)} onCancelado={() => { setModalCancelar(null); carregar() }} />}
      {modalHistorico && <ModalHistorico pedidoId={modalHistorico} onClose={() => setModalHistorico(null)} />}
      {modalLink && <ModalLink pedido={modalLink} onClose={() => setModalLink(null)} />}
    </div>
  )
}
