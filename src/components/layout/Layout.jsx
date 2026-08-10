import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLembretePendencias } from '../../hooks/useLembretePendencias'
import { pararLembrete } from '../../utils/som'

const navItems = [
  { to: '/',          label: 'Painel' },
  { to: '/pedidos',   label: 'Pedidos', badgeKey: 'pedidosPendentes' },
  { to: '/pontos',    label: 'Check-in', badgeKey: 'pontosAbertos' },
  { to: '/unidades',  label: 'Unidades' },
  { to: '/usuarios',  label: 'Usuários' },
  { to: '/relatorio', label: 'Relatório' },
  { to: '/folha',     label: 'Financeiro' },
]

const ToastPendencias = ({ pedidosPendentes, pontosAbertos, onFechar }) => {
  const navigate = useNavigate()
  const partes = []
  if (pedidosPendentes > 0) partes.push(`${pedidosPendentes} pedido(s) pendente(s)`)
  if (pontosAbertos > 0) partes.push(`${pontosAbertos} check-in(s) aguardando confirmação`)

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, width: 320, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.16)', border: '1px solid #FAC775', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>🔔</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>Pendências de confirmação</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{partes.join(' · ')}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {pedidosPendentes > 0 && (
              <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => { navigate('/pedidos'); onFechar() }}>Ver pedidos</span>
            )}
            {pontosAbertos > 0 && (
              <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => { navigate('/pontos'); onFechar() }}>Ver check-ins</span>
            )}
          </div>
        </div>
        <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => { logout(); navigate('/login') }
  const roleLabel = { GESTOR: 'Gestor', GERENTE: 'Gerente', VIGIA: 'Vigia', TERCEIRO: 'Terceiro' }
  const itensMenu = usuario?.role === 'TERCEIRO' ? navItems.filter(i => i.to === '/pedidos') : navItems
  const { pedidosPendentes, pontosAbertos, alertaVersao } = useLembretePendencias(['GESTOR', 'GERENTE', 'TERCEIRO'].includes(usuario?.role))
  const [mostrarToast, setMostrarToast] = useState(false)

  // Mostra o alerta visual toda vez que o lembrete sonoro dispara, some sozinho depois de um tempo
  useEffect(() => {
    if (alertaVersao === 0) return
    setMostrarToast(true)
    const t = setTimeout(() => setMostrarToast(false), 15000)
    return () => clearTimeout(t)
  }, [alertaVersao])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #EAECF0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #EAECF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#0F6E56', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F6E56', lineHeight: 1 }}>VigilantePro</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>gestão de vigilância</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb', padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Menu</div>
          {itensMenu.map(item => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            const badge = item.badgeKey === 'pedidosPendentes' ? pedidosPendentes : item.badgeKey === 'pontosAbertos' ? pontosAbertos : 0
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, marginBottom: 2, color: active ? '#0F6E56' : '#555', background: active ? '#E8F5F1' : 'transparent', textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                <span>{item.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {badge > 0 && <span style={{ background: '#E24B4A', color: '#fff', borderRadius: 20, minWidth: 17, height: 17, padding: '0 5px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
                  {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0F6E56' }} />}
                </span>
              </NavLink>
            )
          })}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #EAECF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0F6E56', flexShrink: 0 }}>
              {usuario?.nome?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nome}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{roleLabel[usuario?.role]}</div>
            </div>
            <button onClick={handleLogout} title="Sair"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 2, display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 220, padding: '28px 32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
      {mostrarToast && (pedidosPendentes > 0 || pontosAbertos > 0) && (
        <ToastPendencias pedidosPendentes={pedidosPendentes} pontosAbertos={pontosAbertos} onFechar={() => { setMostrarToast(false); pararLembrete() }} />
      )}
    </div>
  )
}
