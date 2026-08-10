// Toca um alerta sonoro chamativo (bipe duplo, repetido) por 15 segundos, sem depender de
// nenhum arquivo de áudio. Precisa de uma interação do usuário na página antes (política de
// autoplay dos navegadores) — como o gestor já está navegando no painel, isso normalmente já
// foi satisfeito.
const DURACAO_TOTAL_MS = 15000
const INTERVALO_ENTRE_BIPES_MS = 1100

let contextoAtivo = null
let intervalId = null
let timeoutId = null

const bipeDuplo = (ctx) => {
  const tocarTom = (freq, inicio, duracao, volume) => {
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    ganho.gain.setValueAtTime(0, ctx.currentTime + inicio)
    ganho.gain.linearRampToValueAtTime(volume, ctx.currentTime + inicio + 0.015)
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao)
    osc.connect(ganho)
    ganho.connect(ctx.destination)
    osc.start(ctx.currentTime + inicio)
    osc.stop(ctx.currentTime + inicio + duracao)
  }
  tocarTom(1046, 0, 0.16, 0.22)
  tocarTom(1046, 0.22, 0.16, 0.22)
}

// Interrompe um alerta em andamento (ex: usuário fechou o aviso na tela antes dos 15s)
export const pararLembrete = () => {
  if (intervalId) clearInterval(intervalId)
  if (timeoutId) clearTimeout(timeoutId)
  if (contextoAtivo) contextoAtivo.close().catch(() => {})
  intervalId = null
  timeoutId = null
  contextoAtivo = null
}

export const tocarLembrete = () => {
  try {
    const AudioContextRef = window.AudioContext || window.webkitAudioContext
    if (!AudioContextRef) return
    pararLembrete() // não sobrepõe se já tiver um alerta tocando

    const ctx = new AudioContextRef()
    contextoAtivo = ctx
    bipeDuplo(ctx)
    intervalId = setInterval(() => bipeDuplo(ctx), INTERVALO_ENTRE_BIPES_MS)
    timeoutId = setTimeout(pararLembrete, DURACAO_TOTAL_MS)
  } catch {
    // ambiente sem suporte a Web Audio — silenciosamente ignora
  }
}
