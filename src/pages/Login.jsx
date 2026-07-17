import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Email ou senha incorretos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Lado esquerdo — verde */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F6E56 0%, #0a4f3e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#fff' }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2.5rem' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>VigilantePro</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>gestão de vigilância</div>
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem' }}>
            Controle total da sua operação de segurança
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.7, marginBottom: '2rem' }}>
            Gerencie pedidos de vigilantes, registros de check-in, relatórios financeiros em um único lugar.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '▦', text: 'Painel em tempo real com custos do dia' },
              { icon: '✓', text: 'Check-in com GPS e foto' },
              { icon: '◎', text: 'Relatórios financeiros' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 13, opacity: 0.85 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div style={{ width: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 6 }}>Bem-vindo(a)</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: '2rem' }}>Entre com suas credenciais para acessar o sistema</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#0F6E56'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#0F6E56'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            {erro && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={carregando}
              style={{ width: '100%', padding: '12px', background: carregando ? '#9CA3AF' : '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: carregando ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}
