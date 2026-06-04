import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function NovoPedido() {
  const [unidades, setUnidades] = useState([])
  const [form, setForm] = useState({
    unidadeId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    usarPeriodo: false,
    segmento: 'LOJA',
    turno: 'AMBOS',
    qtdVigiaDia: 1,
    qtdVigiNoite: 1,
    inicioTurnoDia: '07:00',
    inicioTurnoNoite: '19:00',
    observacao: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState(null)
  const navigate = useNavigate()
  const { usuario } = useAuth()

  useEffect(() => {
    api.get('/unidades').then(r => {
      setUnidades(r.data)
      if (usuario?.unidadeId) setForm(f => ({ ...f, unidadeId: usuario.unidadeId }))
      else if (r.data.length > 0) setForm(f => ({ ...f, unidadeId: r.data[0].id }))
    })
  }, [])

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  // Calcula preview de dias ao mudar datas
  useEffect(() => {
    if (!form.usarPeriodo) { setPreview(null); return }
    if (!form.dataInicio || !form.dataFim) return
    const inicio = new Date(form.dataInicio + 'T12:00:00')
    const fim = new Date(form.dataFim + 'T12:00:00')
    if (fim < inicio) { setPreview(null); return }
    const dias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1
    const vigiasPorDia = (form.turno === 'DIA' ? parseInt(form.qtdVigiaDia) || 0 : 0) +
                         (form.turno === 'NOITE' ? parseInt(form.qtdVigiNoite) || 0 : 0) +
                         (form.turno === 'AMBOS' ? (parseInt(form.qtdVigiaDia) || 0) + (parseInt(form.qtdVigiNoite) || 0) : 0)
    setPreview({ dias, vigiasPorDia, totalDiarias: dias * vigiasPorDia })
  }, [form.dataInicio, form.dataFim, form.usarPeriodo, form.turno, form.qtdVigiaDia, form.qtdVigiNoite])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.unidadeId) return setErro('Selecione uma unidade')
    if (form.usarPeriodo && form.dataFim < form.dataInicio) return setErro('Data final deve ser maior que a inicial')
    setSalvando(true)
    try {
      const payload = {
        segmento: form.segmento,
        dataInicio: form.dataInicio,
        dataFim: form.usarPeriodo ? form.dataFim : form.dataInicio,
        turno: form.turno,
        qtdVigiaDia: form.qtdVigiaDia,
        qtdVigiNoite: form.qtdVigiNoite,
        inicioTurnoDia: form.inicioTurnoDia,
        inicioTurnoNoite: form.inicioTurnoNoite,
        observacao: form.observacao,
        unidadeId: form.unidadeId
      }
      const res = await api.post('/pedidos', payload)
      navigate('/pedidos', { state: { sucesso: `${res.data.criados} pedido(s) criado(s) com sucesso!` } })
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar pedido')
    } finally {
      setSalvando(false)
    }
  }

  const input = (label, campo, tipo = 'text', props = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{label}</label>
      <input type={tipo} value={form[campo]} onChange={e => set(campo, e.target.value)}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} {...props} />
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/pedidos')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#666', padding: 0 }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Novo pedido</h1>
          <div style={{ fontSize: 13, color: '#888' }}>Solicitar vigias para uma unidade</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Unidade */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Unidade</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Unidade</label>
            <select value={form.unidadeId} onChange={e => set('unidadeId', e.target.value)}
              disabled={usuario?.role === 'GERENTE'}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
              <option value="">Selecione...</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.cidade}</option>)}
            </select>
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
                {seg === 'EXPANSAO' ? 'Expansão' : seg.charAt(0) + seg.slice(1).toLowerCase()}
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

          {/* Preview do período */}
          {form.usarPeriodo && preview && (
            <div style={{ marginTop: 12, background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 6 }}>Resumo do período</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>{preview.dias}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>dias</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>{preview.vigiasPorDia}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>vigias/dia</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>{preview.totalDiarias}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>total diárias</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
                Serão criados <strong>{preview.dias} pedidos</strong> automaticamente, um para cada dia do período.
              </div>
            </div>
          )}
        </div>

        {/* Escala */}
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#111' }}>Escala de vigias</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Turno</label>
            <select value={form.turno} onChange={e => set('turno', e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
              <option value="AMBOS">Dia e Noite</option>
              <option value="DIA">Somente Dia</option>
              <option value="NOITE">Somente Noite</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {(form.turno === 'DIA' || form.turno === 'AMBOS') && (
              <>{input('Vigias (dia)', 'qtdVigiaDia', 'number', { min: 0 })}{input('Início turno dia', 'inicioTurnoDia', 'time')}</>
            )}
            {(form.turno === 'NOITE' || form.turno === 'AMBOS') && (
              <>{input('Vigias (noite)', 'qtdVigiNoite', 'number', { min: 0 })}{input('Início turno noite', 'inicioTurnoNoite', 'time')}</>
            )}
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
            {salvando ? 'Salvando...' : form.usarPeriodo && preview ? `Criar ${preview.dias} pedidos` : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
