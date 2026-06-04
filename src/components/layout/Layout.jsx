import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/',          label: 'Painel' },
  { to: '/pedidos',   label: 'Pedidos' },
  { to: '/pontos',    label: 'Pontos' },
  { to: '/unidades',  label: 'Unidades' },
  { to: '/usuarios',  label: 'Usuários' },
  { to: '/relatorio', label: 'Relatório' },
  { to: '/folha',     label: 'Folha de pagamento' },
]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => { logout(); navigate('/login') }
  const roleLabel = { GESTOR: 'Gestor', GERENTE: 'Gerente', VIGIA: 'Vigia' }

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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F6E56', lineHeight: 1 }}>VigiaPro</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>gestão de vigilância</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb', padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Menu</div>
          {navItems.map(item => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, marginBottom: 2, color: active ? '#0F6E56' : '#555', background: active ? '#E8F5F1' : 'transparent', textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                <span>{item.label}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0F6E56' }} />}
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
    </div>
  )
}
