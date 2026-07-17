import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtH = (h) => {
  const horas = Math.floor(h)
  const min = Math.round((h - horas) * 60)
  return `${horas}h${min > 0 ? `${min}min` : ''}`
}
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const segmentos = ['LOJA', 'OBRA', 'EXPANSAO']
const segLabel = { LOJA: 'Loja', OBRA: 'Obra', EXPANSAO: 'Reforma' }
const segCor = { LOJA: '#3730A3', OBRA: '#854D0E', EXPANSAO: '#166534' }
const segBg = { LOJA: '#EEF2FF', OBRA: '#FEF9C3', EXPANSAO: '#F0FDF4' }

const TabelaUnidades = ({ linhas, expandido, setExpandido, offset = 0 }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
    <thead>
      <tr style={{ background: '#FAFAFA' }}>
        {['Unidade', 'Cidade', 'Valor/hora', 'Registros', 'Total horas', 'Valor total', ''].map(h => (
          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {linhas.map((l, i) => {
        const idx = i + offset
        return (
          <>
            <tr key={idx} style={{ borderBottom: expandido === idx ? 'none' : '1px solid #F5F6FA', background: expandido === idx ? '#F9FAFB' : 'transparent' }}
              onMouseEnter={e => { if (expandido !== idx) e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={e => { if (expandido !== idx) e.currentTarget.style.background = 'transparent' }}>
              <td style={{ padding: '11px 16px' }}>
                <div style={{ fontWeight: 500, color: '#111' }}>{l.unidade}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{l.cnpj || l.empresa}</div>
              </td>
              <td style={{ padding: '11px 16px', color: '#666' }}>{l.cidade}</td>
              <td style={{ padding: '11px 16px' }}>
                <span style={{ background: '#E8F5F1', color: '#085041', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{fmt(l.valorHora)}/h</span>
              </td>
              <td style={{ padding: '11px 16px', color: '#666' }}>{l.registros}</td>
              <td style={{ padding: '11px 16px', fontWeight: 500 }}>{fmtH(l.totalHoras)}</td>
              <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0F6E56' }}>{fmt(l.valorTotal)}</td>
              <td style={{ padding: '11px 16px' }}>
                <button onClick={() => setExpandido(expandido === idx ? null : idx)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                  {expandido === idx ? 'Fechar' : 'Detalhar'}
                </button>
              </td>
            </tr>
            {expandido === idx && (
              <tr key={`det-${idx}`}>
                <td colSpan={7} style={{ padding: '0 16px 14px', background: '#F9FAFB', borderBottom: '1px solid #F5F6FA' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Vigilante', 'Data', 'Entrada', 'Saída', 'Horas', 'Valor'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#aaa', fontWeight: 500, borderBottom: '1px solid #EAECF0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {l.detalhes.map((d, j) => (
                        <tr key={j} style={{ borderBottom: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '7px 10px', color: '#555' }}>{d.vigia}</td>
                          <td style={{ padding: '7px 10px', color: '#555' }}>{new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                          <td style={{ padding: '7px 10px', color: '#555' }}>{d.entrada}</td>
                          <td style={{ padding: '7px 10px', color: '#555' }}>{d.saida}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 500 }}>{fmtH(d.horas)}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 500, color: '#0F6E56' }}>{fmt(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </>
        )
      })}
    </tbody>
    <tfoot>
      <tr style={{ background: '#F5F6FA', borderTop: '2px solid #EAECF0' }}>
        <td style={{ padding: '12px 16px', fontWeight: 700 }} colSpan={3}>SUBTOTAL</td>
        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{linhas.reduce((s, l) => s + l.registros, 0)}</td>
        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{fmtH(linhas.reduce((s, l) => s + l.totalHoras, 0))}</td>
        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F6E56', fontSize: 15 }}>{fmt(linhas.reduce((s, l) => s + l.valorTotal, 0))}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
)

export default function Folha() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [dadosPorSegmento, setDadosPorSegmento] = useState({})
  const [dadosTodos, setDadosTodos] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [filtroSegmento, setFiltroSegmento] = useState('TODOS')
  const navigate = useNavigate()

  const carregar = async () => {
    setCarregando(true)
    try {
      const r = await api.get(`/faturamento?mes=${mes}&ano=${ano}`)
      if (filtroSegmento !== 'TODOS') {
        setDadosTodos(r.data.porSegmento[filtroSegmento])
        setDadosPorSegmento({})
      } else {
        setDadosTodos(r.data.todos)
        setDadosPorSegmento(r.data.porSegmento)
      }
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [mes, ano, filtroSegmento])

  const exportarCSV = () => {
    if (!dadosTodos?.linhas) return
    const titulo = filtroSegmento !== 'TODOS'
      ? `Folha de Pagamento - ${meses[mes-1]} ${ano} - ${segLabel[filtroSegmento]}`
      : `Folha de Pagamento - ${meses[mes-1]} ${ano}`
    const rows = [
      [titulo],
      [],
      ['Unidade', 'CNPJ', 'Cidade', 'Segmento', 'Vigilante', 'Data', 'Entrada', 'Saida', 'Horas', 'Valor/hora', 'Valor'],
    ]
    for (const l of dadosTodos.linhas) {
      for (const d of (l.detalhes || [])) {
        rows.push([
          l.unidade || '',
          l.cnpj || '',
          l.cidade || '',
          d.segmento ? (segLabel[d.segmento] || d.segmento) : '',
          d.vigia || '',
          d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
          d.entrada || '',
          d.saida || '',
          d.horas.toFixed(2).replace('.', ','),
          l.valorHora.toFixed(2).replace('.', ','),
          d.valor.toFixed(2).replace('.', ','),
        ])
      }
    }
    rows.push([])
    rows.push([
      'TOTAL', '', '', '', '', '', '', '',
      (dadosTodos.totais?.totalHoras || 0).toFixed(2).replace('.', ','),
      '',
      (dadosTodos.totais?.valorTotal || 0).toFixed(2).replace('.', ','),
    ])
    const bom = '﻿'
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `folha-${meses[mes-1].toLowerCase()}-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totais = dadosTodos?.totais || { registros: 0, totalHoras: 0, valorTotal: 0 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Financeiro</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Calculado por horas trabalhadas — check-ins confirmados</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroSegmento} onChange={e => setFiltroSegmento(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            <option value="TODOS">Todos os segmentos</option>
            <option value="LOJA">Loja</option>
            <option value="OBRA">Obra</option>
            <option value="EXPANSAO">Reforma</option>
          </select>
          <button onClick={exportarCSV}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div style={{ background: '#E8F5F1', border: '1px solid #9FE1CB', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Faturamento baseado em <strong>horas trabalhadas</strong> (entrada → saída confirmadas). Configure o valor/hora em cada unidade.</span>
        <span style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: 16 }} onClick={() => navigate('/unidades')}>Configurar unidades</span>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Registros de check-in', valor: totais.registros, sub: 'pares entrada/saída confirmados' },
          { label: 'Total horas', valor: fmtH(totais.totalHoras), sub: 'horas trabalhadas no mês' },
          { label: 'Unidades', valor: dadosTodos?.linhas?.length || 0, sub: 'com registros no período' },
          { label: 'Valor total', valor: fmt(totais.valorTotal), sub: 'a faturar no mês', destaque: true },
        ].map(c => (
          <div key={c.label} style={{ background: c.destaque ? '#0F6E56' : '#fff', border: c.destaque ? 'none' : '1px solid #EAECF0', borderRadius: 12, padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: 12, color: c.destaque ? 'rgba(255,255,255,0.7)' : '#888', marginBottom: 5 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.destaque ? '#fff' : '#111' }}>{c.valor}</div>
            <div style={{ fontSize: 11, color: c.destaque ? 'rgba(255,255,255,0.6)' : '#999', marginTop: 3 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {carregando ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#999', background: '#fff', borderRadius: 12, border: '1px solid #EAECF0' }}>Carregando...</div>
      ) : filtroSegmento !== 'TODOS' ? (
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EAECF0', fontSize: 14, fontWeight: 600, color: '#111' }}>
            {segLabel[filtroSegmento]} — {meses[mes-1]} {ano}
          </div>
          {!dadosTodos?.linhas?.length ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>Nenhum registro para {segLabel[filtroSegmento]} em {meses[mes-1]} {ano}.</div>
          ) : (
            <TabelaUnidades linhas={dadosTodos.linhas} expandido={expandido} setExpandido={setExpandido} />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {segmentos.map((seg, si) => {
            const d = dadosPorSegmento[seg]
            if (!d?.linhas?.length) return null
            const offset = segmentos.slice(0, si).reduce((s, s2) => s + (dadosPorSegmento[s2]?.linhas?.length || 0), 0)
            return (
              <div key={seg} style={{ background: '#fff', border: `1px solid #EAECF0`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #EAECF0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: segBg[seg], color: segCor[seg], padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{segLabel[seg]}</span>
                  <span style={{ fontSize: 13, color: '#888' }}>{d.linhas.length} unidade(s) · {fmtH(d.totais.totalHoras)} · {fmt(d.totais.valorTotal)}</span>
                </div>
                <TabelaUnidades linhas={d.linhas} expandido={expandido} setExpandido={setExpandido} offset={offset} />
              </div>
            )
          })}
          {!segmentos.some(seg => dadosPorSegmento[seg]?.linhas?.length) && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14, background: '#fff', borderRadius: 12, border: '1px solid #EAECF0' }}>
              Nenhum registro confirmado em {meses[mes-1]} {ano}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
