import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { tocarLembrete } from '../utils/som'

const INTERVALO_VERIFICACAO = 60000 // 60s — confere se há pendência nova
const INTERVALO_REPETICAO = 5 * 60000 // 5min — repete o alerta enquanto a pendência não for resolvida

// Toca um lembrete sonoro (+ dispara um alerta visual) quando há pedidos pendentes ou
// check-ins aguardando confirmação. Ativo em qualquer tela do painel (chamado a partir
// do Layout), enquanto a aba estiver aberta.
export function useLembretePendencias(ativo) {
  const [estado, setEstado] = useState({ pedidosPendentes: 0, pontosAbertos: 0, alertaVersao: 0 })
  const totalAnteriorRef = useRef(0)
  const ultimoAlertaRef = useRef(0)
  const versaoRef = useRef(0)

  useEffect(() => {
    if (!ativo) return

    const verificar = () => {
      api.get('/dashboard/hoje').then(r => {
        const pedidosPendentes = r.data.pedidosPendentesTotal || 0
        const pontosAbertos = r.data.pontosAbertosTotal || 0
        const total = pedidosPendentes + pontosAbertos

        if (total > 0) {
          const agora = Date.now()
          const aumentou = total > totalAnteriorRef.current
          const primeiraVez = ultimoAlertaRef.current === 0
          const passouIntervalo = agora - ultimoAlertaRef.current >= INTERVALO_REPETICAO
          if (aumentou || primeiraVez || passouIntervalo) {
            tocarLembrete()
            ultimoAlertaRef.current = agora
            versaoRef.current += 1
          }
        } else {
          ultimoAlertaRef.current = 0
        }
        totalAnteriorRef.current = total
        setEstado({ pedidosPendentes, pontosAbertos, alertaVersao: versaoRef.current })
      }).catch(() => {})
    }

    verificar()
    const id = setInterval(verificar, INTERVALO_VERIFICACAO)
    return () => clearInterval(id)
  }, [ativo])

  return estado
}
