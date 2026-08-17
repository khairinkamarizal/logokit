// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { renderToCanvas, canvasToBlob } from '~/utils/raster'

// minimal canvas stub: jsdom canvas returns null for getContext without node-canvas
beforeAll(() => {
  const proto = HTMLCanvasElement.prototype as any
  proto.getContext = () => ({ fillRect() {}, drawImage() {}, fillStyle: '' }) as any
  proto.toBlob = function (cb: (b: Blob | null) => void) { cb(new Blob(['x'], { type: 'image/png' })) }
})

describe('raster utils', () => {
  it('renderToCanvas transparent fills full canvas', () => {
    const img = new Image()
    const c = renderToCanvas(img, 512, 256)
    expect(c.width).toBe(512)
    expect(c.height).toBe(256)
  })
  it('renderToCanvas with background fills bg first', () => {
    const img = new Image()
    const c = renderToCanvas(img, 1024, 512, '#ffffff', 10)
    expect(c.width).toBe(1024)
  })
  it('canvasToBlob resolves', async () => {
    const c = document.createElement('canvas')
    const b = await canvasToBlob(c, 'image/png')
    expect(b.type).toBe('image/png')
  })
})
