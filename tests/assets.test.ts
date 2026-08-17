// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
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
  it('shows skip message for non-svg files', async () => {
    const w = mount(AssetsStep, { props: { assets: [] } })
    await (w.vm as any).addFiles([makeFile('a.svg'), new File(['x'], 'b.png', { type: 'image/png' })])
    expect(w.text()).toContain('Only clean SVG files without embedded raster images are supported. Skipped: b.png')
    expect(w.emitted('update:assets')![0][0]).toHaveLength(1)
  })
  it('derives asset name from filename', async () => {
    const w = mount(AssetsStep, { props: { assets: [] } })
    await (w.vm as any).addFiles([makeFile('acme-main_logo.svg')])
    const assets = w.emitted('update:assets')![0][0] as any[]
    expect(assets[0].name).toBe('acme main logo')
    expect(assets[0].type).toBe('primary_logo')
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
