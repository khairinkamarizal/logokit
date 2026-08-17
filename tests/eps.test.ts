// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { svgToEps } from '~/utils/eps'
import { parseSvg } from '~/utils/svg'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <path d="M10 10 L190 10 L190 90 L10 90 Z" fill="#3B82F6"/>
  <rect x="10" y="10" width="50" height="30" fill="#ff0000"/>
  <text x="100" y="55" font-size="14" text-anchor="middle" fill="#000000">Hi</text>
</svg>`

describe('eps compiler', () => {
  it('emits header, bbox, y-flip, fill ops, EOF', () => {
    const out = svgToEps(parseSvg(SVG), { title: 'Acme Primary_Logo CMYK original' })
    expect(out.startsWith('%!PS-Adobe-3.0 EPSF-3.0')).toBe(true)
    expect(out).toContain('%%BoundingBox: 0 0 200 100')
    expect(out).toContain('%%Title: (Acme Primary_Logo CMYK original)')
    expect(out).toContain('%%Creator: Logo Asset Pack Generator')
    expect(out).toContain('0 100 translate 1 -1 scale')
    expect(out).toContain('closepath fill')
    expect(out).toContain('setcmykcolor')
    expect(out).toContain('selectfont')
    expect(out.trimEnd().endsWith('%%EOF')).toBe(true)
  })
  it('single cmyk override emits one setcmykcolor after gsave', () => {
    const out = svgToEps(parseSvg(SVG), { cmyk: { c: 0, m: 100, y: 100, k: 0 }, title: 't' })
    const gsaveIdx = out.indexOf('gsave')
    const colorIdx = out.indexOf('0 1 1 0 setcmykcolor')
    expect(gsaveIdx).toBeGreaterThanOrEqual(0)
    expect(colorIdx).toBeGreaterThan(gsaveIdx)
  })
  it('skips defs and gradients', () => {
    const out = svgToEps(parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"><stop stop-color="#fff"/></linearGradient></defs><path d="M0 0h10v10z"/></svg>`), { title: 't' })
    expect(out).not.toContain('sh')
  })
})
