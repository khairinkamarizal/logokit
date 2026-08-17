import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, isValidHex, rgbToCmyk, cmykToRgb, relativeLuminance, textColorOn, dominantColorFromSvg, slugify } from '~/utils/color'

describe('color utils', () => {
  it('hexToRgb', () => {
    expect(hexToRgb('#3B82F6')).toEqual({ r: 59, g: 130, b: 246 })
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('rgbToHex round trip', () => {
    expect(rgbToHex(59, 130, 246)).toBe('#3b82f6')
  })
  it('isValidHex', () => {
    expect(isValidHex('#3B82F6')).toBe(true)
    expect(isValidHex('3b82f6')).toBe(true)
    expect(isValidHex('#3B82F')).toBe(false)
    expect(isValidHex('#GGGGGG')).toBe(false)
  })
  it('rgbToCmyk / cmykToRgb', () => {
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 })
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    const back = cmykToRgb(0, 0, 0, 0)
    expect(back).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('luminance + text color', () => {
    expect(textColorOn('#ffffff')).toBe('#000000')
    expect(textColorOn('#000000')).toBe('#ffffff')
  })
  it('dominantColorFromSvg filters noise', () => {
    const svg = `<svg><path fill="#333333"/><path fill="#3B82F6"/><path fill="#3B82F6"/><stop stop-color="#3B82F6"/></svg>`
    expect(dominantColorFromSvg(svg)).toBe('#3b82f6')
    expect(dominantColorFromSvg(`<svg><path fill="#111"/></svg>`)).toBeNull()
  })
  it('slugify', () => {
    expect(slugify('Acme Corporation')).toBe('acme-corporation')
    expect(slugify('My Brand—Extra!')).toBe('my-brand-extra')
  })
})
