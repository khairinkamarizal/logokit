import { rgbToCmyk } from './color'

const SKIP = new Set(['defs', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'style', 'metadata', 'title', 'desc', 'symbol', 'use', 'image'])

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString()

function parseFill(el: Element): { r: number; g: number; b: number } | null {
  let v = el.getAttribute('fill')
  const style = el.getAttribute('style') ?? ''
  const m = style.match(/fill\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/)
  if (m) v = m[1]
  if (!v || v === 'none' || v.startsWith('url(') || v === 'transparent') return null
  if (v.startsWith('#')) {
    let h = v.slice(1)
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    const n = parseInt(h, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const rgb = v.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] }
  return { r: 0, g: 0, b: 0 }
}

function psColor(rgb: { r: number; g: number; b: number }): string {
  const { c, m, y, k } = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  return `${c / 100} ${m / 100} ${y / 100} ${k / 100} setcmykcolor`
}

function fontFor(family: string | null): string {
  const f = (family ?? '').toLowerCase()
  if (f.includes('times')) return 'Times-Roman'
  if (f.includes('courier')) return 'Courier'
  return 'Helvetica'
}

function parseTransform(tr: string | null): string[] {
  if (!tr) return []
  const ops: string[] = []
  const re = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tr))) {
    const args = m[2].split(/[\s,]+/).filter(Boolean).map(Number)
    switch (m[1]) {
      case 'matrix': ops.push(`[${args.join(' ')}] concat`); break
      case 'translate': ops.push(`${f3(args[0])} ${f3(args[1] ?? 0)} translate`); break
      case 'scale': ops.push(`${f3(args[0])} ${f3(args[1] ?? args[0])} scale`); break
      case 'rotate': ops.push(`${f3(args[0])} rotate`); break
    }
  }
  return ops
}

function arcPath(cx: number, cy: number, rx: number, ry: number): string[] {
  const k = 0.5523
  return [
    `${f3(cx - rx)} ${f3(cy)} moveto`,
    `${f3(cx - rx)} ${f3(cy + ry * k)} ${f3(cx - rx * k)} ${f3(cy + ry)} ${f3(cx)} ${f3(cy + ry)} curveto`,
    `${f3(cx + rx * k)} ${f3(cy + ry)} ${f3(cx + rx)} ${f3(cy + ry * k)} ${f3(cx + rx)} ${f3(cy)} curveto`,
    `${f3(cx + rx)} ${f3(cy - ry * k)} ${f3(cx + rx * k)} ${f3(cy - ry)} ${f3(cx)} ${f3(cy - ry)} curveto`,
    `${f3(cx - rx * k)} ${f3(cy - ry)} ${f3(cx - rx)} ${f3(cy - ry * k)} ${f3(cx - rx)} ${f3(cy)} curveto`,
    'closepath'
  ]
}

const NUM_RE = /[+-]?\d*\.?\d+(?:e[-+]?\d+)?/iy
const ARG_COUNT: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }

function arcPoints(x1: number, y1: number, rx: number, ry: number, rotDeg: number, large: boolean, sweep: boolean, x2: number, y2: number): Array<[number, number]> {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [[x2, y2]]
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const phi = (rotDeg * Math.PI) / 180
  const cosP = Math.cos(phi)
  const sinP = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cosP * dx + sinP * dy
  const y1p = -sinP * dx + cosP * dy
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    const s = Math.sqrt(lambda)
    rx *= s
    ry *= s
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const coef = Math.sqrt(Math.max(0, num / den)) * (large === sweep ? -1 : 1)
  const cxp = (coef * rx * y1p) / ry
  const cyp = (-coef * ry * x1p) / rx
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    let a = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy)))))
    if (ux * vy - uy * vx < 0) a = -a
    return a
  }
  const t1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && dt > 0) dt -= 2 * Math.PI
  if (sweep && dt < 0) dt += 2 * Math.PI
  const pts: Array<[number, number]> = []
  const N = 16
  for (let i = 1; i <= N; i++) {
    const t = t1 + (dt * i) / N
    pts.push([cx + rx * Math.cos(t) * cosP - ry * Math.sin(t) * sinP, cy + rx * Math.cos(t) * sinP + ry * Math.sin(t) * cosP])
  }
  return pts
}

