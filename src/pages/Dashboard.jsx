import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const Card = ({ label, valor, sub, cor, destaque }) => (
  <div style={{ background: destaque ? '#0F6E56' : '#fff', borderRadius: 12, padding: '1.2rem 1.5rem', border: destaque ? 'none' : '1px solid #EAECF0', flex: 1 }}>
    <div style={{ fontSize: 12, color: destaque ? 'rgba(255,255,255,0.7)' : '#888', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: destaque ? '#fff' : (cor || '#111') }}>{valor}</div>
    <div style={{ fontSize: 12, color: destaque ? 'rgba(255,255,255,0.6)' : '#999', marginTop: 4 }}>{sub}</div>
  </div>
)

const Badge = ({ status }) => {
  const map = {
    CONFIRMADO: { bg: '#E1F5EE', color: '#085041', label: 'Confirmado' },
    PENDENTE:   { bg: '#FAEEDA', color: '#633806', label: 'Pendente' },
    CANCELADO:  { bg: '#FCEBEB', color: '#501313', label: 'Cancelado' },
  }
  const s = map[status] || map.PENDENTE
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s.label}</span>
}

// Gráfico de barras simples
const GraficoBarras = ({ dados, label }) => {
  const max = Math.max(...dados.map(d => d.valor), 1)
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {dados.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#888' }}>{d.valor > 0 ? d.valor : ''}</div>
            <div style={{ width: '100%', background: d.hoje ? '#0F6E56' : '#E8F5F1', borderRadius: '4px 4px 0 0', height: `${Math.max((d.valor / max) * 60, d.valor > 0 ? 4 : 0)}px`, transition: 'height 0.3s', minHeight: d.valor > 0 ? 4 : 0 }} />
            <div style={{ fontSize: 10, color: d.hoje ? '#0F6E56' : '#aaa', fontWeight: d.hoje ? 600 : 400 }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [pedidosSemana, setPedidosSemana] = useState([])
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    // Busca últimos 7 dias para o gráfico
    const promises = []
    const dias = []
    const labelDia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    // Semana atual: começa no domingo desta semana
    const inicioDaSemana = new Date(hoje)
    inicioDaSemana.setDate(hoje.getDate() - hoje.getDay()) // volta para o domingo
    for (let i = 0; i <= 6; i++) {
      const d = new Date(inicioDaSemana)
      d.setDate(inicioDaSemana.getDate() + i)
      const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const ehHoje = d.toDateString() === hoje.toDateString()
      dias.push({ str, label: labelDia[d.getDay()], hoje: ehHoje })
      promises.push(api.get(`/pedidos?data=${str}`))
    }

    Promise.all([
      api.get('/dashboard/hoje'),
      api.get(`/pedidos?data=${hojeStr}`),
      ...promises
    ]).then(([r1, r2, ...semana]) => {
      setResumo(r1.data)
      setPedidos(r2.data.slice(0, 8))
      setPedidosSemana(dias.map((d, i) => ({
        label: d.label,
        valor: semana[i].data.length,
        hoje: d.hoje
      })))
    })
    .catch(console.error)
    .finally(() => setCarregando(false))
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  if (carregando) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}>Carregando...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Painel geral</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' }}>{hoje}</div>
        </div>
        <button onClick={() => navigate('/pedidos/novo')}
          style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Novo pedido
        </button>
      </div>

      {/* Cards linha 1 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Card label="Pedidos hoje" valor={resumo?.totalPedidos ?? 0} sub="solicitações registradas" />
        <Card label="Pendentes" valor={resumo?.pedidosPendentes ?? 0} sub="aguardando confirmação" cor={resumo?.pedidosPendentes > 0 ? '#BA7517' : '#111'} />
        <Card label="vigilantes escalados" valor={resumo?.totalVigias ?? 0} sub="vigilantes em serviço hoje" />
        <Card label="Custo estimado hoje" valor={fmt(resumo?.custoEstimado ?? 0)} sub={`R$ ${resumo?.valorDiaria}/h × 12h por vigilante`} destaque />
      </div>

      {/* Cards linha 2 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Card label="Pontos registrados" valor={resumo?.totalPontos ?? 0} sub="entradas e saídas" />
        <Card label="Pontos abertos" valor={resumo?.pontosAbertos ?? 0} sub="aguardando confirmação" cor={resumo?.pontosAbertos > 0 ? '#E24B4A' : '#111'} />
        <Card label="Unidades ativas" valor={resumo?.totalUnidades ?? 0} sub="cadastradas no sistema" />

        {/* Gráfico 7 dias */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.2rem 1.5rem' }}>
          <GraficoBarras dados={pedidosSemana} label="Pedidos — últimos 7 dias" />
        </div>
      </div>

      {/* Alerta pendentes */}
      {resumo?.pedidosPendentes > 0 && (
        <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#633806', display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>{resumo.pedidosPendentes} pedido(s)</strong> pendentes — confirme para entrar na folha.
          <span style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/pedidos')}>Ver pedidos</span>
        </div>
      )}

      {/* Tabela pedidos */}
      <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Pedidos de hoje</div>
          <span style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }} onClick={() => navigate('/pedidos')}>Ver todos</span>
        </div>
        {pedidos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
            Nenhum pedido hoje.{' '}
            <span style={{ color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/pedidos/novo')}>Criar pedido</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Unidade', 'Cidade', 'Turno', 'Vigias', 'Custo', 'Status'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#888', borderBottom: '1px solid #EAECF0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => {
                const vigias = (p.qtdVigiaDia || 0) + (p.qtdVigiNoite || 0)
                const custo = vigias * 12 * (resumo?.valorDiaria || 180)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F5F6FA' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 16px', fontWeight: 500 }}>{p.unidade?.nome}</td>
                    <td style={{ padding: '11px 16px', color: '#666' }}>{p.unidade?.cidade}</td>
                    <td style={{ padding: '11px 16px', color: '#666' }}>{p.turno}</td>
                    <td style={{ padding: '11px 16px', color: '#666' }}>{vigias} vigilante(s)</td>
                    <td style={{ padding: '11px 16px', color: '#0F6E56', fontWeight: 500 }}>{fmt(custo)}</td>
                    <td style={{ padding: '11px 16px' }}><Badge status={p.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
