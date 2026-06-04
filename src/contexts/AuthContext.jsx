import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
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
    setUsuario(res.data.usuario)
    return res.data.usuario
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