export function pathOps(d: string): string[] {
  const out: string[] = []
  let pos = 0
  let cmd = ''
  let rel = false
  let args: number[] = []
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let lastC: [number, number] | null = null
  let lastQ: [number, number] | null = null
  let subpathOpen = false

  const closeFill = () => {
    out.push('closepath fill')
    subpathOpen = false
  }

  const exec = () => {
    switch (cmd) {
      case 'M': {
        const x = rel ? cx + args[0] : args[0]
        const y = rel ? cy + args[1] : args[1]
        if (subpathOpen) closeFill()
        out.push(`${f3(x)} ${f3(y)} moveto`)
        cx = x
        cy = y
        sx = x
        sy = y
        lastC = null
        lastQ = null
        cmd = 'L'
        break
      }
      case 'L': {
        const x = rel ? cx + args[0] : args[0]
        const y = rel ? cy + args[1] : args[1]
        out.push(`${f3(x)} ${f3(y)} lineto`)
        cx = x
        cy = y
        subpathOpen = true
        lastC = null
        lastQ = null
        break
      }
      case 'H': {
        const x = rel ? cx + args[0] : args[0]
        out.push(`${f3(x)} ${f3(cy)} lineto`)
        cx = x
        subpathOpen = true
        lastC = null
        lastQ = null
        break
      }
      case 'V': {
        const y = rel ? cy + args[0] : args[0]
        out.push(`${f3(cx)} ${f3(y)} lineto`)
        cy = y
        subpathOpen = true
        lastC = null
        lastQ = null
        break
      }
      case 'C': {
        const [x1, y1, x2, y2, x, y] = rel
          ? [cx + args[0], cy + args[1], cx + args[2], cy + args[3], cx + args[4], cy + args[5]]
          : [args[0], args[1], args[2], args[3], args[4], args[5]]
        out.push(`${f3(x1)} ${f3(y1)} ${f3(x2)} ${f3(y2)} ${f3(x)} ${f3(y)} curveto`)
        cx = x
        cy = y
        lastC = [x2, y2]
        lastQ = null
        subpathOpen = true
        break
      }
      case 'S': {
        const x2 = rel ? cx + args[0] : args[0]
        const y2 = rel ? cy + args[1] : args[1]
        const x = rel ? cx + args[2] : args[2]
        const y = rel ? cy + args[3] : args[3]
        const x1 = lastC ? 2 * cx - lastC[0] : cx
        const y1 = lastC ? 2 * cy - lastC[1] : cy
        out.push(`${f3(x1)} ${f3(y1)} ${f3(x2)} ${f3(y2)} ${f3(x)} ${f3(y)} curveto`)
        cx = x
        cy = y
        lastC = [x2, y2]
        lastQ = null
        subpathOpen = true
        break
      }
      case 'Q': {
        const qx = rel ? cx + args[0] : args[0]
        const qy = rel ? cy + args[1] : args[1]
        const x = rel ? cx + args[2] : args[2]
        const y = rel ? cy + args[3] : args[3]
        const x1 = cx + (2 / 3) * (qx - cx)
        const y1 = cy + (2 / 3) * (qy - cy)
        const x2 = x + (2 / 3) * (qx - x)
        const y2 = y + (2 / 3) * (qy - y)
        out.push(`${f3(x1)} ${f3(y1)} ${f3(x2)} ${f3(y2)} ${f3(x)} ${f3(y)} curveto`)
        cx = x
        cy = y
        lastQ = [qx, qy]
        lastC = null
        subpathOpen = true
        break
      }
      case 'T': {
        const x = rel ? cx + args[0] : args[0]
        const y = rel ? cy + args[1] : args[1]
        const qx = lastQ ? 2 * cx - lastQ[0] : cx
        const qy = lastQ ? 2 * cy - lastQ[1] : cy
        const x1 = cx + (2 / 3) * (qx - cx)
        const y1 = cy + (2 / 3) * (qy - cy)
        const x2 = x + (2 / 3) * (qx - x)
        const y2 = y + (2 / 3) * (qy - y)
        out.push(`${f3(x1)} ${f3(y1)} ${f3(x2)} ${f3(y2)} ${f3(x)} ${f3(y)} curveto`)
        cx = x
        cy = y
        lastQ = [qx, qy]
        lastC = null
        subpathOpen = true
        break
      }
      case 'A': {
        const x = rel ? cx + args[5] : args[5]
        const y = rel ? cy + args[6] : args[6]
        const pts = arcPoints(cx, cy, args[0], args[1], args[2], args[3] === 1, args[4] === 1, x, y)
        for (const [px, py] of pts) out.push(`${f3(px)} ${f3(py)} lineto`)
        cx = x
        cy = y
        lastC = null
        lastQ = null
        subpathOpen = true
        break
      }
    }
  }

  while (pos < d.length) {
    const ch = d[pos]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === ',') {
      pos++
      continue
    }
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(ch)) {
      cmd = ch.toUpperCase()
      rel = cmd !== ch
      args = []
      if (cmd === 'Z') {
        out.push('closepath fill')
        subpathOpen = false
        cx = sx
        cy = sy
        lastC = null
        lastQ = null
        cmd = ''
      }
      pos++
      continue
    }
    let val: number
    if (cmd === 'A' && (args.length === 3 || args.length === 4) && (ch === '0' || ch === '1')) {
      val = ch === '1' ? 1 : 0
      pos++
    } else {
      NUM_RE.lastIndex = pos
      const m = NUM_RE.exec(d)
      if (!m) {
        pos++
        continue
      }
      val = parseFloat(m[0])
      pos += m[0].length
    }
    args.push(val)
    if (cmd && args.length >= ARG_COUNT[cmd]) {
      exec()
      args = []
    }
  }
  if (subpathOpen) closeFill()
  return out
}

