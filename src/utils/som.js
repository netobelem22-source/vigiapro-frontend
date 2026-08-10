// Toca um aviso sonoro curto (dois tons) sem depender de nenhum arquivo de áudio.
// Precisa de uma interação do usuário na página antes (política de autoplay dos navegadores) —
// como o gestor já está navegando no painel, isso normalmente já foi satisfeito.
export const tocarLembrete = () => {
  try {
    const AudioContextRef = window.AudioContext || window.webkitAudioContext
    if (!AudioContextRef) return
    const ctx = new AudioContextRef()
    const tocarTom = (freq, inicio, duracao) => {
      const osc = ctx.createOscillator()
      const ganho = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      ganho.gain.setValueAtTime(0, ctx.currentTime + inicio)
      ganho.gain.linearRampToValueAtTime(0.15, ctx.currentTime + inicio + 0.02)
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao)
      osc.connect(ganho)
      ganho.connect(ctx.destination)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    }
    tocarTom(880, 0, 0.18)
    tocarTom(1174, 0.16, 0.22)
    setTimeout(() => ctx.close(), 600)
  } catch {
    // ambiente sem suporte a Web Audio — silenciosamente ignora
  }
}
