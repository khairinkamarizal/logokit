import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { slugify } from './color'

export const ASSET_TYPES = [
  { value: 'primary_logo', label: 'Primary Logo' },
  { value: 'horizontal_logo', label: 'Horizontal Logo' },
  { value: 'vertical_logo', label: 'Vertical Logo' },
  { value: 'logo_mark', label: 'Logo Mark' },
  { value: 'monogram', label: 'Monogram' },
  { value: 'wordmark', label: 'Wordmark' },
  { value: 'app_icon_source', label: 'App Icon Source' },
  { value: 'logo_3d', label: '3D Logo' },
  { value: 'effect', label: 'Effect' },
  { value: 'dark_version', label: 'Dark Version' },
  { value: 'light_version', label: 'Light Version' },
  { value: 'custom', label: 'Custom' }
] as const

const LABELS: Record<string, string> = {
  primary_logo: 'Primary_Logo', horizontal_logo: 'Horizontal_Logo', vertical_logo: 'Vertical_Logo',
  logo_mark: 'Logo_Mark', monogram: 'Monogram', wordmark: 'Wordmark',
  app_icon_source: 'App_Icon_Source', logo_3d: '3D_Logo', effect: 'Effect',
  dark_version: 'Dark_Version', light_version: 'Light_Version', custom: 'Custom'
}

export function typeLabel(type: string, customName?: string): string {
  if (type === 'custom') {
    const s = slugify(customName ?? '')
    if (!s) return 'Custom'
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')
  }
  return LABELS[type] ?? 'Custom'
}

export function assetFolderNames(assets: { id: string; type: string; customName?: string }[]): { id: string; folder: string }[] {
  const seen = new Map<string, number>()
  const groupOf = new Map<string, number>()
  let n = 0
  return assets.map(a => {
    let label = typeLabel(a.type, a.customName)
    if (!groupOf.has(label)) {
      n++
      groupOf.set(label, n)
    }
    const group = groupOf.get(label)!
    const count = (seen.get(label) ?? 0) + 1
    seen.set(label, count)
    if (count > 1) label = `${label}-${count}`
    return { id: a.id, folder: `${String(group).padStart(2, '0')}_${label}` }
  })
}

export function zipFileName(brand: string): string {
  const s = slugify(brand)
  return `${s.charAt(0).toUpperCase() + s.slice(1)}_Logo_Asset_Pack.zip`
}

export async function buildZip(files: { path: string; blob: Blob }[], onProgress?: (i: number, total: number) => void): Promise<Blob> {
  const zip = new JSZip()
  files.forEach((f, i) => {
    zip.file(f.path, f.blob)
    onProgress?.(i + 1, files.length)
  })
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export function downloadBlob(blob: Blob, name: string): void {
  saveAs(blob, name)
}
