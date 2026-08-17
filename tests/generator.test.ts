import { describe, it, expect } from 'vitest'
import { buildVariants, jpgBackgrounds, estimateFileCount, buildTreePreview } from '~/utils/generator'
import type { GeneratorConfig } from '~/utils/generator'

const base = {
  brandName: 'Acme',
  assets: [{ id: 'a1', type: 'primary_logo', name: 'acme-logo' }],
  colors: [
    { id: 'c1', name: 'Brand Blue', hex: '#3B82F6', cmyk: { c: 71, m: 47, y: 0, k: 4 }, cmykManual: false, useForLogo: true, useAsBackground: true, digitalOnly: false, printOnly: false }
  ],
  bwVersion: true,
  originalVersion: true,
  jpgMargin: 10
} as unknown as GeneratorConfig

describe('generator planning', () => {
  it('buildVariants order: original, colors, black, white', () => {
    const v = buildVariants(base)
    expect(v.map(x => x.slug)).toEqual(['original', 'brand-blue', 'black', 'white'])
    expect(v[1].cmyk).toEqual({ c: 71, m: 47, y: 0, k: 4 })
    expect(v[2].cmyk).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    expect(v[3].cmyk).toEqual({ c: 0, m: 0, y: 0, k: 0 })
  })
  it('respects toggles and useForLogo=false', () => {
    const v = buildVariants({ ...base, bwVersion: false, originalVersion: false, colors: [{ ...base.colors[0], useForLogo: false }] })
    expect(v).toEqual([])
  })
  it('jpgBackgrounds includes white, black, brand colors', () => {
    expect(jpgBackgrounds(base).map(b => b.name)).toEqual(['white-bg', 'black-bg', 'brand-blue-bg'])
  })
  it('dedupes variant and bg slugs for duplicate color names', () => {
    const cfg = {
      ...base,
      colors: [
        base.colors[0],
        { ...base.colors[0], id: 'c2', hex: '#EF4444' }
      ]
    } as unknown as GeneratorConfig
    const v = buildVariants(cfg)
    expect(v.map(x => x.slug)).toEqual(['original', 'brand-blue', 'brand-blue-2', 'black', 'white'])
    expect(jpgBackgrounds(cfg).map(b => b.name)).toEqual(['white-bg', 'black-bg', 'brand-blue-bg', 'brand-blue-2-bg'])
  })
  it('estimateFileCount math', () => {
    // 1 asset, 4 variants: svg 4 + png 16 + jpg (4 variants × 3 bgs, minus same-hex skips: brand-blue on brand-blue-bg = 11) + webp 16 + eps 4
    expect(estimateFileCount(base)).toBe(4 + 16 + 11 + 16 + 4)
  })
  it('buildTreePreview matches zip layout', () => {
    const t = buildTreePreview(base)
    expect(t[0]).toEqual({ name: 'Acme_Logo_Asset_Pack.zip', depth: 0, type: 'folder' })
    expect(t.some(e => e.name === '01_Primary_Logo' && e.depth === 1)).toBe(true)
    expect(t.some(e => e.name === '01_RGB_Digital' && e.depth === 2)).toBe(true)
    expect(t.some(e => e.name.endsWith('-transparent-4096.png') && e.type === 'file')).toBe(true)
  })
})
