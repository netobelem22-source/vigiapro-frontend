import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Marcou "lembrar-me" no login: token fica em localStorage e sobrevive a novas sessões/abas
    const tokenLembrado = localStorage.getItem('token')
    if (tokenLembrado) {
      api.get('/auth/me')
        .then(res => setUsuario(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setCarregando(false))
      return
    }

    // Sem "lembrar-me": verifica se é uma nova sessão do navegador
    const sessaoAtiva = sessionStorage.getItem('sessao_ativa')
    if (!sessaoAtiva) {
      // Nova sessão — limpa qualquer token antigo
      sessionStorage.clear()
      sessionStorage.setItem('sessao_ativa', '1')
      setCarregando(false)
      return
    }

    const token = sessionStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUsuario(res.data))
        .catch(() => sessionStorage.removeItem('token'))
        .finally(() => setCarregando(false))
    } else {
      setCarregando(false)
    }
  }, [])

  const login = async (email, senha, lembrar = false) => {
    const res = await api.post('/auth/login', { email, senha })
    if (lembrar) {
      localStorage.setItem('token', res.data.token)
    } else {
      sessionStorage.setItem('token', res.data.token)
      sessionStorage.setItem('sessao_ativa', '1')
    }
    setUsuario(res.data.usuario)
    return res.data.usuario
  }

  const logout = () => {
    sessionStorage.clear()
    localStorage.removeItem('token')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
