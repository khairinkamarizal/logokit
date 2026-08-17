// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepNav from '~/components/stepper/StepNav.vue'
import SummarySidebar from '~/components/stepper/SummarySidebar.vue'
import BrandStep from '~/components/steps/BrandStep.vue'
import ErrorBanner from '~/components/ErrorBanner.vue'

describe('wizard components', () => {
  it('StepNav marks current and blocks future', async () => {
    const w = mount(StepNav, { props: { step: 1, done: false } })
    expect(w.findAll('button')[1].classes().join(' ')).toContain('bg-primary')
    await w.findAll('button')[3].trigger('click')
    expect(w.emitted('go')).toBeUndefined()
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('go')![0]).toEqual([0])
  })
  it('SummarySidebar shows brand and counts', () => {
    const w = mount(SummarySidebar, { props: {
      brandName: 'Acme', assets: [{ id: 'a', name: 'logo', type: 'primary_logo' }], colors: [{ id: 'c', name: 'Blue', hex: '#3b82f6' }]
    } })
    expect(w.text()).toContain('Acme')
    expect(w.text()).toContain('1')
  })
  it('BrandStep binds input', async () => {
    const w = mount(BrandStep, { props: { modelValue: '' } })
    await w.find('input').setValue('Acme')
    expect(w.emitted('update:modelValue')![0]).toEqual(['Acme'])
  })
  it('ErrorBanner lists errors', () => {
    const w = mount(ErrorBanner, { props: { errors: ['Please enter a brand name.'] } })
    expect(w.text()).toContain('Please enter a brand name.')
  })
})
