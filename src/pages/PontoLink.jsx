import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function PontoLink() {
  const { token } = useParams()
  const [etapa, setEtapa] = useState('carregando') // carregando | info | nome | camera | gps | enviando | sucesso | erro
  const [dadosLink, setDadosLink] = useState(null)
  const [erro, setErro] = useState('')
  const [nomeVigia, setNomeVigia] = useState('')
  const [fotoBase64, setFotoBase64] = useState(null)
  const [localizacao, setLocalizacao] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    api.get(`/links/ponto/${token}`)
      .then(r => { setDadosLink(r.data); setEtapa('nome') })
      .catch(err => {
        setErro(err.response?.data?.erro || 'Link inválido ou expirado')
        setEtapa('erro')
      })
  }, [token])

  const abrirCamera = async () => {
    setEtapa('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setErro('Não foi possível acessar a câmera.')
      setEtapa('info')
    }
  }

  const tirarFoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.7)
    setFotoBase64(base64)
    streamRef.current?.getTracks().forEach(t => t.stop())
    capturarGPS(base64)
  }

  const capturarGPS = async (foto) => {
    setEtapa('gps')
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
      )
      setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      enviar(foto, { latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    } catch {
      // GPS falhou, envia sem
      enviar(foto, null)
    }
  }

  const enviar = async (foto, loc) => {
    setEtapa('enviando')
    try {
      await api.post(`/links/ponto/${token}`, {
        latitude: loc?.latitude || null,
        longitude: loc?.longitude || null,
        fotoBase64: foto,
        nomeVigia
      })
      setEtapa('sucesso')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar check-in')
      setEtapa('erro')
    }
  }

  const corTipo = dadosLink?.tipo === 'ENTRADA' ? '#0F6E56' : '#E24B4A'
  const labelTipo = dadosLink?.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'

  const s = {
    container: { minHeight: '100vh', background: '#F5F6FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' },
    header: { background: corTipo, padding: '24px 20px 20px', color: '#fff' },
    logo: { fontSize: 13, opacity: 0.8, marginBottom: 8 },
    titulo: { fontSize: 22, fontWeight: 800 },
    subtitulo: { fontSize: 14, opacity: 0.8, marginTop: 4 },
    body: { flex: 1, padding: '20px 16px' },
    card: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    label: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
    valor: { fontSize: 15, fontWeight: 500, color: '#111' },
    btn: { width: '100%', padding: '16px', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', color: '#fff', marginBottom: 10 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, boxSizing: 'border-box', marginBottom: 16 }
  }

  if (etapa === 'carregando') return (
    <div style={{ ...s.container, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Carregando...</div>
    </div>
  )

  if (etapa === 'erro') return (
    <div style={s.container}>
      <div style={{ ...s.header, background: '#E24B4A' }}>
        <div style={s.logo}>VigiaPro</div>
        <div style={s.titulo}>Link inválido</div>
      </div>
      <div style={s.body}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 16, color: '#991B1B', fontSize: 14 }}>{erro}</div>
      </div>
    </div>
  )

  if (etapa === 'sucesso') return (
    <div style={s.container}>
      <div style={{ ...s.header, background: corTipo }}>
        <div style={s.logo}>VigiaPro</div>
        <div style={s.titulo}>{labelTipo} registrada!</div>
      </div>
      <div style={{ ...s.body, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#E8F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8, textAlign: 'center' }}>Check-in registrado com sucesso!</div>
        <div style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 1.6 }}>
          {labelTipo} registrada às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.{'\n'}
          Aguarde confirmação do gerente.
        </div>
      </div>
    </div>
  )

  if (etapa === 'camera') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <video ref={videoRef} autoPlay playsInline style={{ flex: 1, width: '100%', objectFit: 'cover' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ padding: '20px 16px', background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>Centralize seu rosto e tire a foto</div>
        <button onClick={tirarFoto}
          style={{ width: 70, height: 70, borderRadius: 35, background: '#fff', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer' }} />
      </div>
    </div>
  )

  if (etapa === 'gps' || etapa === 'enviando') return (
    <div style={{ ...s.container, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: '#888' }}>{etapa === 'gps' ? 'Capturando localização...' : 'Registrando check-in...'}</div>
    </div>
  )

  return (
    <div style={s.container}>
      <div style={{ ...s.header, background: corTipo }}>
        <div style={s.logo}>VigiaPro</div>
        <div style={s.titulo}>Registrar {labelTipo}</div>
        <div style={s.subtitulo}>{dadosLink?.unidade} — {dadosLink?.cidade}</div>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.label}>Unidade</div>
          <div style={s.valor}>{dadosLink?.unidade}</div>
          {dadosLink?.endereco && <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{dadosLink.endereco}</div>}
        </div>

        <div style={s.card}>
          <div style={s.label}>Seu nome</div>
          <input
            style={s.input}
            placeholder="Digite seu nome completo"
            value={nomeVigia}
            onChange={e => setNomeVigia(e.target.value)}
          />
          <div style={{ fontSize: 12, color: '#888' }}>
            Link válido até {dadosLink?.expiresAt ? new Date(dadosLink.expiresAt).toLocaleString('pt-BR') : ''}
          </div>
        </div>

        <button
          style={{ ...s.btn, background: nomeVigia.trim().length < 2 ? '#9CA3AF' : corTipo }}
          disabled={nomeVigia.trim().length < 2}
          onClick={abrirCamera}>
          Tirar foto e registrar {labelTipo.toLowerCase()}
        </button>

        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
          Será tirada uma foto com a câmera frontal e capturada sua localização GPS para validar o registro.
        </div>
      </div>
    </div>
  )
}
