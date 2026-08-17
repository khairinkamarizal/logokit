export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
export function isValidHex(s: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(s.trim()) || /^#?[0-9A-Fa-f]{3}$/.test(s.trim())
}
export function rgbToCmyk(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const k = 1 - Math.max(rr, gg, bb)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - rr - k) / (1 - k)) * 100),
    m: Math.round(((1 - gg - k) / (1 - k)) * 100),
    y: Math.round(((1 - bb - k) / (1 - k)) * 100),
    k: Math.round(k * 100)
  }
}
export function cmykToRgb(c: number, m: number, y: number, k: number) {
  const f = (v: number) => 255 * (1 - v / 100) * (1 - k / 100)
  return { r: Math.round(f(c)), g: Math.round(f(m)), b: Math.round(f(y)) }
}
export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
export function textColorOn(hex: string): '#000000' | '#ffffff' {
  return relativeLuminance(hexToRgb(hex)) > 0.5 ? '#000000' : '#ffffff'
}
export function dominantColorFromSvg(svgText: string): string | null {
  const colors: string[] = []
  const attrRe = /(?:fill|stop-color)\s*=\s*"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(svgText))) {
    const v = m[1].trim().toLowerCase()
    if (v.startsWith('#') && (v.length === 4 || v.length === 7)) colors.push(rgbToHex(...Object.values(hexToRgb(v)) as [number, number, number]))
  }
  const styleRe = /(?:fill|stop-color)\s*:\s*(#[0-9a-f]{3,6})/gi
  while ((m = styleRe.exec(svgText))) {
    const v = m[1].toLowerCase()
    if (v.length === 4 || v.length === 7) colors.push(v)
  }
  const counts = new Map<string, number>()
  for (const c of colors) {
    const { r, g, b } = hexToRgb(c)
    if (r < 32 && g < 32 && b < 32) continue
    if (r > 224 && g > 224 && b > 224) continue
    if (Math.max(r, g, b) - Math.min(r, g, b) < 16) continue
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  let best: string | null = null, n = 0
  for (const [c, i] of counts) if (i > n) { best = c; n = i }
  return best
}
export function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}
