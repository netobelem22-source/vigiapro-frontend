import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { hojeBrasil } from '../utils/data'

const calcFim = (inicio) => {
  if (!inicio) return ''
  const [h, m] = inicio.split(':').map(Number)
  const totalMin = h * 60 + m + 12 * 60
  const fimH = Math.floor(totalMin / 60) % 24
  const fimM = totalMin % 60
  return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`
}

export default function NovoPedido() {
  const [unidades, setUnidades] = useState([])
  const [terceirizadas, setTerceirizadas] = useState([])
  const [multiUnidade, setMultiUnidade] = useState(false)
  const [unidadeIds, setUnidadeIds] = useState([])
  const [buscaUnidade, setBuscaUnidade] = useState('')
  const [form, setForm] = useState({
    unidadeId: '',
    terceirizadaId: '',
    dataInicio: hojeBrasil(),
    dataFim: hojeBrasil(),
    usarPeriodo: false,
    segmento: 'LOJA',
    turno: 'NOITE',
    qtdVigiaDia: 1,
    qtdVigiNoite: 1,
    inicioTurnoDia: '07:00',
    inicioTurnoNoite: '19:00',
    fimTurnoDia: '19:00',
    fimTurnoNoite: '07:00',
    observacao: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState(null)
  const navigate = useNavigate()
  const { usuario } = useAuth()

  useEffect(() => {
    api.get('/unidades?limit=1000').then(r => {
      const lista = r.data.unidades || []
      setUnidades(lista)
      if (usuario?.unidadeId) setForm(f => ({ ...f, unidadeId: usuario.unidadeId }))
      else if (lista.length > 0) setForm(f => ({ ...f, unidadeId: lista[0].id }))
    })
    api.get('/terceirizadas').then(r => setTerceirizadas(r.data || [])).catch(() => {})
  }, [])

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  // Auto-calcula horário de término ao mudar o início
  useEffect(() => {
    set('fimTurnoDia', calcFim(form.inicioTurnoDia))
  }, [form.inicioTurnoDia])

  useEffect(() => {
    set('fimTurnoNoite', calcFim(form.inicioTurnoNoite))
  }, [form.inicioTurnoNoite])

  // Calcula preview de dias (e lojas, se aplicável) ao mudar datas/seleção
  useEffect(() => {
    const lojas = multiUnidade ? unidadeIds.length : 1
    if (!form.usarPeriodo) {
      setPreview(lojas > 1 ? { dias: 1, lojas, totalPedidos: lojas } : null)
      return
    }
    if (!form.dataInicio || !form.dataFim) return
    const inicio = new Date(form.dataInicio + 'T12:00:00')
    const fim = new Date(form.dataFim + 'T12:00:00')
    if (fim < inicio) { setPreview(null); return }
    const dias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1
    const vigiasPorDia = form.turno === 'DIA'
      ? (parseInt(form.qtdVigiaDia) || 0)
      : (parseInt(form.qtdVigiNoite) || 0)
    setPreview({ dias, lojas, vigiasPorDia, totalDiarias: dias * vigiasPorDia * lojas, totalPedidos: dias * lojas })
  }, [form.dataInicio, form.dataFim, form.usarPeriodo, form.turno, form.qtdVigiaDia, form.qtdVigiNoite, multiUnidade, unidadeIds])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (multiUnidade) {
      if (unidadeIds.length === 0) return setErro('Selecione ao menos uma unidade')
    } else if (!form.unidadeId) return setErro('Selecione uma unidade')
    if (!form.terceirizadaId) return setErro('Selecione a empresa terceirizada')
    if (form.usarPeriodo && form.dataFim < form.dataInicio) return setErro('Data final deve ser maior que a inicial')
    setSalvando(true)
    try {
      const payload = {
        segmento: form.segmento,
        dataInicio: form.dataInicio,
        dataFim: form.usarPeriodo ? form.dataFim : form.dataInicio,
        turno: form.turno,
        qtdVigiaDia: form.turno === 'DIA' ? form.qtdVigiaDia : 0,
        qtdVigiNoite: form.turno === 'NOITE' ? form.qtdVigiNoite : 0,
        inicioTurnoDia: form.turno === 'DIA' ? form.inicioTurnoDia : null,
        inicioTurnoNoite: form.turno === 'NOITE' ? form.inicioTurnoNoite : null,
        fimTurnoDia: form.turno === 'DIA' ? form.fimTurnoDia : null,
        fimTurnoNoite: form.turno === 'NOITE' ? form.fimTurnoNoite : null,
        observacao: form.observacao,
        terceirizadaId: form.terceirizadaId,
        ...(multiUnidade ? { unidadeIds } : { unidadeId: form.unidadeId })
      }
      const res = await api.post('/pedidos', payload)
      const sufixo = res.data.unidades > 1 ? ` em ${res.data.unidades} unidades` : ''
      navigate('/pedidos', { state: { sucesso: `${res.data.criados} pedido(s) criado(s)${sufixo} com sucesso!` } })
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar pedido')
    } finally {
      setSalvando(false)
    }
  }

  const toggleUnidade = (id) => {
    setUnidadeIds(cur => cur.includes(id) ? cur.filter(u => u !== id) : [...cur, id])
  }

  const unidadesFiltradas = unidades.filter(u =>
    !buscaUnidade || u.nome.toLowerCase().includes(buscaUnidade.toLowerCase()) || u.cidade?.toLowerCase().includes(buscaUnidade.toLowerCase())
  )

  const input = (label, campo, tipo = 'text', props = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{label}</label>
      <input type={tipo} value={form[campo]} onChange={e => set(campo, e.target.value)}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} {...props} />
    </div>
  )

  const fimAtual = form.turno === 'DIA' ? form.fimTurnoDia : form.fimTurnoNoite
  const inicioAtual = form.turno === 'DIA' ? form.inicioTurnoDia : form.inicioTurnoNoite
  const atravessaMeiaNoite = fimAtual && inicioAtual && fimAtual <= inicioAtual

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/pedidos')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#666', padding: 0 }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Novo pedido</h1>
          <div style={{ fontSize: 13, color: '#888' }}>Solicitar vigilantes para uma unidade</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Unidade */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Unidade</div>
            {usuario?.role !== 'GERENTE' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#555' }}>
                <input type="checkbox" checked={multiUnidade}
                  onChange={e => { setMultiUnidade(e.target.checked); setUnidadeIds([]) }}
                  style={{ width: 16, height: 16, accentColor: '#0F6E56' }} />
                Solicitar para várias unidades
              </label>
            )}
          </div>

          {multiUnidade ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={buscaUnidade} onChange={e => setBuscaUnidade(e.target.value)}
                placeholder="Buscar por nome ou cidade..."
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ color: '#0F6E56', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setUnidadeIds([...new Set([...unidadeIds, ...unidadesFiltradas.map(u => u.id)])])}>
                  Selecionar {buscaUnidade ? 'filtradas' : 'todas'}
                </span>
                <span style={{ color: '#888', cursor: 'pointer' }} onClick={() => setUnidadeIds([])}>Limpar seleção</span>
                <span style={{ color: '#aaa', marginLeft: 'auto' }}>{unidadeIds.length} selecionada(s)</span>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                {unidadesFiltradas.length === 0 ? (
                  <div style={{ padding: 14, fontSize: 13, color: '#999', textAlign: 'center' }}>Nenhuma unidade encontrada.</div>
                ) : unidadesFiltradas.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #F5F6FA', cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={unidadeIds.includes(u.id)} onChange={() => toggleUnidade(u.id)}
                      style={{ width: 15, height: 15, accentColor: '#0F6E56' }} />
                    <span style={{ color: '#111' }}>{u.nome}</span>
                    <span style={{ color: '#999' }}>— {u.cidade}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Unidade</label>
              <select value={form.unidadeId} onChange={e => set('unidadeId', e.target.value)}
                disabled={usuario?.role === 'GERENTE'}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                <option value="">Selecione...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.cidade}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Empresa terceirizada */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Empresa terceirizada</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Qual empresa vai atender este pedido</label>
            <select value={form.terceirizadaId} onChange={e => set('terceirizadaId', e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
              <option value="">Selecione...</option>
              {terceirizadas.map(t => <option key={t.id} value={t.id}>{t.nome} — R$ {Number(t.valorHora).toFixed(2)}/h</option>)}
            </select>
            {terceirizadas.length === 0 && (
              <div style={{ fontSize: 12, color: '#E24B4A', marginTop: 4 }}>
                Nenhuma empresa terceirizada cadastrada ainda — cadastre em "Terceirizada" no menu antes de continuar.
              </div>
            )}
          </div>
        </div>

        {/* Segmento */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Segmento</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['LOJA', 'OBRA', 'EXPANSAO'].map(seg => (
              <button key={seg} type="button"
                onClick={() => set('segmento', seg)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${form.segmento === seg ? '#0F6E56' : '#ddd'}`, background: form.segmento === seg ? '#E8F5F1' : '#fff', color: form.segmento === seg ? '#0F6E56' : '#555', fontSize: 13, fontWeight: form.segmento === seg ? 600 : 400, cursor: 'pointer' }}>
                {seg === 'EXPANSAO' ? 'Reforma' : seg.charAt(0) + seg.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Período */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Período</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#555' }}>
              <input type="checkbox" checked={form.usarPeriodo} onChange={e => set('usarPeriodo', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0F6E56' }} />
              Solicitar para um período de dias
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: form.usarPeriodo ? '1fr 1fr' : '1fr', gap: 12 }}>
            {input(form.usarPeriodo ? 'Data início' : 'Data do serviço', 'dataInicio', 'date')}
            {form.usarPeriodo && input('Data fim', 'dataFim', 'date', { min: form.dataInicio })}
          </div>

          {preview && (form.usarPeriodo || preview.lojas > 1) && (() => {
            const cols = [
              ...(form.usarPeriodo ? [{ v: preview.dias, l: 'dias' }] : []),
              ...(preview.lojas > 1 ? [{ v: preview.lojas, l: 'lojas' }] : []),
              ...(form.usarPeriodo ? [{ v: preview.vigiasPorDia, l: 'vigilantes/dia' }] : []),
              { v: preview.totalPedidos, l: 'total de pedidos' }
            ]
            const mensagem = form.usarPeriodo && preview.lojas > 1
              ? `Serão criados ${preview.totalPedidos} pedidos automaticamente — ${preview.dias} dia(s) para cada uma das ${preview.lojas} unidades.`
              : form.usarPeriodo
                ? `Serão criados ${preview.dias} pedidos automaticamente, um para cada dia do período.`
                : `Será criado 1 pedido para cada uma das ${preview.lojas} unidades selecionadas.`
            return (
              <div style={{ marginTop: 12, background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 6 }}>Resumo do pedido</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 8 }}>
                  {cols.map(c => (
                    <div key={c.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>{c.v}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{c.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>{mensagem}</div>
              </div>
            )
          })()}
        </div>

        {/* Escala */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Escala de vigilantes</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Turno</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'NOITE', label: 'Somente Noite' },
                { value: 'DIA', label: 'Somente Dia' }
              ].map(t => (
                <button key={t.value} type="button"
                  onClick={() => set('turno', t.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${form.turno === t.value ? '#0F6E56' : '#ddd'}`, background: form.turno === t.value ? '#E8F5F1' : '#fff', color: form.turno === t.value ? '#0F6E56' : '#555', fontSize: 13, fontWeight: form.turno === t.value ? 600 : 400, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {/* Quantidade */}
            {input('Vigilantes', form.turno === 'DIA' ? 'qtdVigiaDia' : 'qtdVigiNoite', 'number', { min: 1 })}

            {/* Horário início */}
            {form.turno === 'DIA'
              ? input('Início do turno', 'inicioTurnoDia', 'time')
              : input('Início do turno', 'inicioTurnoNoite', 'time')
            }

            {/* Horário fim — calculado automaticamente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>
                Término {atravessaMeiaNoite ? '(+1 dia)' : ''}
              </label>
              <input type="time"
                value={fimAtual}
                readOnly
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#F9FAFB', color: '#555', cursor: 'default' }} />
            </div>
          </div>

          {/* Info 12h */}
          <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#166534' }}>
            Cada vigilante trabalha <strong>12 horas fixas</strong> neste turno —
            das <strong>{form.turno === 'DIA' ? form.inicioTurnoDia : form.inicioTurnoNoite}</strong> às <strong>{fimAtual}</strong>{atravessaMeiaNoite ? ' do dia seguinte' : ''}.
          </div>
        </div>

        {/* Observação */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Observações</div>
          <textarea value={form.observacao} onChange={e => set('observacao', e.target.value)}
            placeholder="Evento especial, reforço de segurança, instruções específicas..."
            rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        {erro && <div style={{ background: '#FCEBEB', color: '#501313', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{erro}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/pedidos')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Salvando...' : preview?.totalPedidos > 1 ? `Criar ${preview.totalPedidos} pedidos` : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