export function svgToEps(svgEl: SVGElement, opts: { cmyk?: { c: number; m: number; y: number; k: number }; title: string }): string {
  const dims = svgEl.getAttribute('viewBox')
    ? svgEl.getAttribute('viewBox')!.trim().split(/[\s,]+/).map(Number).slice(2)
    : [parseFloat(svgEl.getAttribute('width') ?? '800') || 800, parseFloat(svgEl.getAttribute('height') ?? '600') || 600]
  const [W, H] = dims
  const out: string[] = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${f3(W)} ${f3(H)}`,
    `%%Title: (${opts.title})`,
    '%%Creator: Logo Asset Pack Generator',
    '%%LanguageLevel: 2',
    '%%EndComments',
    '%%Page: 1 1',
    'gsave'
  ]
  if (opts.cmyk) out.push(`${opts.cmyk.c / 100} ${opts.cmyk.m / 100} ${opts.cmyk.y / 100} ${opts.cmyk.k / 100} setcmykcolor`)
  out.push(`0 ${f3(H)} translate 1 -1 scale`)

  const emit = (el: Element, depth: number) => {
    const tag = el.tagName.toLowerCase()
    if (SKIP.has(tag)) return
    const tr = parseTransform(el.getAttribute('transform'))
    let pushed = false
    if (tr.length) { out.push('gsave', ...tr); pushed = true }
    const fill = parseFill(el)
    if (fill && !opts.cmyk) out.push(psColor(fill))
    switch (tag) {
      case 'g': case 'a': case 'svg':
        for (const c of Array.from(el.children)) emit(c, depth + 1)
        break
      case 'path': {
        out.push(...pathOps(el.getAttribute('d') ?? ''))
        break
      }
      case 'rect': {
        const x = +(el.getAttribute('x') ?? 0), y = +(el.getAttribute('y') ?? 0)
        const w = +el.getAttribute('width')!, hgt = +el.getAttribute('height')!
        out.push(`${f3(x)} ${f3(y)} moveto`, `${f3(x + w)} ${f3(y)} rlineto`, `${f3(0)} ${f3(hgt)} rlineto`, `${f3(-w)} ${f3(0)} rlineto`, 'closepath fill')
        break
      }
      case 'circle': case 'ellipse': {
        const cx = +(el.getAttribute('cx') ?? 0), cy = +(el.getAttribute('cy') ?? 0)
        const rx = +(el.getAttribute('rx') ?? el.getAttribute('r') ?? 0)
        const ry = +(el.getAttribute('ry') ?? el.getAttribute('r') ?? 0)
        out.push(...arcPath(cx, cy, rx, ry), 'fill')
        break
      }
      case 'line': {
        out.push(`${f3(+(el.getAttribute('x1') ?? 0))} ${f3(+(el.getAttribute('y1') ?? 0))} moveto`, `${f3(+(el.getAttribute('x2') ?? 0))} ${f3(+(el.getAttribute('y2') ?? 0))} lineto`)
        break
      }
      case 'polygon': case 'polyline': {
        const pts = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number)
        if (pts.length >= 4) {
          out.push(`${f3(pts[0])} ${f3(pts[1])} moveto`)
          for (let i = 2; i + 1 < pts.length; i += 2) out.push(`${f3(pts[i])} ${f3(pts[i + 1])} lineto`)
          if (tag === 'polygon') out.push('closepath fill')
        }
        break
      }
      case 'text': {
        const x = +(el.getAttribute('x') ?? 0), y = +(el.getAttribute('y') ?? 0)
        const size = +(el.getAttribute('font-size') ?? 16)
        const anchor = el.getAttribute('text-anchor')
        const content = el.textContent ?? ''
        out.push(`/${fontFor(el.getAttribute('font-family'))} ${f3(size)} selectfont`)
        if (anchor === 'middle') out.push(`${f3(x)} ${f3(y)} moveto (${content}) dup stringwidth pop 2 div neg 0 rmoveto show`)
        else if (anchor === 'end') out.push(`${f3(x)} ${f3(y)} moveto (${content}) dup stringwidth pop neg 0 rmoveto show`)
        else out.push(`${f3(x)} ${f3(y)} moveto (${content}) show`)
        break
      }
    }
    if (pushed) out.push('grestore')
  }
  for (const c of Array.from(svgEl.children)) emit(c, 0)
  out.push('grestore', '%%EOF')
  return out.join('\n')
}
