import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import Paginacao from '../components/Paginacao'
import { hojeBrasil } from '../utils/data'

const Badge = ({ status }) => {
  const map = {
    CONFIRMADO: { bg: '#E1F5EE', color: '#085041', label: 'Confirmado' },
    PENDENTE:   { bg: '#FAEEDA', color: '#633806', label: 'Pendente' },
    CANCELADO:  { bg: '#FCEBEB', color: '#501313', label: 'Recusado' },
  }
  const s = map[status] || map.PENDENTE
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

const segmentoLabel = { LOJA: 'Loja', OBRA: 'Obra', EXPANSAO: 'Reforma' }
const segmentoCor = { LOJA: { bg: '#EEF2FF', color: '#3730A3' }, OBRA: { bg: '#FEF9C3', color: '#854D0E' }, EXPANSAO: { bg: '#F0FDF4', color: '#166534' } }

const calcFim = (inicio) => {
  if (!inicio) return ''
  const [h, m] = inicio.split(':').map(Number)
  const totalMin = h * 60 + m + 12 * 60
  const fimH = Math.floor(totalMin / 60) % 24
  const fimM = totalMin % 60
  return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`
}

const ModalEditar = ({ pedido, onClose, onSalvo }) => {
  const [segmento, setSegmento] = useState(pedido.segmento)
  const [inicio, setInicio] = useState(pedido.turno === 'DIA' ? pedido.inicioTurnoDia : pedido.inicioTurnoNoite)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const fim = calcFim(inicio)
  const campoInicio = pedido.turno === 'DIA' ? 'inicioTurnoDia' : 'inicioTurnoNoite'
  const campoFim = pedido.turno === 'DIA' ? 'fimTurnoDia' : 'fimTurnoNoite'

  const salvar = async () => {
    setErro('')
    setSalvando(true)
    try {
      await api.patch(`/pedidos/${pedido.id}`, { segmento, [campoInicio]: inicio, [campoFim]: fim })
      onSalvo()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar alterações')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 440 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Editar pedido</h2>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{pedido.unidade?.nome} — {new Date(pedido.data).toLocaleDateString('pt-BR')}</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Segmento</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['LOJA', 'OBRA', 'EXPANSAO'].map(seg => (
              <button key={seg} type="button" onClick={() => setSegmento(seg)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${segmento === seg ? '#0F6E56' : '#ddd'}`, background: segmento === seg ? '#E8F5F1' : '#fff', color: segmento === seg ? '#0F6E56' : '#555', fontSize: 13, fontWeight: segmento === seg ? 600 : 400, cursor: 'pointer' }}>
                {seg === 'EXPANSAO' ? 'Reforma' : seg.charAt(0) + seg.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Início do turno ({pedido.turno === 'DIA' ? 'dia' : 'noite'})</label>
            <input type="time" value={inicio} onChange={e => setInicio(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Término (automático)</label>
            <input type="time" value={fim} readOnly
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#F9FAFB', color: '#555' }} />
          </div>
        </div>

        {erro && <div style={{ background: '#FCEBEB', color: '#501313', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{erro}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ModalLink = ({ pedido, onClose }) => {
  const [linksGerados, setLinksGerados] = useState({})
  const [gerando, setGerando] = useState('')

  const totalVigias = pedido.turno === 'DIA' ? (pedido.qtdVigiaDia || 1)
    : pedido.turno === 'NOITE' ? (pedido.qtdVigiNoite || 1)
    : (pedido.qtdVigiaDia || 1) + (pedido.qtdVigiNoite || 1)

  const gerarLinks = async (tipo) => {
    setGerando(tipo)
    try {
      const api = (await import('../services/api')).default
      const res = await api.post('/links/gerar', { pedidoId: pedido.id, tipo })
      setLinksGerados(l => ({ ...l, [tipo]: res.data.links }))
    } catch { alert('Erro ao gerar links') }
    finally { setGerando('') }
  }

  const copiar = (url, num) => {
    navigator.clipboard.writeText(url)
    alert(`Link Vigilante ${num} copiado!`)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 520, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Links de check-in</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
          <strong>{pedido.unidade?.nome}</strong> — {totalVigias} vaga(s) solicitada(s)
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
          Serão gerados {totalVigias} link(s) por tipo — 1 para cada vigilante. Cada link só pode ser usado uma vez.
        </div>

        {['ENTRADA', 'SAIDA'].map(tipo => (
          <div key={tipo} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tipo === 'ENTRADA' ? '#085041' : '#501313' }}>
                {tipo === 'ENTRADA' ? 'Links de Entrada' : 'Links de Saída'}
                <span style={{ fontSize: 11, fontWeight: 400, color: '#888', marginLeft: 6 }}>({totalVigias} link{totalVigias > 1 ? 's' : ''})</span>
              </div>
              <button onClick={() => gerarLinks(tipo)} disabled={gerando === tipo}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: tipo === 'ENTRADA' ? '#0F6E56' : '#E24B4A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {gerando === tipo ? 'Gerando...' : `Gerar ${totalVigias} link${totalVigias > 1 ? 's' : ''}`}
              </button>
            </div>

            {linksGerados[tipo] ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linksGerados[tipo].map((l, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                      Vigia {l.numeroVaga}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input readOnly value={l.url}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 11, color: '#555', background: '#FAFAFA' }} />
                      <button onClick={() => copiar(l.url, l.numeroVaga)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#aaa' }}>Links válidos por 24h. Envie cada link para um vigilante diferente.</div>
      </div>
    </div>
  )
}

const ModalCancelar = ({ pedido, onClose, onCancelado }) => {
  const [salvando, setSalvando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const confirmar = async () => {
    setSalvando(true)
    try {
      await api.patch(`/pedidos/${pedido.id}/status`, { status: 'CANCELADO', motivo })
      onCancelado()
    } catch { alert('Erro ao recusar pedido') }
    finally { setSalvando(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 440 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Recusar pedido</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
          Recusar o pedido de <strong>{pedido.unidade?.nome}</strong> do dia <strong>{new Date(pedido.data).toLocaleDateString('pt-BR')}</strong>?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Motivo da recusa</label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
            placeholder="Explique o motivo da recusa"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ background: '#FFF8F0', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
          Pedidos recusados não entram no cálculo da folha de pagamento.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Voltar</button>
          <button onClick={confirmar} disabled={salvando || motivo.trim().length < 3}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: motivo.trim().length < 3 ? '#F3A6A5' : '#E24B4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: motivo.trim().length < 3 ? 'not-allowed' : 'pointer' }}>
            {salvando ? 'Recusando...' : 'Confirmar recusa'}
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

  const acaoCor = { CRIADO: '#0F6E56', CONFIRMADO: '#085041', CANCELADO: '#E24B4A', PENDENTE: '#BA7517', EDITADO: '#3730A3' }
  const acaoLabel = { CRIADO: 'CRIADO', CONFIRMADO: 'CONFIRMADO', CANCELADO: 'RECUSADO', PENDENTE: 'PENDENTE', EDITADO: 'EDITADO' }

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
                    <span style={{ fontSize: 13, fontWeight: 500, color: acaoCor[h.acao] || '#111' }}>{acaoLabel[h.acao] || h.acao}</span>
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
  const [filtroData, setFiltroData] = useState(hojeBrasil())
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const paginaRef = useRef(1)
  const [modalCancelar, setModalCancelar] = useState(null)
  const [modalLink, setModalLink] = useState(null)
  const [modalHistorico, setModalHistorico] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
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
    params.append('page', paginaRef.current)
    params.append('limit', 20)
    api.get(`/pedidos?${params}`)
      .then(r => {
        const lista = Array.isArray(r.data) ? r.data : (r.data.pedidos || [])
        setPedidos(lista)
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
  }, [filtroData, filtroStatus, filtroCidade, location.key])

  useAutoRefresh(carregar, [filtroData, filtroStatus, filtroCidade, location.key])

  const irParaPagina = (pg) => {
    paginaRef.current = pg
    setPagina(pg)
    carregar()
  }

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
      alert(res.data.limitado
        ? `${res.data.confirmados} pedido(s) confirmado(s) — havia mais pendentes do que o limite por vez, filtre por data e repita para confirmar o restante.`
        : `${res.data.confirmados} pedido(s) confirmado(s) com sucesso!`)
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
            <option value="CANCELADO">Recusado</option>
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
          <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Unidade', 'Cidade', 'Data', 'Segmento', 'Horário', 'Vigilantes', 'Check-in', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F5F6FA', opacity: p.status === 'CANCELADO' ? 0.5 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{p.unidade?.nome}</div>
                    {p.observacao && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.observacao}</div>}
                  </td>
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
                        // Horário previsto em horário de Brasília (fixo), independente do fuso do navegador
                        const diaBrasil = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
                        const [h, m] = horario.split(':').map(Number)
                        const prev = new Date(`${diaBrasil}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00-03:00`)
                        prev.setMinutes(prev.getMinutes() + 15)
                        atrasado = agora > prev
                      }
                      const totalVagas = p.turno === 'DIA' ? (p.qtdVigiaDia||1) : p.turno === 'NOITE' ? (p.qtdVigiNoite||1) : (p.qtdVigiaDia||1)+(p.qtdVigiNoite||1)
                      const entradas = pontos.filter(pt => pt.tipo === 'ENTRADA').length
                      const saidas = pontos.filter(pt => pt.tipo === 'SAIDA').length
                      if (saidas >= totalVagas) return <span style={{ background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>Completo</span>
                      if (saidas > 0 && saidas < totalVagas) return <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{saidas}/{totalVagas} Parcial</span>
                      if (entradas >= totalVagas) return <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>Em serviço</span>
                      if (entradas > 0 && entradas < totalVagas) return <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{entradas}/{totalVagas} Em serviço</span>
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
                        <button onClick={() => setModalEditar(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 12, cursor: 'pointer' }}>
                          Editar
                        </button>
                      )}
                      {p.status !== 'CANCELADO' && (
                        <button onClick={() => setModalCancelar(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 12, cursor: 'pointer' }}>
                          Recusar
                        </button>
                      )}
                      {p.status === 'CONFIRMADO' && (
                        <button onClick={() => setModalLink(p)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#3730A3', fontSize: 12, cursor: 'pointer' }}>
                          Link check-in
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
          <Paginacao pagina={pagina} paginas={paginas} total={total} onChange={irParaPagina} />
          </>
        )}
      </div>

      {modalCancelar && <ModalCancelar pedido={modalCancelar} onClose={() => setModalCancelar(null)} onCancelado={() => { setModalCancelar(null); carregar() }} />}
      {modalHistorico && <ModalHistorico pedidoId={modalHistorico} onClose={() => setModalHistorico(null)} />}
      {modalLink && <ModalLink pedido={modalLink} onClose={() => setModalLink(null)} />}
      {modalEditar && <ModalEditar pedido={modalEditar} onClose={() => setModalEditar(null)} onSalvo={() => { setModalEditar(null); carregar() }} />}
    </div>
  )
}
