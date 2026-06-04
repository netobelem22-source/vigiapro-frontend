import { useState } from 'react'

// Converte YYYY-MM-DD para DD/MM/YYYY (display)
export const formatarData = (iso) => {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// Converte DD/MM/YYYY para YYYY-MM-DD (value)
export const parsearData = (br) => {
  if (!br) return ''
  const parts = br.replace(/\D/g, '')
  if (parts.length < 8) return ''
  return `${parts.slice(4,8)}-${parts.slice(2,4)}-${parts.slice(0,2)}`
}

export default function InputData({ value, onChange, style = {}, ...props }) {
  const [display, setDisplay] = useState(formatarData(value))

  const handleChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = v
    if (v.length > 2) formatted = v.slice(0,2) + '/' + v.slice(2)
    if (v.length > 4) formatted = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4)
    setDisplay(formatted)
    if (v.length === 8) {
      const iso = `${v.slice(4,8)}-${v.slice(2,4)}-${v.slice(0,2)}`
      onChange({ target: { value: iso } })
    }
  }

  // Sincroniza display quando value muda externamente
  const displayValue = display || formatarData(value)

  return (
    <input
      {...props}
      value={displayValue}
      onChange={handleChange}
      placeholder="DD/MM/AAAA"
      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, ...style }}
    />
  )
}
