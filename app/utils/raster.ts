export function svgToImage(svgText: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to rasterize SVG')) }
    img.src = url
  })
}

export function renderToCanvas(img: HTMLImageElement, width: number, height: number, background?: string, marginPct = 0): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')!
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const p = Math.min(50, Math.max(0, marginPct)) / 100
    const logoW = width / (1 + 2 * p)
    const logoH = logoW * (img.naturalHeight || 1) / (img.naturalWidth || 1)
    const scale = Math.min(logoW / (img.naturalWidth || logoW), logoH / (img.naturalHeight || logoH))
    const dw = (img.naturalWidth || logoW) * scale
    const dh = (img.naturalHeight || logoH) * scale
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh)
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error(`Canvas export failed: ${type}`)), type, quality)
  })
}

export async function supportsWebp(): Promise<boolean> {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    return await canvasToBlob(c, 'image/webp').then(b => b.type === 'image/webp')
  } catch { return false }
}

export interface RasterOpts {
  pngSizes: number[]
  jpgWidth: number
  jpgQuality: number
  webpSizes: number[]
  jpgBackgrounds: { name: string; hex: string }[]
  jpgMargin: number
  ratio: number
}

export async function exportRasters(svgText: string, baseName: string, opts: RasterOpts): Promise<{ files: { name: string; blob: Blob }[] }> {
  const img = await svgToImage(svgText)
  const files: { name: string; blob: Blob }[] = []
  const h = (w: number) => w * opts.ratio
  for (const s of opts.pngSizes)
    files.push({ name: `${baseName}-transparent-${s}.png`, blob: await canvasToBlob(renderToCanvas(img, s, h(s)), 'image/png') })
  const webp = await supportsWebp()
  if (webp)
    for (const s of opts.webpSizes)
      files.push({ name: `${baseName}-transparent-${s}.webp`, blob: await canvasToBlob(renderToCanvas(img, s, h(s)), 'image/webp', opts.jpgQuality) })
  for (const bg of opts.jpgBackgrounds)
    files.push({ name: `${baseName}-${bg.name}.jpg`, blob: await canvasToBlob(renderToCanvas(img, opts.jpgWidth, h(opts.jpgWidth), bg.hex, opts.jpgMargin), 'image/jpeg', opts.jpgQuality) })
  return { files }
}
