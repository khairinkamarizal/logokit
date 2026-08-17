// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { parseSvg, getDimensions, hasExternalImages, recolorSvg, grayscaleSvg, svgToText, makePlaceholderSvg } from '~/utils/svg'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <g><path d="M0 0h10v10z" fill="#3B82F6"/><path d="M20 0h5v5z" fill="none"/></g>
  <linearGradient id="g"><stop stop-color="#ff0000"/></linearGradient>
  <rect width="10" height="10" style="fill: #00ff00" />
</svg>`

describe('svg utils', () => {
  it('parses and gets dimensions from viewBox', () => {
    const el = parseSvg(SVG)
    expect(getDimensions(el)).toEqual({ width: 200, height: 100 })
  })
  it('falls back to width/height attrs then 800x600', () => {
    expect(getDimensions(parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"/>`))).toEqual({ width: 64, height: 32 })
    expect(getDimensions(parseSvg(`<svg xmlns="http://www.w3.org/2000/svg"/>`))).toEqual({ width: 800, height: 600 })
  })
  it('detects external images', () => {
    const el = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image href="https://x.com/a.png"/><image xlink:href="data:image/png;base64,AAA"/></svg>`)
    expect(hasExternalImages(el)).toEqual(['https://x.com/a.png'])
  })
  it('recolors fills, gradient stops, styles; skips none', () => {
    const el = parseSvg(SVG)
    recolorSvg(el, '#123456')
    expect(el.querySelector('path')!.getAttribute('fill')).toBe('#123456')
    expect(el.querySelectorAll('path')[1].getAttribute('fill')).toBe('none')
    expect(el.querySelector('stop')!.getAttribute('stop-color')).toBe('#123456')
    expect(svgToText(el)).toContain('fill: #123456')
    expect(el.getAttribute('fill')).toBe('#123456')
  })
  it('grayscale adds filter', () => {
    const el = parseSvg(SVG)
    grayscaleSvg(el)
    expect(el.getAttribute('style')).toContain('grayscale(1)')
  })
  it('placeholder contains name', () => {
    expect(makePlaceholderSvg('Wordmark')).toContain('Wordmark')
  })
})
