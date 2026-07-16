import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import Paginacao from '../components/Paginacao'

const ModalValorGlobal = ({ onClose, onSalvo }) => {
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!valor || parseFloat(valor) <= 0) return alert('Informe um valor válido')
    setSalvando(true)
    try {
      const res = await api.get('/unidades?limit=1000')
      await Promise.all((res.data.unidades || []).map(u => api.put(`/unidades/${u.id}`, { ...u, valorDiaria: parseFloat(valor) })))
      await api.put('/configuracao', { valorDiaria: parseFloat(valor) })
      onSalvo()
    } catch { alert('Erro ao atualizar valores') }
    finally { setSalvando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Alterar valor global</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
          Define o mesmo valor de diária para <strong>todas as unidades</strong> cadastradas.
        </p>
        <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
          Atenção: esta ação sobrescreve o valor de diária de todas as unidades.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Novo valor da diária (R$)</label>
          <input type="number" min="0" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
            placeholder="Ex: 210.00" autoFocus
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Aplicando...' : 'Aplicar a todas'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Modal = ({ unidade, onClose, onSaved }) => {
  const [form, setForm] = useState(unidade || { nome: '', cnpj: '', endereco: '', cidade: '', estado: 'SC', latitude: '', longitude: '', raioGps: 200, valorDiaria: '', empresaId: '' })
  const [empresas, setEmpresas] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    api.get('/empresas').then(r => {
      setEmpresas(r.data)
      if (!form.empresaId && r.data.length > 0) setForm(f => ({ ...f, empresaId: r.data[0].id }))
    }).catch(() => {})
  }, [])

  // Carrega Leaflet e inicializa mapa
  useEffect(() => {
    if (!form.latitude || !form.longitude) return

    const initMap = () => {
      setTimeout(() => {
        if (!mapRef.current) return
        const L = window.L
        const lat = parseFloat(form.latitude)
        const lng = parseFloat(form.longitude)

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 16)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapInstanceRef.current)
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current)
          markerRef.current.on('dragend', e => {
            const p = e.target.getLatLng()
            setForm(f => ({ ...f, latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6) }))
          })
          L.circle([lat, lng], {
            radius: parseInt(form.raioGps) || 200,
            color: '#0F6E56', fillColor: '#0F6E56', fillOpacity: 0.15
          }).addTo(mapInstanceRef.current)
        } else {
          mapInstanceRef.current.setView([lat, lng], 16)
          markerRef.current.setLatLng([lat, lng])
        }
      }, 200)
    }

    if (window.L) {
      initMap()
    } else {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    }
  }, [form.latitude, form.longitude])

  const abrirMaps = () => {
    const q = encodeURIComponent(`${form.endereco || ''} ${form.cidade || ''} ${form.estado || ''} Brasil`)
    window.open(`https://www.google.com/maps/search/${q}`, '_blank')
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const data = { ...form, latitude: parseFloat(form.latitude) || null, longitude: parseFloat(form.longitude) || null, raioGps: parseInt(form.raioGps) || 200, valorDiaria: parseFloat(form.valorDiaria) || null }
      if (unidade?.id) await api.put(`/unidades/${unidade.id}`, data)
      else await api.post('/unidades', data)
      onSaved()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const inp = (label, campo, tipo = 'text', props = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{label}</label>
      <input type={tipo} value={form[campo] ?? ''} onChange={e => set(campo, e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} {...props} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.8rem', width: 580, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{unidade?.id ? 'Editar unidade' : 'Nova unidade'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>{inp('Nome da unidade', 'nome', 'text', { required: true, placeholder: 'Ex: Supermercado Centro' })}</div>
            <div style={{ gridColumn: '1/-1' }}>{inp('CNPJ', 'cnpj', 'text', { placeholder: '00.000.000/0001-00' })}</div>
            <div style={{ gridColumn: '1/-1' }}>{inp('Endereço', 'endereco', 'text', { placeholder: 'Rua, número' })}</div>
            {inp('Cidade', 'cidade', 'text', { required: true })}
            {inp('Estado', 'estado', 'text', { maxLength: 2, placeholder: 'SC' })}
          </div>

          {/* Seção GPS com mapa */}
          <div style={{ background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: 12, padding: '14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Localização GPS</div>
              <button type="button" onClick={abrirMaps}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Abrir no Maps
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              {inp('Latitude', 'latitude', 'text', { placeholder: '-27.5954' })}
              {inp('Longitude', 'longitude', 'text', { placeholder: '-48.5480' })}
              {inp('Raio GPS (metros)', 'raioGps', 'number', { min: 50 })}
            </div>

            {/* Mini mapa */}
            {form.latitude && form.longitude ? (
              <div>
                <div ref={mapRef} style={{ width: '100%', height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #EAECF0' }} />
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>1. Clique em 'Abrir no Maps' · 2. Clique com botão direito no local · 3. Copie as coordenadas e cole nos campos acima.</div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px dashed #ddd', borderRadius: 10, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
                Cole a Latitude e Longitude para ver o mapa. Use 'Abrir no Maps' para buscar.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {inp('Valor diária (R$)', 'valorDiaria', 'number', { min: 0, step: '0.01', placeholder: 'Ex: 210.00' })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Empresa</label>
              <select value={form.empresaId} onChange={e => set('empresaId', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>

          {erro && <div style={{ background: '#FCEBEB', color: '#501313', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>{erro}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={salvando} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Unidades() {
  const [unidades, setUnidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [modal, setModal] = useState(null)
  const [modalGlobal, setModalGlobal] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [paginas, setPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ totalUnidades: 0, totalCidades: 0, semValor: 0 })
  const paginaRef = useRef(1)

  const carregar = () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (buscaAtiva) params.append('busca', buscaAtiva)
    params.append('page', paginaRef.current)
    params.append('limit', 24)
    api.get(`/unidades?${params}`)
      .then(r => {
        setUnidades(r.data.unidades || [])
        setTotal(r.data.total ?? 0)
        setPaginas(r.data.paginas ?? 1)
        setPagina(r.data.pagina ?? 1)
        if (r.data.totalUnidades !== undefined) {
          setStats({ totalUnidades: r.data.totalUnidades, totalCidades: r.data.totalCidades, semValor: r.data.semValor })
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false))
  }

  // Debounce da busca: espera 350ms sem digitar antes de consultar o servidor
  useEffect(() => {
    const t = setTimeout(() => {
      paginaRef.current = 1
      setBuscaAtiva(busca)
    }, 350)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => { carregar() }, [buscaAtiva])

  const irParaPagina = (pg) => {
    paginaRef.current = pg
    setPagina(pg)
    carregar()
  }

  const { totalUnidades, totalCidades, semValor } = stats

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Unidades</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{totalUnidades} unidades em {totalCidades} cidades</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModalGlobal(true)}
            style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Definir valor global
          </button>
          <button onClick={() => setModal('novo')}
            style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Nova unidade
          </button>
        </div>
      </div>

      {semValor > 0 && (
        <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#633806', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><strong>{semValor} unidade(s)</strong> sem valor de diária configurado.</span>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setModalGlobal(true)}>Definir valor global</span>
        </div>
      )}

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou cidade..."
          style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
      </div>

      {carregando ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
      ) : unidades.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#999', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
          {busca ? 'Nenhuma unidade encontrada.' : <>Nenhuma unidade cadastrada.{' '}<span style={{ color: '#0F6E56', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setModal('novo')}>Cadastrar agora</span></>}
        </div>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {unidades.map(u => (
            <div key={u.id} onClick={() => setModal(u)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 12, padding: '1.1rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: '#E8F5F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {u.valorDiaria
                    ? <span style={{ background: '#E8F5F1', color: '#085041', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>R$ {Number(u.valorDiaria).toFixed(2)}</span>
                    : <span style={{ background: '#FAEEDA', color: '#633806', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>Sem valor</span>
                  }
                  <span style={{ background: u.ativo ? '#E8F5F1' : '#FCEBEB', color: u.ativo ? '#085041' : '#501313', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    {u.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 }}>{u.nome}</div>
              {u.cnpj && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{u.cnpj}</div>}
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{u.endereco}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{u.cidade} — {u.estado}</div>
              {u.latitude
                ? <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 4 }}>GPS configurado · Raio {u.raioGps}m</div>
                : <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 4 }}>GPS não configurado</div>
              }
              {u.empresa && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{u.empresa.nome}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #EAECF0', borderTop: 'none', borderRadius: '0 0 12px 12px', marginTop: -1 }}>
          <Paginacao pagina={pagina} paginas={paginas} total={total} onChange={irParaPagina} />
        </div>
        </>
      )}

      {modal && <Modal unidade={modal === 'novo' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); carregar() }} />}
      {modalGlobal && <ModalValorGlobal onClose={() => setModalGlobal(false)} onSalvo={() => { setModalGlobal(false); carregar() }} />}
    </div>
  )
}
