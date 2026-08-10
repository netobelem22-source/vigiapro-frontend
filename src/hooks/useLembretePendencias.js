import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { tocarLembrete } from '../utils/som'

const INTERVALO_VERIFICACAO = 60000 // 60s — confere se há pendência nova
const INTERVALO_REPETICAO = 5 * 60000 // 5min — repete o som enquanto a pendência não for resolvida

// Toca um lembrete sonoro quando há pedidos pendentes ou check-ins aguardando confirmação.
// Ativo em qualquer tela do painel (chamado a partir do Layout), enquanto a aba estiver aberta.
export function useLembretePendencias(ativo) {
  const [totalPendencias, setTotalPendencias] = useState(0)
  const totalAnteriorRef = useRef(0)
  const ultimoSomRef = useRef(0)

  useEffect(() => {
    if (!ativo) return

    const verificar = () => {
      api.get('/dashboard/hoje').then(r => {
        const total = (r.data.pedidosPendentesTotal || 0) + (r.data.pontosAbertosTotal || 0)
        setTotalPendencias(total)

        if (total > 0) {
          const agora = Date.now()
          const aumentou = total > totalAnteriorRef.current
          const primeiraVez = ultimoSomRef.current === 0
          const passouIntervalo = agora - ultimoSomRef.current >= INTERVALO_REPETICAO
          if (aumentou || primeiraVez || passouIntervalo) {
            tocarLembrete()
            ultimoSomRef.current = agora
          }
        } else {
          ultimoSomRef.current = 0
        }
        totalAnteriorRef.current = total
      }).catch(() => {})
    }

    verificar()
    const id = setInterval(verificar, INTERVALO_VERIFICACAO)
    return () => clearInterval(id)
  }, [ativo])

  return totalPendencias
}
