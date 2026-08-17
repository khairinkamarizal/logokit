// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorsStep from '~/components/steps/ColorsStep.vue'
import ColorCard from '~/components/steps/ColorCard.vue'
import CmykEditor from '~/components/steps/CmykEditor.vue'
import { rgbToCmyk } from '~/utils/color'

const baseColor = {
  id: 'c1', name: 'Brand Blue', hex: '#3b82f6',
  cmyk: { c: 71, m: 47, y: 0, k: 4 }, cmykManual: false,
  useForLogo: true, useAsBackground: true, digitalOnly: false, printOnly: false
}

describe('colors step', () => {
  it('renders headings, toggles, margin', () => {
    const w = mount(ColorsStep, { props: { colors: [], bwVersion: false, originalVersion: false, jpgMargin: 10, dominantSeed: null } })
    expect(w.text()).toContain('Brand')
    expect(w.text()).toContain('Black & White logo version')
    expect(w.text()).toContain('Original (multicolor) logo')
    expect(w.text()).toContain('JPG export margin')
  })
  it('add form seeds from dominant and adds color', async () => {
    const w = mount(ColorsStep, { props: { colors: [], bwVersion: false, originalVersion: false, jpgMargin: 10, dominantSeed: '#123456' } })
    await w.find('.add-color-btn').trigger('click')
    expect(w.find('input[placeholder="#3B82F6"]').element.value.toLowerCase()).toBe('#123456')
    await w.find('.confirm-add').trigger('click')
    const colors = w.emitted('update:colors')![0][0] as any[]
    expect(colors).toHaveLength(1)
    expect(colors[0].hex).toBe('#123456')
  })
  it('ColorCard emits duplicate and remove', async () => {
    const w = mount(ColorCard, { props: { color: baseColor, index: 0 } })
    await w.find('.btn-duplicate').trigger('click')
    expect(w.emitted('duplicate')).toBeTruthy()
    await w.find('.btn-remove').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
  })
  it('CmykEditor inputs disabled unless manual', async () => {
    const w = mount(CmykEditor, { props: { modelValue: { c: 0, m: 0, y: 0, k: 0 }, manual: false } })
    expect((w.find('input[type="number"]').element as HTMLInputElement).disabled).toBe(true)
    await w.find('button[role="switch"]').trigger('click')
    expect(w.emitted('update:manual')![0]).toEqual([true])
  })
  it('ColorCard recomputes cmyk from hex when manual switches to auto', async () => {
    const w = mount(ColorCard, {
      props: {
        color: { ...baseColor, cmyk: { c: 10, m: 20, y: 30, k: 40 }, cmykManual: true },
        index: 0
      }
    })
    await w.find('button[aria-label="Expand"]').trigger('click')
    const switches = w.findAll('button[role="switch"]')
    await switches[0].trigger('click')
    const events = w.emitted('update:color')!
    const last = events[events.length - 1][0] as any
    expect(last.cmykManual).toBe(false)
    expect(last.cmyk).toEqual(rgbToCmyk(59, 130, 246))
  })
  it('ColorCard keeps cmyk values when auto switches to manual', async () => {
    const w = mount(ColorCard, {
      props: { color: { ...baseColor, cmykManual: false }, index: 0 }
    })
    await w.find('button[aria-label="Expand"]').trigger('click')
    const switches = w.findAll('button[role="switch"]')
    await switches[0].trigger('click')
    const events = w.emitted('update:color')!
    const last = events[events.length - 1][0] as any
    expect(last.cmykManual).toBe(true)
    expect(last.cmyk).toEqual(baseColor.cmyk)
  })
})
