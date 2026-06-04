import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Verifica se é uma nova sessão do navegador
    const sessaoAtiva = sessionStorage.getItem('sessao_ativa')
    if (!sessaoAtiva) {
      // Nova sessão — limpa qualquer token antigo
      sessionStorage.clear()
      localStorage.removeItem('token')
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

  const login = async (email, senha) => {
    const res = await api.post('/auth/login', { email, senha })
    sessionStorage.setItem('token', res.data.token)
    sessionStorage.setItem('sessao_ativa', '1')
    setUsuario(res.data.usuario)
    return res.data.usuario
  }

  const logout = () => {
    sessionStorage.clear()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
