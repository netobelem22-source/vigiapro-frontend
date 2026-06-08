export default function Paginacao({ pagina, paginas, total, onChange }) {
  if (paginas <= 1) return null

  const gerarPaginas = () => {
    if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1)
    const items = [1]
    if (pagina > 3) items.push('...')
    for (let i = Math.max(2, pagina - 1); i <= Math.min(paginas - 1, pagina + 1); i++) items.push(i)
    if (pagina < paginas - 2) items.push('...')
    items.push(paginas)
    return items
  }

  const Btn = ({ label, onClick, disabled, active }) => (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
      border: `1px solid ${active ? '#0F6E56' : '#ddd'}`,
      background: active ? '#0F6E56' : disabled ? '#f9f9f9' : '#fff',
      color: active ? '#fff' : disabled ? '#ccc' : '#555',
      cursor: disabled ? 'default' : 'pointer',
      fontSize: 13, fontWeight: active ? 600 : 400, lineHeight: '30px'
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #EAECF0' }}>
      <span style={{ fontSize: 12, color: '#888' }}>{total} resultado{total !== 1 ? 's' : ''}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Btn label="←" onClick={() => onChange(pagina - 1)} disabled={pagina === 1} />
        {gerarPaginas().map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#999', fontSize: 13, lineHeight: '32px' }}>…</span>
            : <Btn key={p} label={p} onClick={() => onChange(p)} active={p === pagina} />
        )}
        <Btn label="→" onClick={() => onChange(pagina + 1)} disabled={pagina === paginas} />
      </div>
    </div>
  )
}
