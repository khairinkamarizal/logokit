import { parseSvg, embedImages, recolorSvg, svgToText, getDimensions, makePlaceholderSvg, fileToText, hasExternalImages } from './svg'
import { exportRasters } from './raster'
import { svgToEps } from './eps'
import { buildZip, assetFolderNames, zipFileName, typeLabel } from './zip'
import { slugify } from './color'

export interface LogoAsset { id: string; type: string; customName?: string; name: string; file?: File }
export interface BrandColor { id: string; name: string; hex: string; cmyk: { c: number; m: number; y: number; k: number }; cmykManual: boolean; useForLogo: boolean; useAsBackground: boolean; digitalOnly: boolean; printOnly: boolean }
export interface GeneratorConfig { brandName: string; assets: LogoAsset[]; colors: BrandColor[]; bwVersion: boolean; originalVersion: boolean; jpgMargin: number }
export interface Progress { step: number; total: number; message: string }
export type ProgressCb = (p: Progress) => void
export interface VariantInfo { slug: string; label: string; kind: 'original' | 'color' | 'black' | 'white'; hex?: string; cmyk?: { c: number; m: number; y: number; k: number } }
export interface ZipEntry { name: string; depth: number; type: 'folder' | 'file' }

const PNG_SIZES = [512, 1024, 2048, 4096]
const JPG_WIDTH = 1024
const QUALITY = 0.92
const EPS_VARIANT_LIMIT = 4

const yieldUI = () => new Promise(r => setTimeout(r, 0))

// JPG same-hex skip rule: a brand-color variant skips the background with the same hex
// (a logo vanishes into its own brand color). Core black/white variants and the
// original are rendered on every background (white-bg/black-bg are universal
// contrast references).
const jpgPairSkipped = (v: VariantInfo, b: { hex: string }): boolean =>
  v.kind === 'color' && !!v.hex && v.hex.toLowerCase() === b.hex

