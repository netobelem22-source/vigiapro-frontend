import { useEffect, useRef } from 'react'

/**
 * Chama fn() quando:
 * 1. deps mudam (igual useEffect normal)
 * 2. usuário volta pra aba (visibilitychange)
 * 3. janela ganha foco (alt+tab de volta)
 * 4. a cada intervalMs com a aba aberta (padrão 5min)
 */
export function useAutoRefresh(fn, deps = [], intervalMs = 300000) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  // chamada normal por deps (inclui mount)
  useEffect(() => {
    fnRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // visibilidade + foco
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fnRef.current()
    }
    const onFocus = () => fnRef.current()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // polling periódico
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fnRef.current()
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
