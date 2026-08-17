// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '~/components/ui/Button.vue'
import Input from '~/components/ui/Input.vue'
import Switch from '~/components/ui/Switch.vue'
import AppSelect from '~/components/ui/AppSelect.vue'

describe('ui primitives', () => {
  it('Button renders slot and variant class', () => {
    const w = mount(Button, { slots: { default: 'Continue' }, props: { variant: 'outline' } })
    expect(w.text()).toContain('Continue')
    expect(w.attributes('class')).toContain('border')
  })
  it('Input binds v-model', async () => {
    const w = mount(Input, { props: { modelValue: '' } })
    await w.find('input').setValue('Acme')
    expect(w.emitted('update:modelValue')![0]).toEqual(['Acme'])
  })
  it('Switch toggles', async () => {
    const w = mount(Switch, { props: { modelValue: false } })
    await w.find('button').trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual([true])
  })
  it('AppSelect emits option value', async () => {
    const w = mount(AppSelect, { props: { modelValue: '', options: [{ value: 'logo_mark', label: 'Logo Mark' }] } })
    await w.find('select').setValue('logo_mark')
    expect(w.emitted('update:modelValue')![0]).toEqual(['logo_mark'])
  })
})