function colorSlugs(cfg: GeneratorConfig): string[] {
  const usedSlugs = new Set<string>(['original', 'black', 'white'])
  const slugs: string[] = []
  let i = 0
  for (const c of cfg.colors) {
    if (c.useForLogo === false) continue
    const fallback = `brand-color-${++i}`
    const base = slugify(c.name) || fallback
    let slug = base
    let n = 2
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`
    usedSlugs.add(slug)
    slugs.push(slug)
  }
  return slugs
}

export function buildVariants(cfg: GeneratorConfig): VariantInfo[] {
  const out: VariantInfo[] = []
  const slugs = colorSlugs(cfg)
  if (cfg.originalVersion) out.push({ slug: 'original', label: 'Original', kind: 'original' })
  let i = 0
  for (const c of cfg.colors) {
    if (c.useForLogo === false) continue
    out.push({
      slug: slugs[i++],
      label: c.name || `Brand Color ${out.length}`,
      kind: 'color', hex: c.hex,
      cmyk: c.cmyk
    })
  }
  if (cfg.bwVersion) {
    out.push({ slug: 'black', label: 'Black', kind: 'black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 } })
    out.push({ slug: 'white', label: 'White', kind: 'white', hex: '#ffffff', cmyk: { c: 0, m: 0, y: 0, k: 0 } })
  }
  return out
}

export function jpgBackgrounds(cfg: GeneratorConfig): { name: string; hex: string }[] {
  const slugs = colorSlugs(cfg)
  return [
    { name: 'white-bg', hex: '#ffffff' },
    { name: 'black-bg', hex: '#000000' },
    ...cfg.colors.filter(c => c.useForLogo !== false).map((c, i) => ({ name: `${slugs[i]}-bg`, hex: c.hex.toLowerCase() }))
  ]
}

export function estimateFileCount(cfg: GeneratorConfig): number {
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  let perAsset = 0
  for (const v of variants) {
    perAsset += 1 + PNG_SIZES.length * 2 // svg + png + webp
    for (const b of bgs) if (!jpgPairSkipped(v, b)) perAsset += 1
  }
  perAsset += Math.min(variants.length, EPS_VARIANT_LIMIT)
  return perAsset * cfg.assets.length
}

export function buildTreePreview(cfg: GeneratorConfig): ZipEntry[] {
  const entries: ZipEntry[] = []
  entries.push({ name: zipFileName(cfg.brandName), depth: 0, type: 'folder' })
  const folders = assetFolderNames(cfg.assets)
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  const brand = slugify(cfg.brandName)
  cfg.assets.forEach((asset, i) => {
    const label = typeLabel(asset.type, asset.customName)
    const fileBase = `${brand}-${slugify(label.toLowerCase().replace(/_/g, '-'))}`
    entries.push({ name: folders[i].folder, depth: 1, type: 'folder' })
    entries.push({ name: '01_RGB_Digital', depth: 2, type: 'folder' })
    entries.push({ name: '01_SVG', depth: 3, type: 'folder' })
    for (const v of variants) entries.push({ name: `${fileBase}-rgb-${v.slug}.svg`, depth: 4, type: 'file' })
    entries.push({ name: '02_PNG_Transparent', depth: 3, type: 'folder' })
    for (const v of variants) for (const s of PNG_SIZES) entries.push({ name: `${fileBase}-rgb-${v.slug}-transparent-${s}.png`, depth: 4, type: 'file' })
    entries.push({ name: '03_JPG', depth: 3, type: 'folder' })
    for (const v of variants) for (const b of bgs) if (!jpgPairSkipped(v, b)) entries.push({ name: `${fileBase}-rgb-${v.slug}-${b.name}.jpg`, depth: 4, type: 'file' })
    entries.push({ name: '04_WEBP', depth: 3, type: 'folder' })
    for (const v of variants) for (const s of PNG_SIZES) entries.push({ name: `${fileBase}-rgb-${v.slug}-transparent-${s}.webp`, depth: 4, type: 'file' })
    entries.push({ name: '02_CMYK_Print_EPS', depth: 2, type: 'folder' })
    for (const v of variants.slice(0, EPS_VARIANT_LIMIT)) entries.push({ name: `${fileBase}-cmyk-${v.slug}.eps`, depth: 3, type: 'file' })
  })
  return entries
}

export async function generateAssetPack(cfg: GeneratorConfig, onProgress: ProgressCb): Promise<{ zip: Blob; fileName: string; tree: ZipEntry[] }> {
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  const folders = assetFolderNames(cfg.assets)
  const brand = slugify(cfg.brandName)
  const total = cfg.assets.length * 4 + 2
  let step = 0
  const tick = (message: string) => { onProgress({ step: Math.min(step, total), total, message }); step++ }
  onProgress({ step: 0, total, message: 'Initializing…' })

  const files: { path: string; blob: Blob }[] = []

  for (let i = 0; i < cfg.assets.length; i++) {
    const asset = cfg.assets[i]
    const label = typeLabel(asset.type, asset.customName)
    const fileBase = `${brand}-${slugify(label.toLowerCase().replace(/_/g, '-'))}`
    const folder = `${folders[i].folder}/`
    const svgText = asset.file ? await fileToText(asset.file) : makePlaceholderSvg(asset.name)
    let svgEl = parseSvg(svgText)
    try { await embedImages(svgEl) } catch (e: any) {
      throw new Error(`"${asset.name}" links to external image(s) that could not be embedded ("${hasExternalImages(svgEl).join(', ')}"). Embed all images in your SVG before uploading — in Illustrator, place images with "Link" unchecked, then save as SVG.`)
    }
    const dims = getDimensions(svgEl)
    const ratio = dims.height / dims.width

    // SVG + PNG
    const variantSvgs = variants.map(v => {
      const el = parseSvg(svgToText(svgEl))
      if (v.kind === 'original') return { v, text: svgToText(el) }
      if (v.kind === 'black' || v.kind === 'white' || v.kind === 'color') recolorSvg(el, v.hex!)
      return { v, text: svgToText(el) }
    })
    for (const { v, text } of variantSvgs)
      files.push({ path: `${folder}01_RGB_Digital/01_SVG/${fileBase}-rgb-${v.slug}.svg`, blob: new Blob([text], { type: 'image/svg+xml' }) })
    tick(`${label}: generating PNG exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const { files: pngs } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: PNG_SIZES, jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: [], jpgBackgrounds: [], jpgMargin: 0, ratio
      })
      for (const f of pngs) files.push({ path: `${folder}01_RGB_Digital/02_PNG_Transparent/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating JPG exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const vBgs = bgs.filter(b => !jpgPairSkipped(v, b))
      const { files: jpgs } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: [], jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: [], jpgBackgrounds: vBgs, jpgMargin: cfg.jpgMargin, ratio
      })
      for (const f of jpgs) files.push({ path: `${folder}01_RGB_Digital/03_JPG/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating WebP exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const { files: webps } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: [], jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: PNG_SIZES, jpgBackgrounds: [], jpgMargin: 0, ratio
      })
      for (const f of webps) files.push({ path: `${folder}01_RGB_Digital/04_WEBP/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating print exports`)
    await yieldUI()
    for (const v of variants.slice(0, EPS_VARIANT_LIMIT)) {
      const el = parseSvg(variantSvgs.find(x => x.v.slug === v.slug)!.text)
      const eps = svgToEps(el, {
        cmyk: v.kind === 'original' ? undefined : v.cmyk,
        title: `${cfg.brandName} ${label} CMYK ${v.slug}`
      })
      files.push({ path: `${folder}02_CMYK_Print_EPS/${fileBase}-cmyk-${v.slug}.eps`, blob: new Blob([eps], { type: 'application/postscript' }) })
    }
  }

  tick('Generating ZIP archive')
  await yieldUI()
  const zip = await buildZip(files)
  tick('Done!')
  return { zip, fileName: zipFileName(cfg.brandName), tree: buildTreePreview(cfg) }
}
