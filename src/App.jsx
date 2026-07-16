import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import NovoPedido from './pages/NovoPedido'
import Pontos from './pages/Pontos'
import Relatorio from './pages/Relatorio'
import Unidades from './pages/Unidades'
import Usuarios from './pages/Usuarios'
import Folha from './pages/Folha'
import PontoLink from './pages/PontoLink'
import Layout from './components/layout/Layout'

const RotaProtegida = ({ children }) => {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontFamily: 'sans-serif' }}>Carregando...</div>
  return usuario ? children : <Navigate to="/login" replace />
}

const PainelInicial = () => {
  const { usuario } = useAuth()
  return usuario?.role === 'TERCEIRO' ? <Navigate to="/pedidos" replace /> : <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/ponto/:token" element={<PontoLink />} />
          <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
            <Route index element={<PainelInicial />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="pedidos/novo" element={<NovoPedido />} />
            <Route path="pontos" element={<Pontos />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="relatorio" element={<Relatorio />} />
            <Route path="folha" element={<Folha />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
