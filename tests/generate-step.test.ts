// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenerateStep from '~/components/steps/GenerateStep.vue'
import ProgressPanel from '~/components/steps/ProgressPanel.vue'
import ZipTreePreview from '~/components/steps/ZipTreePreview.vue'
import { buildTreePreview, estimateFileCount } from '~/utils/generator'
import type { GeneratorConfig } from '~/utils/generator'

const cfg = {
  brandName: 'Acme', assets: [{ id: 'a1', type: 'primary_logo', name: 'acme-logo' }],
  colors: [{ id: 'c1', name: 'Brand Blue', hex: '#3B82F6', cmyk: { c: 71, m: 47, y: 0, k: 4 }, cmykManual: false, useForLogo: true, useAsBackground: true, digitalOnly: false, printOnly: false }],
  bwVersion: true, originalVersion: true, jpgMargin: 10
} as unknown as GeneratorConfig

describe('generate step', () => {
  it('renders stats, panels, chips', () => {
    const w = mount(GenerateStep, { props: { cfg, tree: buildTreePreview(cfg), progress: null, isGenerating: false, done: false } })
    expect(w.text()).toContain('Ready to')
    expect(w.text()).toContain('LOGO ASSETS')
    expect(w.text()).toContain('Digital / RGB')
    expect(w.text()).toContain('Print / CMYK')
    expect(w.text()).toContain('Color Versions per Asset')
    expect(w.text()).toContain('Original')
    expect(w.text()).toContain('Black')
    expect(w.text()).toContain('White')
  })
  it('shows empty-state when no variants', () => {
    const empty = { ...cfg, colors: [], bwVersion: false, originalVersion: false } as GeneratorConfig
    const w = mount(GenerateStep, { props: { cfg: empty, tree: buildTreePreview(empty), progress: null, isGenerating: false, done: false } })
    expect(w.text()).toContain('Add brand colors to generate color versions')
  })
  it('ProgressPanel percent and done state', () => {
    const w = mount(ProgressPanel, { props: { progress: { step: 2, total: 6, message: 'Generating ZIP archive' }, done: false } })
    expect(w.text()).toContain('Generating Asset Pack…')
    expect(w.text()).toContain('Generating ZIP archive')
    const w2 = mount(ProgressPanel, { props: { progress: { step: 6, total: 6, message: 'Done!' }, done: true } })
    expect(w2.text()).toContain('Asset Pack Generated!')
    expect(w2.text()).toContain('Your ZIP archive is downloading. Check your downloads folder.')
  })
  it('ZipTreePreview renders nested entries', () => {
    const w = mount(ZipTreePreview, { props: { tree: buildTreePreview(cfg) } })
    expect(w.text()).toContain('Acme_Logo_Asset_Pack.zip')
    expect(w.text()).toContain('01_Primary_Logo')
    expect(w.text()).toContain('02_CMYK_Print_EPS')
  })
})
