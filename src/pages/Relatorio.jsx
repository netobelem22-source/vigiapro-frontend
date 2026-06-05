import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Relatorio() {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())

  useEffect(() => {
    setCarregando(true)
    // Busca pedidos do mês inteiro
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim = new Date(ano, mes, 0)
    const fimStr = fim.toISOString().split('T')[0]

    // Busca todos os dias do mês
    api.get(`/pedidos`)
      .then(r => {
        const filtrados = r.data.filter(p => {
          const d = new Date(p.data)
          return d.getMonth() + 1 === mes && d.getFullYear() === ano
        })
        setPedidos(filtrados)
      })
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [mes, ano])

  const totalVigiasDia = pedidos.reduce((s, p) => s + (p.qtdVigiaDia || 0), 0)
  const totalVigiasNoite = pedidos.reduce((s, p) => s + (p.qtdVigiNoite || 0), 0)
  const confirmados = pedidos.filter(p => p.status === 'CONFIRMADO').length
  const pendentes = pedidos.filter(p => p.status === 'PENDENTE').length

  // Agrupa por unidade
  const porUnidade = pedidos.reduce((acc, p) => {
    const nome = p.unidade?.nome || 'Sem unidade'
    if (!acc[nome]) acc[nome] = { nome, cidade: p.unidade?.cidade, pedidos: 0, vigiasDia: 0, vigiasNoite: 0 }
    acc[nome].pedidos++
    acc[nome].vigiasDia += p.qtdVigiaDia || 0
    acc[nome].vigiasNoite += p.qtdVigiNoite || 0
    return acc
  }, {})

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Relatório mensal</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Resumo de pedidos e vigilantes escalados</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={() => {
              const linhas = [
                ['Unidade', 'Cidade', 'Pedidos', 'Vigias Dia', 'Vigias Noite'],
                ...Object.values(porUnidade).map(u => [u.nome, u.cidade, u.pedidos, u.vigiasDia, u.vigiasNoite])
              ]
              const csv = linhas.map(l => l.join(';')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `relatorio-${mes}-${ano}.csv`; a.click()
            }}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ↓ Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total de pedidos', valor: pedidos.length, sub: `${meses[mes-1]} ${ano}` },
          { label: 'Confirmados', valor: confirmados, sub: 'pedidos aprovados', cor: '#0F6E56' },
          { label: 'Vigias (dia)', valor: totalVigiasDia, sub: 'escalamentos diurnos' },
          { label: 'Vigias (noite)', valor: totalVigiasNoite, sub: 'escalamentos noturnos' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1.2rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.cor || '#111' }}>{c.valor}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabela por unidade */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', fontSize: 14, fontWeight: 600, color: '#111' }}>
          Detalhamento por unidade
        </div>
        {carregando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
        ) : Object.values(porUnidade).length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
            Nenhum pedido encontrado para {meses[mes-1]} {ano}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Unidade', 'Cidade', 'Pedidos', 'Vigias dia', 'Vigias noite', 'Total vigias'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#888', borderBottom: '1px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(porUnidade).sort((a,b) => b.pedidos - a.pedidos).map(u => (
                <tr key={u.nome} style={{ borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 16px', fontWeight: 500 }}>{u.nome}</td>
                  <td style={{ padding: '11px 16px', color: '#666' }}>{u.cidade}</td>
                  <td style={{ padding: '11px 16px', color: '#666' }}>{u.pedidos}</td>
                  <td style={{ padding: '11px 16px', color: '#666' }}>{u.vigiasDia}</td>
                  <td style={{ padding: '11px 16px', color: '#666' }}>{u.vigiasNoite}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 500 }}>{u.vigiasDia + u.vigiasNoite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
