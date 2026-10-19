import { useMemo } from 'react'

// Braille dot bit positions within a 2x4 cell:
// 1 4        0x01 0x08
// 2 5   ->   0x02 0x10
// 3 6        0x04 0x20
// 7 8        0x40 0x80
export default function BrailleGraph({ data, height = 140, className = '' }) {
  const text = useMemo(() => {
    const cols = 128
    const rows = 40
    if (!data || data.length === 0) return ''
    const max = Math.max(...data, 1)

    const dots = new Uint8Array(cols * rows)
    for (let x = 0; x < cols; x++) {
      const pos = (x * (data.length - 1)) / (cols - 1)
      const i = Math.floor(pos)
      const t = pos - i
      const v =
        i >= data.length - 1 ? data[data.length - 1] : data[i] * (1 - t) + data[i + 1] * t
      const h = Math.round((v / max) * rows)
      for (let y = rows - h; y < rows; y++) dots[y * cols + x] = 1
    }

    const charsX = cols / 2
    const charsY = rows / 4
    let out = ''
    for (let cy = 0; cy < charsY; cy++) {
      for (let cx = 0; cx < charsX; cx++) {
        const x0 = cx * 2
        const y0 = cy * 4
        let byte = 0
        if (dots[y0 * cols + x0]) byte |= 0x01
        if (dots[(y0 + 1) * cols + x0]) byte |= 0x02
        if (dots[(y0 + 2) * cols + x0]) byte |= 0x04
        if (dots[(y0 + 3) * cols + x0]) byte |= 0x40
        if (dots[y0 * cols + x0 + 1]) byte |= 0x08
        if (dots[(y0 + 1) * cols + x0 + 1]) byte |= 0x10
        if (dots[(y0 + 2) * cols + x0 + 1]) byte |= 0x20
        if (dots[(y0 + 3) * cols + x0 + 1]) byte |= 0x80
        out += byte ? String.fromCodePoint(0x2800 + byte) : ' '
      }
      out += '\n'
    }
    return out
  }, [data])

  if (!text) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-slate-600 ${className}`}
        style={{ height }}
      >
        No data yet
      </div>
    )
  }

  return (
    <pre
      className={`overflow-hidden ${className}`}
      style={{
        height,
        fontSize: 11,
        lineHeight: '14px',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundImage:
          'linear-gradient(to top, #4c1d95 0%, #7c3aed 45%, #db2777 70%, #f97316 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        whiteSpace: 'pre',
        margin: 0,
      }}
    >
      {text}
    </pre>
  )
}
