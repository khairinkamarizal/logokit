export function fileToText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsText(file)
  })
}
export function parseSvg(svgText: string): SVGElement {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG file')
  const el = doc.documentElement
  if (!el || el.tagName.toLowerCase() !== 'svg') throw new Error('Invalid SVG file')
  return el as SVGElement
}
export function getDimensions(svgEl: SVGElement): { width: number; height: number } {
  const vb = svgEl.getAttribute('viewBox')
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0)
      return { width: parts[2], height: parts[3] }
  }
  const w = parseFloat(svgEl.getAttribute('width') ?? '')
  const h = parseFloat(svgEl.getAttribute('height') ?? '')
  return { width: Number.isFinite(w) && w > 0 ? w : 800, height: Number.isFinite(h) && h > 0 ? h : 600 }
}
export function hasExternalImages(svgEl: SVGElement): string[] {
  const urls: string[] = []
  svgEl.querySelectorAll('image').forEach((img) => {
    const href = img.getAttribute('href') ?? img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
    if (href && !href.startsWith('data:')) urls.push(href)
  })
  return urls
}
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error(url))
    r.readAsDataURL(blob)
  })
}
export async function embedImages(svgEl: SVGElement): Promise<void> {
  const urls = hasExternalImages(svgEl)
  await Promise.all(urls.map(async (u) => {
    const data = await toDataUrl(u)
    svgEl.querySelectorAll('image').forEach((img) => {
      const href = img.getAttribute('href') ?? img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
      if (href === u) {
        img.setAttribute('href', data)
        img.removeAttributeNS('http://www.w3.org/1999/xlink', 'href')
      }
    })
  }))
}
const SKIP_FILL = /^(none|transparent|url\()/i
export function recolorSvg(svgEl: SVGElement, hex: string): void {
  const walk = (el: Element) => {
    if (el.tagName.toLowerCase() === 'stop') {
      const cur = el.getAttribute('stop-color')
      if (!cur || !SKIP_FILL.test(cur)) el.setAttribute('stop-color', hex)
    }
    else {
      const cur = el.getAttribute('fill')
      if (cur !== null && SKIP_FILL.test(cur)) {
        // skip
      }
      else if (cur !== null) {
        el.setAttribute('fill', hex)
      }
      const style = el.getAttribute('style')
      if (style && /fill\s*:/.test(style))
        el.setAttribute('style', style.replace(/fill\s*:\s*[^;"]+/g, `fill: ${hex}`))
    }
    for (const child of Array.from(el.children)) walk(child)
  }
  for (const child of Array.from(svgEl.children)) walk(child)
  svgEl.setAttribute('fill', hex)
}
export function grayscaleSvg(svgEl: SVGElement): void {
  const style = svgEl.getAttribute('style') ?? ''
  if (!/grayscale\s*\(/.test(style)) {
    const base = style && !style.endsWith(';') ? `${style};` : style
    svgEl.setAttribute('style', `${base} filter: grayscale(1)`.trim())
  }
}
export function svgToText(svgEl: SVGElement): string {
  return new XMLSerializer().serializeToString(svgEl)
}
export function makePlaceholderSvg(name: string): string {
  const esc = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E5E7EB"/><text x="400" y="300" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="48" fill="#9CA3AF">${esc}</text></svg>`
}
