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
  it('recolors stylesheet paints and stroke-only artwork', () => {
    const el = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <style>
        .filled { fill: #f00; stroke: rgb(0, 0, 0) }
        .outline { fill: none; stroke: #00f !important }
        .gradient { fill: url(#paint); }
        .stop { stop-color: #0f0; }
      </style>
      <defs><linearGradient id="paint"><stop class="stop" offset="0" /></linearGradient></defs>
      <path class="filled" d="M0 0h10v10z" />
      <path class="outline" d="M0 0h10v10z" />
      <path class="gradient" d="M0 0h10v10z" />
      <circle cx="5" cy="5" r="4" stroke="currentColor" fill="transparent" />
    </svg>`)

    recolorSvg(el, '#123456')

    const css = el.querySelector('style')!.textContent!
    expect(css).toContain('fill: #123456')
    expect(css).toContain('stroke: #123456')
    expect(css).toContain('fill: none')
    expect(css).toContain('fill: url(#paint)')
    expect(css).toContain('stop-color: #123456')
    expect(css).toContain('stroke: #123456 !important')
    expect(el.querySelector('circle')!.getAttribute('stroke')).toBe('#123456')
    expect(el.querySelector('circle')!.getAttribute('fill')).toBe('transparent')
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
