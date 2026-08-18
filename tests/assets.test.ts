// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetsStep from '~/components/steps/AssetsStep.vue'
import AssetRow from '~/components/steps/AssetRow.vue'

const makeFile = (name = 'acme-logo.svg') => new File(['<svg/>'], name, { type: 'image/svg+xml' })

describe('assets step', () => {
  it('renders heading and empty dropzone copy', () => {
    const w = mount(AssetsStep, { props: { assets: [] } })
    expect(w.text()).toContain('Upload logo')
    expect(w.text()).toContain('Drop logo files here')
    expect(w.text()).toContain('or click to browse')
  })
  it('accepts raster artwork and skips unsupported files', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 3000, height: 2000, close: vi.fn() }))
    const w = mount(AssetsStep, { props: { assets: [] } })
    await (w.vm as any).addFiles([makeFile('a.svg'), new File(['x'], 'render.png', { type: 'image/png' }), new File(['x'], 'notes.pdf', { type: 'application/pdf' })])
    expect(w.text()).toContain('Supported formats are SVG, PNG, JPG and WebP. Skipped: notes.pdf')
    const assets = w.emitted('update:assets')![0][0] as any[]
    expect(assets).toHaveLength(2)
    expect(assets[1]).toMatchObject({ type: 'logo_3d', sourceKind: 'raster', width: 3000, height: 2000 })
    vi.unstubAllGlobals()
  })
  it('derives asset name from filename', async () => {
    const w = mount(AssetsStep, { props: { assets: [] } })
    await (w.vm as any).addFiles([makeFile('acme-main_logo.svg')])
    const assets = w.emitted('update:assets')![0][0] as any[]
    expect(assets[0].name).toBe('acme main logo')
    expect(assets[0].type).toBe('primary_logo')
    expect(assets[0].sourceKind).toBe('svg')
  })
  it('AssetRow shows name, badge, size', () => {
    const w = mount(AssetRow, { props: { asset: { id: 'a', type: 'primary_logo', name: 'acme logo', file: makeFile() }, index: 0 } })
    expect(w.text()).toContain('acme logo')
    expect(w.text()).toContain('SVG')
    expect(w.text()).toContain('KB')
  })
  it('AssetRow custom type shows custom name input', async () => {
    const w = mount(AssetRow, { props: { asset: { id: 'a', type: 'custom', name: 'x', file: makeFile() }, index: 0 } })
    expect(w.find('input[placeholder="Custom name"]').exists()).toBe(true)
  })
})
