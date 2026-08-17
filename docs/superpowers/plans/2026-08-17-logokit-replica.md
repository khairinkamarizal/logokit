# LogoKit Replica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate https://logokit.base44.app/ 1:1 in functionality — a client-side logo asset-pack generator wizard — as a Nuxt 4 SSR app in `C:\laragon\www\logokit`.

**Architecture:** Nuxt 4 pages app. One wizard page (`/`) holds all state in refs; four step components (Brand/Assets/Colors/Generate) plus a summary sidebar. All generation logic lives in pure-ish `app/utils/` modules (svg, raster, eps, color, zip, generator) exercised only in client event handlers. A 404 catch-all page rounds it out.

**Tech Stack:** Nuxt 4 (SSR), Vue 3, Tailwind CSS (v4 CSS-first), reka-ui, lucide-vue-next, jszip, file-saver, sortablejs, @vueuse/core, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-17-logokit-replica-design.md`

## Global Constraints

- Exact design tokens (from spec §1.1): background `hsl(40 24% 96%)`, foreground `hsl(0 0% 12%)`, primary `hsl(20 100% 66%)`, primary-foreground `hsl(0 0% 12%)`, card `0 0% 100%`, muted `hsl(40 16% 93%)`, muted-foreground `hsl(0 0% 42%)`, border/input `hsl(40 14% 89%)`, destructive `hsl(0 72% 51%)`, ring `hsl(20 100% 66%)`, radius `.625rem`; fonts Inter (heading/body/display) + JetBrains Mono (mono); grid-dot `rgba(26,26,26,.06)`, bright `rgba(26,26,26,.22)`, 18px grid, flashlight mask `radial-gradient(ellipse 420px 360px at var(--mx, -9999px) var(--my, -9999px), #000 0%, rgba(0,0,0,.65) 38%, transparent)` (approximate the original mask fade — bright dots visible inside ~420×360 ellipse).
- All UI copy strings verbatim from spec §3 (headings, descriptions, placeholders, helpers, validation messages, progress messages).
- ZIP structure verbatim from spec §4.5.
- No feedback page, no auth, no dark mode.
- Node 20.19+; npm scripts: `dev`, `build`, `test` (vitest run).
- Windows PowerShell 5.1 environment (Laragon). Use `npm run` commands; forward slashes inside configs.
- Every task ends green: unit tests pass (`npx vitest run`) and, once the app builds, `npm run build` succeeds.

---

### Task 1: Scaffold Nuxt 4 app + design tokens + global chrome

**Files:**
- Create: `package.json`, `nuxt.config.ts`, `app/app.vue`, `app/assets/css/main.css`, `app/layouts/default.vue`, `tsconfig.json`, `.gitignore`, `vitest.config.ts`, `app/pages/index.vue` (placeholder), `app/pages/[...slug].vue` (placeholder)

**Interfaces:**
- Produces: runnable Nuxt app; CSS custom properties (HSL triplets like `--background: 40 24% 96%`) consumed by all later tasks via Tailwind v4 `@theme` tokens (`bg-background`, `text-primary`, `border-border`, `bg-card`, `bg-muted`, `text-muted-foreground`, `bg-destructive`, `bg-primary`, `text-primary-foreground`, `font-display`, `font-mono`); layout slots used by pages.

- [ ] **Step 1: Scaffold**

Run in `C:\laragon\www\logokit`:
```powershell
npx nuxi@latest init . --packageManager npm --gitInit false --no-install
```
If the directory prompt blocks (non-empty dir with docs/), scaffold to `%TEMP%\opencode\logokit-scaffold` instead and move files over. Then:
```powershell
npm install
npm install jszip file-saver reka-ui lucide-vue-next sortablejs @vueuse/core
npm install -D @nuxt/test-utils vitest
```

- [ ] **Step 2: nuxt.config.ts**

```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'LogoKit',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A high-performance design utility that converts raw logo files into a comprehensive, professionally organized asset ZIP package.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap' }
      ]
    }
  }
})
```

- [ ] **Step 3: Design tokens + background CSS — `app/assets/css/main.css`**

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(40 24% 96%);
  --color-foreground: hsl(0 0% 12%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(0 0% 12%);
  --color-primary: hsl(20 100% 66%);
  --color-primary-foreground: hsl(0 0% 12%);
  --color-secondary: hsl(40 16% 93%);
  --color-muted: hsl(40 16% 93%);
  --color-muted-foreground: hsl(0 0% 42%);
  --color-border: hsl(40 14% 89%);
  --color-input: hsl(40 14% 89%);
  --color-destructive: hsl(0 72% 51%);
  --color-ring: hsl(20 100% 66%);
  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius-xl2: .625rem;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.bg-dots {
  background-image: radial-gradient(circle at center, rgba(26, 26, 26, .06) 1px, transparent 1px);
  background-size: 18px 18px;
}
.bg-dots-bright {
  background-image: radial-gradient(circle at center, rgba(26, 26, 26, .22) 1px, transparent 1px);
  background-size: 18px 18px;
  -webkit-mask-image: radial-gradient(ellipse 420px 360px at var(--mx, -9999px) var(--my, -9999px), #000 0%, rgba(0, 0, 0, .65) 38%, transparent 75%);
  mask-image: radial-gradient(ellipse 420px 360px at var(--mx, -9999px) var(--my, -9999px), #000 0%, rgba(0, 0, 0, .65) 38%, transparent 75%);
}
```

- [ ] **Step 4: `app/app.vue` — global bg layers + flashlight**

```vue
<template>
  <div ref="rootRef" class="min-h-screen">
    <div class="fixed inset-0 -z-20 bg-dots" aria-hidden="true" />
    <div class="fixed inset-0 -z-10 bg-dots-bright" aria-hidden="true" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const rootRef = ref<HTMLElement | null>(null)
let raf = 0
let tx = -9999, ty = -9999, cx = -9999, cy = -9999

onMounted(() => {
  const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
  const tick = () => {
    if (Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5) {
      cx += (tx - cx) * .12
      cy += (ty - cy) * .12
      rootRef.value?.style.setProperty('--mx', `${cx}px`)
      rootRef.value?.style.setProperty('--my', `${cy}px`)
    }
    raf = requestAnimationFrame(tick)
  }
  window.addEventListener('mousemove', onMove, { passive: true })
  raf = requestAnimationFrame(tick)
  onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove) })
})
</script>
```
(CSS vars on `rootRef` cascade to the fixed layers.)

- [ ] **Step 5: `app/layouts/default.vue` — header + footer**

Header: sticky top-0 z-40 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm. Inner `max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4`. Left: `NuxtLink to="/"` with `div.w-7.h-7.bg-primary.rounded-lg.flex.items-center.justify-center` (lucide `Package` icon `w-4 h-4 text-primary-foreground`), then column: span "Logo Asset Pack" (`text-sm font-display font-medium tracking-tight leading-none`) + span "Generator" (`text-[10px] font-display italic text-muted-foreground`). Footer: `border-t border-border/50 bg-background/60 backdrop-blur-sm` — inner `max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground`: "Created with care for brand designers by @iggykos" — `@iggykos` styled `text-foreground font-medium`.

No header-actions slot: named slots don't pass from pages through `NuxtLayout` in `app.vue`. Instead, `pages/index.vue` renders the step nav and "Re-download" button at the top of its own main column (visually directly under the header). Header right side stays empty.

- [ ] **Step 6: Placeholder pages**

`app/pages/index.vue`:
```vue
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-3xl font-display font-medium tracking-tight">Logo Asset Pack</h1>
  </div>
</template>
```
`app/pages/[...slug].vue`:
```vue
<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center gap-6 py-16 text-center">
    <div class="text-7xl font-light text-slate-300">404</div>
    <div class="h-px w-24 bg-border" />
    <h1 class="text-2xl font-display font-medium">Page Not Found</h1>
    <p class="text-sm text-muted-foreground">The page "{{ $route.path }}" could not be found in this application.</p>
    <NuxtLink to="/" class="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
      <House class="w-4 h-4" /> Go Home
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
import { House } from 'lucide-vue-next'
useHead({ title: 'Page Not Found' })
</script>
```

- [ ] **Step 7: vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: { '~': resolve(__dirname, 'app') }
  }
})
```
Add `"test": "vitest run"` to package.json scripts. Create empty `tests/.gitkeep`.

- [ ] **Step 8: Verify**

```powershell
npm run dev
```
Expected: http://localhost:3000 renders heading; `/xyz` renders 404. Then `npm run build` — expect success. Stop dev server.

- [ ] **Step 9: Init git + commit**

```powershell
git init; git add -A; git commit -m "chore: scaffold Nuxt 4 app with LogoKit design tokens and chrome"
```

---

### Task 2: UI primitives (Button, Input, Label, Textarea, Switch, Select)

**Files:**
- Create: `app/components/ui/Button.vue`, `app/components/ui/Input.vue`, `app/components/ui/Label.vue`, `app/components/ui/Switch.vue`, `app/components/ui/AppSelect.vue`
- Test: `tests/ui.test.ts`

**Interfaces:**
- Produces:
  - `Button.vue`: props `variant?: 'default'|'outline'|'ghost'|'destructive'` (default `default`), `size?: 'default'|'sm'|'lg'|'icon'`, `disabled?: boolean`, `type?: string`; renders `<button>` with shadcn classes; slot content; emits click via native event.
  - `Input.vue`: `v-model` string prop `modelValue`, `placeholder`, `type='text'`, `id`, `disabled`; class `h-11 w-full rounded-xl border border-input bg-card px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring/40`.
  - `Label.vue`: slot; class `text-sm font-medium`.
  - `Switch.vue`: `v-model` boolean `modelValue`; role="switch"; `w-10 h-6 rounded-full` track (`data-[state=checked]:bg-primary`), thumb `w-4.5 h-4.5` translate-x on checked. Implement with a plain button + CSS (no reka dependency here to keep SSR simple); emits `update:modelValue`.
  - `AppSelect.vue`: props `modelValue: string`, `options: { value: string; label: string }[]`, `placeholder?: string`; renders native `<select>` styled shadcn-like (`h-10 rounded-xl border border-input bg-card px-3 text-sm`); emits `update:modelValue`. (Native select instead of Radix Select — visual parity via styling, zero complexity.)

- [ ] **Step 1: Write failing smoke tests** — `tests/ui.test.ts`

```ts
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
```
Install missing dev dep: `npm install -D @vue/test-utils jsdom`; set `environment: 'jsdom'` for this file via docblock comment at top of test file: `// @vitest-environment jsdom` (keep vitest node default elsewhere).

- [ ] **Step 2: Run — expect FAIL** (components missing). `npx vitest run tests/ui.test.ts`

- [ ] **Step 3: Implement the five components** per Interfaces above. Switch example:
```vue
<template>
  <button type="button" role="switch" :aria-checked="modelValue"
    :class="['inline-flex items-center h-6 w-10 rounded-full transition-colors', modelValue ? 'bg-primary' : 'bg-muted border border-border']"
    @click="$emit('update:modelValue', !modelValue)">
    <span :class="['block w-4.5 h-4.5 rounded-full bg-white shadow transition-transform', modelValue ? 'translate-x-4.5' : 'translate-x-1']" />
  </button>
</template>
<script setup lang="ts">
defineProps<{ modelValue?: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
```
`w-4.5/h-4.5/translate-x-4.5` need Tailwind v4 arbitrary values: use `w-[18px] h-[18px]` and `translate-x-[21px]`/`translate-x-[3px]`.
Button base classes: `inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40`; variants: default `bg-primary text-primary-foreground hover:opacity-90`, outline `border border-border bg-card hover:bg-secondary`, ghost `hover:bg-secondary`, destructive `bg-destructive text-white hover:opacity-90`; sizes: default `h-10 px-5 text-sm`, sm `h-8 px-3 text-xs`, lg `h-11 px-8`, icon `h-10 w-10`.

- [ ] **Step 4: Run tests — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: shadcn-style UI primitives (Button/Input/Label/Switch/AppSelect)"`

---

### Task 3: color utils

**Files:**
- Create: `app/utils/color.ts`
- Test: `tests/color.test.ts`

**Interfaces:**
- Produces:
  - `hexToRgb(hex: string): { r: number; g: number; b: number }` — accepts `#RGB` shorthand or `#RRGGBB` (case-insensitive); returns 0–255 ints.
  - `rgbToHex(r, g, b): string` — lowercase `#rrggbb`.
  - `isValidHex(s: string): boolean` — `#?[0-9A-Fa-f]{6}` or `#?[0-9A-Fa-f]{3}`.
  - `rgbToCmyk(r, g, b): { c: number; m: number; y: number; k: number }` — standard formula, ints 0–100 (k = 1−max(r,g,b)/255; c=(1−r/255−k)/(1−k) etc.; all zeros when k=1).
  - `cmykToRgb(c, m, y, k): { r; g; b }`.
  - `relativeLuminance({r,g,b}): number` — `(0.299r + 0.587g + 0.114b) / 255`.
  `textColorOn(hex): '#000000' | '#ffffff'` — white text when luminance ≤ .5 else black.
  - `dominantColorFromSvg(svgText: string): string | null` — scan `fill="..."`, `stop-color="..."`, `style="...color:.../#hex..."` attribute values via regex; collect hex/named colors, filter near-black (all channels < 32), near-white (all > 224), gray (max−min < 16); return the most frequent remaining color as `#rrggbb` normalized, else null. (Raster fallback dropped — SVG-only ingest means fills cover it; keep `null` when nothing found.)
  - `slugify(s: string): string` — lowercase, trim, non-alphanumeric runs → `-`, collapse dashes, strip leading/trailing `-`.

- [ ] **Step 1: Failing tests** — `tests/color.test.ts`

```ts
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
```

- [ ] **Step 2: Run — FAIL** (`npx vitest run tests/color.test.ts`)

- [ ] **Step 3: Implement `app/utils/color.ts`**

```ts
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
export function isValidHex(s: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(s.trim()) || /^#?[0-9A-Fa-f]{3}$/.test(s.trim())
}
export function rgbToCmyk(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const k = 1 - Math.max(rr, gg, bb)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - rr - k) / (1 - k)) * 100),
    m: Math.round(((1 - gg - k) / (1 - k)) * 100),
    y: Math.round(((1 - bb - k) / (1 - k)) * 100),
    k: Math.round(k * 100)
  }
}
export function cmykToRgb(c: number, m: number, y: number, k: number) {
  const f = (v: number) => 255 * (1 - v / 100) * (1 - k / 100)
  return { r: Math.round(f(c)), g: Math.round(f(m)), b: Math.round(f(y)) }
}
export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
export function textColorOn(hex: string): '#000000' | '#ffffff' {
  return relativeLuminance(hexToRgb(hex)) > 0.5 ? '#000000' : '#ffffff'
}
export function dominantColorFromSvg(svgText: string): string | null {
  const colors: string[] = []
  const attrRe = /(?:fill|stop-color)\s*=\s*"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(svgText))) {
    const v = m[1].trim().toLowerCase()
    if (v.startsWith('#') && (v.length === 4 || v.length === 7)) colors.push(rgbToHex(...Object.values(hexToRgb(v)) as [number, number, number]))
  }
  const styleRe = /(?:fill|stop-color)\s*:\s*(#[0-9a-f]{3,6})/gi
  while ((m = styleRe.exec(svgText))) {
    const v = m[1].toLowerCase()
    if (v.length === 4 || v.length === 7) colors.push(v)
  }
  const counts = new Map<string, number>()
  for (const c of colors) {
    const { r, g, b } = hexToRgb(c)
    if (r < 32 && g < 32 && b < 32) continue
    if (r > 224 && g > 224 && b > 224) continue
    if (Math.max(r, g, b) - Math.min(r, g, b) < 16) continue
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  let best: string | null = null, n = 0
  for (const [c, i] of counts) if (i > n) { best = c; n = i }
  return best
}
export function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}
```

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: color conversion and dominant color utils"`

---

### Task 4: svg utils (parse, embed, recolor, grayscale, placeholder)

**Files:**
- Create: `app/utils/svg.ts`
- Test: `tests/svg.test.ts`

**Interfaces:**
- Consumes: `hexToRgb` (Task 3) — not needed here actually; none.
- Produces:
  - `parseSvg(svgText: string): SVGElement` — DOMParser; throws Error('Invalid SVG file') on parsererror.
  - `getDimensions(svgEl: SVGElement): { width: number; height: number }` — viewBox → width/height attrs → `{800, 600}`.
  - `hasExternalImages(svgEl: SVGElement): string[]` — every `<image>` href/xlink:href that doesn't start with `data:`.
  - `embedImages(svgEl: SVGElement): Promise<void>` — fetch each external href (CORS), read as blob → data URL, set href; on any failure throw Error with the URLs joined `", "`.
  - `recolorSvg(svgEl: SVGElement, hex: string): void` — walk all elements: set `fill` attr to hex when current computed `fill` is not `none`/`transparent`/`url(...)`; set `stop-color` on `<stop>`; regex-replace `fill\s*:\s*[^;"]+` inside `style` attributes with `fill: {hex}`; set root `svg` `fill` attr to hex.
  - `grayscaleSvg(svgEl: SVGElement): void` — append/merge `filter: grayscale(1)` into root `style`.
  - `svgToText(svgEl: SVGElement): string` — XMLSerializer.
  - `makePlaceholderSvg(name: string): string` — gray `<svg viewBox="0 0 800 600">` with centered `<text>` = name (fill #9CA3AF, font-family sans-serif, font-size 48, text-anchor middle, x=400 y=300).
  - `fileToText(file: File): Promise<string>` — FileReader readAsText.

  All DOM functions require `document` — tests use jsdom (`// @vitest-environment jsdom` docblock); in embedImages use `fetch` + `FileReader.readAsDataURL` on the blob.

- [ ] **Step 1: Failing tests** — `tests/svg.test.ts`

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `app/utils/svg.ts`**

```ts
export function fileToText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsText(file)
  })
}
export function parseSvg(svgText: string): SVGElement {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG file')
  const el = doc.documentElement
  if (!el || el.tagName.toLowerCase() !== 'svg') throw new Error('Invalid SVG file')
  return el as SVGElement
}
export function getDimensions(svgEl: SVGElement): { width: number; height: number } {
  const vb = svgEl.getAttribute('viewBox')
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0)
      return { width: parts[2], height: parts[3] }
  }
  const w = parseFloat(svgEl.getAttribute('width') ?? '')
  const h = parseFloat(svgEl.getAttribute('height') ?? '')
  return { width: Number.isFinite(w) && w > 0 ? w : 800, height: Number.isFinite(h) && h > 0 ? h : 600 }
}
export function hasExternalImages(svgEl: SVGElement): string[] {
  const urls: string[] = []
  svgEl.querySelectorAll('image').forEach(img => {
    const href = img.getAttribute('href') ?? img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
    if (href && !href.startsWith('data:')) urls.push(href)
  })
  return urls
}
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error(url))
    r.readAsDataURL(blob)
  })
}
export async function embedImages(svgEl: SVGElement): Promise<void> {
  const urls = hasExternalImages(svgEl)
  await Promise.all(urls.map(async u => {
    const data = await toDataUrl(u)
    svgEl.querySelectorAll('image').forEach(img => {
      const href = img.getAttribute('href') ?? img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
      if (href === u) { img.setAttribute('href', data); img.removeAttributeNS('http://www.w3.org/1999/xlink', 'href') }
    })
  }))
}
const SKIP_FILL = /^(none|transparent|url\()/i
export function recolorSvg(svgEl: SVGElement, hex: string): void {
  const walk = (el: Element) => {
    if (el.tagName.toLowerCase() === 'stop') {
      const cur = el.getAttribute('stop-color')
      if (!cur || !SKIP_FILL.test(cur)) el.setAttribute('stop-color', hex)
    } else {
      const cur = el.getAttribute('fill')
      if (cur === null || !SKIP_FILL.test(cur)) {
        if (cur !== null) el.setAttribute('fill', hex)
      }
      const style = el.getAttribute('style')
      if (style && /fill\s*:/.test(style))
        el.setAttribute('style', style.replace(/fill\s*:\s*[^;"]+/g, `fill: ${hex}`))
    }
    for (const child of Array.from(el.children)) walk(child)
  }
  for (const child of Array.from(svgEl.children)) walk(child)
  svgEl.setAttribute('fill', hex)
}
export function grayscaleSvg(svgEl: SVGElement): void {
  const style = svgEl.getAttribute('style') ?? ''
  if (!/grayscale\s*\(/.test(style)) {
    const base = style && !style.endsWith(';') ? `${style};` : style
    svgEl.setAttribute('style', `${base} filter: grayscale(1)`.trim())
  }
}
export function svgToText(svgEl: SVGElement): string {
  return new XMLSerializer().serializeToString(svgEl)
}
export function makePlaceholderSvg(name: string): string {
  const esc = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E5E7EB"/><text x="400" y="300" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="48" fill="#9CA3AF">${esc}</text></svg>`
}
```
Note on `recolorSvg` root fill: the original sets the root `svg fill` too — implemented as final line.

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: svg parse/recolor/grayscale/placeholder utils"`

---

### Task 5: raster utils (canvas PNG/JPG/WebP)

**Files:**
- Create: `app/utils/raster.ts`
- Test: `tests/raster.test.ts`

**Interfaces:**
- Consumes: none (pure canvas).
- Produces:
  - `svgToImage(svgText: string): Promise<HTMLImageElement>` — Blob → objectURL → Image; revoke URL after load.
  - `renderToCanvas(img: HTMLImageElement, width: number, height: number, background?: string, marginPct?: number): HTMLCanvasElement` — creates canvas; if background, fillRect entire canvas; margin math per spec §4.3: `p = clamp(0,50,marginPct)/100`, `logoW = W/(1+2p)`, draw image centered at `(W−logoW)/2, (H−logoH)/2` scaled `logoW × logoW*h/w`; no background → margin ignored, draw at full canvas size.
  - `canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob>` — Promise wrapper on toBlob; throws if unsupported (null blob).
  - `supportsWebp(): Promise<boolean>` — 1×1 canvas toBlob('image/webp') test.
  - `exportRasters(svgText: string, opts: { pngSizes: number[]; jpgWidth: number; jpgQuality: number; webpSizes: number[]; jpgBackgrounds: { name: string; hex: string }[]; jpgMargin: number }): Promise<{ files: { path: string; blob: Blob }[] }>` — high-level: builds one image; PNG per size (`transparent`), JPG per background (1024 wide), WebP per size; `path` = file name only (caller zips); skip WebP entirely when unsupported.

- [ ] **Step 1: Failing tests** — `tests/raster.test.ts` (jsdom; canvas toBlob may not exist in jsdom → polyfill stub in test)

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
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
```
Add `import { beforeAll } from 'vitest'` to imports.

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `app/utils/raster.ts`**

```ts
export function svgToImage(svgText: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to rasterize SVG')) }
    img.src = url
  })
}
export function renderToCanvas(img: HTMLImageElement, width: number, height: number, background?: string, marginPct = 0): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')!
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const p = Math.min(50, Math.max(0, marginPct)) / 100
    const logoW = width / (1 + 2 * p)
    const logoH = logoW * (img.naturalHeight || 1) / (img.naturalWidth || 1)
    const scale = Math.min(logoW / (img.naturalWidth || logoW), logoH / (img.naturalHeight || logoH))
    const dw = (img.naturalWidth || logoW) * scale
    const dh = (img.naturalHeight || logoH) * scale
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh)
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  return canvas
}
export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error(`Canvas export failed: ${type}`)), type, quality)
  })
}
export async function supportsWebp(): Promise<boolean> {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    return await canvasToBlob(c, 'image/webp').then(b => b.type === 'image/webp')
  } catch { return false }
}
export interface RasterOpts {
  pngSizes: number[]
  jpgWidth: number
  jpgQuality: number
  webpSizes: number[]
  jpgBackgrounds: { name: string; hex: string }[]
  jpgMargin: number
  ratio: number
}
export async function exportRasters(svgText: string, baseName: string, opts: RasterOpts): Promise<{ files: { name: string; blob: Blob }[] }> {
  const img = await svgToImage(svgText)
  const files: { name: string; blob: Blob }[] = []
  const h = (w: number) => w * opts.ratio
  for (const s of opts.pngSizes)
    files.push({ name: `${baseName}-transparent-${s}.png`, blob: await canvasToBlob(renderToCanvas(img, s, h(s)), 'image/png') })
  const webp = await supportsWebp()
  if (webp)
    for (const s of opts.webpSizes)
      files.push({ name: `${baseName}-transparent-${s}.webp`, blob: await canvasToBlob(renderToCanvas(img, s, h(s)), 'image/webp', opts.jpgQuality) })
  for (const bg of opts.jpgBackgrounds)
    files.push({ name: `${baseName}-${bg.name}.jpg`, blob: await canvasToBlob(renderToCanvas(img, opts.jpgWidth, h(opts.jpgWidth), bg.hex, opts.jpgMargin), 'image/jpeg', opts.jpgQuality) })
  return { files }
}
```
Note: `renderToCanvas` transparent path draws image at canvas size (upscaling allowed per original which forces 512–4096 widths).

- [ ] **Step 4: Run — PASS** (stubs satisfy geometry assertions).

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: canvas raster export utils"`

---

### Task 6: EPS compiler

**Files:**
- Create: `app/utils/eps.ts`
- Test: `tests/eps.test.ts`

**Interfaces:**
- Consumes: `rgbToCmyk` (Task 3).
- Produces:
  - `svgToEps(svgEl: SVGElement, opts: { cmyk?: { c: number; m: number; y: number; k: number }; title: string }): string` — full PostScript document per spec §4.4.

- [ ] **Step 1: Failing test** — `tests/eps.test.ts`

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `app/utils/eps.ts`** — structure:

```ts
import { rgbToCmyk } from './color'

const SKIP = new Set(['defs', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'style', 'metadata', 'title', 'desc', 'symbol', 'use', 'image'])

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString()

function parseFill(el: Element): { r: number; g: number; b: number } | null {
  let v = el.getAttribute('fill')
  const style = el.getAttribute('style') ?? ''
  const m = style.match(/fill\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/)
  if (m) v = m[1]
  if (!v || v === 'none' || v.startsWith('url(') || v === 'transparent') return null
  if (v.startsWith('#')) {
    let h = v.slice(1)
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    const n = parseInt(h, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const rgb = v.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] }
  return { r: 0, g: 0, b: 0 }
}

function psColor(rgb: { r: number; g: number; b: number }): string {
  const { c, m, y, k } = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  return `${c / 100} ${m / 100} ${y / 100} ${k / 100} setcmykcolor`
}

function fontFor(family: string | null): string {
  const f = (family ?? '').toLowerCase()
  if (f.includes('times')) return 'Times-Roman'
  if (f.includes('courier')) return 'Courier'
  return 'Helvetica'
}

function parseTransform(tr: string | null): string[] {
  if (!tr) return []
  const ops: string[] = []
  const re = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tr))) {
    const args = m[2].split(/[\s,]+/).filter(Boolean).map(Number)
    switch (m[1]) {
      case 'matrix': ops.push(`[${args.join(' ')}] concat`); break
      case 'translate': ops.push(`${f3(args[0])} ${f3(args[1] ?? 0)} translate`); break
      case 'scale': ops.push(`${f3(args[0])} ${f3(args[1] ?? args[0])} scale`); break
      case 'rotate': ops.push(`${f3(args[0])} rotate`); break
    }
  }
  return ops
}

function arcPath(cx: number, cy: number, rx: number, ry: number): string[] {
  const k = 0.5523
  return [
    `${f3(cx - rx)} ${f3(cy)} moveto`,
    `${f3(cx - rx)} ${f3(cy + ry * k)} ${f3(cx - rx * k)} ${f3(cy + ry)} ${f3(cx)} ${f3(cy + ry)} curveto`,
    `${f3(cx + rx * k)} ${f3(cy + ry)} ${f3(cx + rx)} ${f3(cy + ry * k)} ${f3(cx + rx)} ${f3(cy)} curveto`,
    `${f3(cx + rx)} ${f3(cy - ry * k)} ${f3(cx + rx * k)} ${f3(cy - ry)} ${f3(cx)} ${f3(cy - ry)} curveto`,
    `${f3(cx - rx * k)} ${f3(cy - ry)} ${f3(cx - rx)} ${f3(cy - ry * k)} ${f3(cx - rx)} ${f3(cy)} curveto`,
    'closepath'
  ]
}

export function svgToEps(svgEl: SVGElement, opts: { cmyk?: { c: number; m: number; y: number; k: number }; title: string }): string {
  const dims = svgEl.getAttribute('viewBox')
    ? svgEl.getAttribute('viewBox')!.trim().split(/[\s,]+/).map(Number).slice(2)
    : [parseFloat(svgEl.getAttribute('width') ?? '800') || 800, parseFloat(svgEl.getAttribute('height') ?? '600') || 600]
  const [W, H] = dims
  const out: string[] = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${f3(W)} ${f3(H)}`,
    `%%Title: (${opts.title})`,
    '%%Creator: Logo Asset Pack Generator',
    '%%LanguageLevel: 2',
    '%%EndComments',
    '%%Page: 1 1',
    'gsave'
  ]
  if (opts.cmyk) out.push(`${opts.cmyk.c / 100} ${opts.cmyk.m / 100} ${opts.cmyk.y / 100} ${opts.cmyk.k / 100} setcmykcolor`)
  out.push(`0 ${f3(H)} translate 1 -1 scale`)

  const emit = (el: Element, depth: number) => {
    const tag = el.tagName.toLowerCase()
    if (SKIP.has(tag)) return
    const tr = parseTransform(el.getAttribute('transform'))
    let pushed = false
    if (tr.length) { out.push('gsave', ...tr); pushed = true }
    const fill = parseFill(el)
    if (fill && !opts.cmyk) out.push(psColor(fill))
    switch (tag) {
      case 'g': case 'a': case 'svg':
        for (const c of Array.from(el.children)) emit(c, depth + 1)
        break
      case 'path': {
        out.push(...pathOps(el.getAttribute('d') ?? ''))
        break
      }
      case 'rect': {
        const x = +(el.getAttribute('x') ?? 0), y = +(el.getAttribute('y') ?? 0)
        const w = +el.getAttribute('width')!, hgt = +el.getAttribute('height')!
        out.push(`${f3(x)} ${f3(y)} moveto`, `${f3(x + w)} ${f3(y)} rlineto`, `${f3(0)} ${f3(hgt)} rlineto`, `${f3(-w)} ${f3(0)} rlineto`, 'closepath fill')
        break
      }
      case 'circle': case 'ellipse': {
        const cx = +(el.getAttribute('cx') ?? 0), cy = +(el.getAttribute('cy') ?? 0)
        const rx = +(el.getAttribute('rx') ?? el.getAttribute('r') ?? 0)
        const ry = +(el.getAttribute('ry') ?? el.getAttribute('r') ?? 0)
        out.push(...arcPath(cx, cy, rx, ry), 'fill')
        break
      }
      case 'line': {
        out.push(`${f3(+(el.getAttribute('x1') ?? 0))} ${f3(+(el.getAttribute('y1') ?? 0))} moveto`, `${f3(+(el.getAttribute('x2') ?? 0))} ${f3(+(el.getAttribute('y2') ?? 0))} lineto`)
        break
      }
      case 'polygon': case 'polyline': {
        const pts = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number)
        if (pts.length >= 4) {
          out.push(`${f3(pts[0])} ${f3(pts[1])} moveto`)
          for (let i = 2; i + 1 < pts.length; i += 2) out.push(`${f3(pts[i])} ${f3(pts[i + 1])} lineto`)
          if (tag === 'polygon') out.push('closepath fill')
        }
        break
      }
      case 'text': {
        const x = +(el.getAttribute('x') ?? 0), y = +(el.getAttribute('y') ?? 0)
        const size = +(el.getAttribute('font-size') ?? 16)
        const anchor = el.getAttribute('text-anchor')
        const content = el.textContent ?? ''
        out.push(`/${fontFor(el.getAttribute('font-family'))} findfont ${f3(size)} scalefont setfont`)
        const tx = anchor === 'middle' ? x : anchor === 'end' ? x : x
        if (anchor === 'middle') out.push(`${f3(x)} ${f3(y)} moveto (${content}) dup stringwidth pop 2 div neg 0 rmoveto show`)
        else if (anchor === 'end') out.push(`${f3(x)} ${f3(y)} moveto (${content}) dup stringwidth pop neg 0 rmoveto show`)
        else out.push(`${f3(x)} ${f3(y)} moveto (${content}) show`)
        break
      }
    }
    if (pushed) out.push('grestore')
  }
  for (const c of Array.from(svgEl.children)) emit(c, 0)
  out.push('grestore', '%%EOF')
  return out.join('\n')
}
```
Also implement `pathOps(d: string): string[]` in the same file — a complete SVG path parser handling M/m/L/l/H/h/V/v/C/c/S/s/Q/q/T/t/A/a/Z/z emitting `moveto/lineto/curveto/closepath fill` (bezier control points carried for S/T reflection; arcs approximated by sampling 16 line segments). Because this is long, implement carefully with a token loop: tokenize numbers/commands with `/([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi`, track current point, last control point; on `Z` push `closepath fill`; on any subsequent `M` a new subpath starts (previous auto-closed with `closepath fill` if not already). After the final command push `closepath fill` if a subpath is open. Every shape op sequence ends with fill (flat fill semantics per original: path filled with current color).

Replace the test expectation `'closepath fill'` accordingly — it holds.

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: SVG to CMYK EPS PostScript compiler"`

---

### Task 7: zip utils + naming rules

**Files:**
- Create: `app/utils/zip.ts`
- Test: `tests/zip.test.ts`

**Interfaces:**
- Consumes: `slugify` (Task 3).
- Produces:
  - `ASSET_TYPES` const (Task 8 consumes): `[{ value: 'primary_logo', label: 'Primary Logo' }, { value: 'horizontal_logo', label: 'Horizontal Logo' }, { value: 'vertical_logo', label: 'Vertical Logo' }, { value: 'logo_mark', label: 'Logo Mark' }, { value: 'monogram', label: 'Monogram' }, { value: 'wordmark', label: 'Wordmark' }, { value: 'app_icon_source', label: 'App Icon Source' }, { value: 'custom', label: 'Custom' }]`
  - `typeLabel(type: string, customName?: string): string` → folder label: custom → `slugify(customName)` replaced `_`; map primary_logo → `Primary_Logo` etc.; fallback `Custom`.
  - `assetFolderNames(assets: { id: string; type: string; customName?: string }[]): { id: string; folder: string }[]` — `01_`, `02_`…; duplicates of the same label get `-2`, `-3` suffix.
  - `zipFileName(brand: string): string` — `${capitalize(slugify(brand))}_Logo_Asset_Pack.zip`.
  - `buildZip(files: { path: string; blob: Blob }[], onProgress?: (i: number, total: number) => void): Promise<Blob>` — JSZip DEFLATE level 6; add each at path; `generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })`.
  - `downloadBlob(blob: Blob, name: string): void` — FileSaver `saveAs`.

- [ ] **Step 1: Failing test** — `tests/zip.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { typeLabel, assetFolderNames, zipFileName } from '~/utils/zip'

describe('zip naming', () => {
  it('typeLabel maps and custom slug', () => {
    expect(typeLabel('primary_logo')).toBe('Primary_Logo')
    expect(typeLabel('app_icon_source')).toBe('App_Icon_Source')
    expect(typeLabel('custom', 'My Mark')).toBe('My_Mark')
    expect(typeLabel('custom')).toBe('Custom')
  })
  it('assetFolderNames numbers and dedups', () => {
    const folders = assetFolderNames([
      { id: 'a', type: 'primary_logo' },
      { id: 'b', type: 'primary_logo' },
      { id: 'c', type: 'logo_mark' }
    ])
    expect(folders.map(f => f.folder)).toEqual(['01_Primary_Logo', '01_Primary_Logo-2', '02_Logo_Mark'])
  })
  it('zipFileName capitalizes slug', () => {
    expect(zipFileName('Acme Corporation')).toBe('Acme-corporation_Logo_Asset_Pack.zip')
  })
})
```
Wait — spec says `{CapitalizedBrand}` where brand slug = lowercase non-alphanum → `-`, first letter uppercased. `Acme Corporation` → slug `acme-corporation` → capitalize first letter only → `Acme-corporation`. The test above encodes that.

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `app/utils/zip.ts`**

```ts
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { slugify } from './color'

export const ASSET_TYPES = [
  { value: 'primary_logo', label: 'Primary Logo' },
  { value: 'horizontal_logo', label: 'Horizontal Logo' },
  { value: 'vertical_logo', label: 'Vertical Logo' },
  { value: 'logo_mark', label: 'Logo Mark' },
  { value: 'monogram', label: 'Monogram' },
  { value: 'wordmark', label: 'Wordmark' },
  { value: 'app_icon_source', label: 'App Icon Source' },
  { value: 'custom', label: 'Custom' }
] as const

const LABELS: Record<string, string> = {
  primary_logo: 'Primary_Logo', horizontal_logo: 'Horizontal_Logo', vertical_logo: 'Vertical_Logo',
  logo_mark: 'Logo_Mark', monogram: 'Monogram', wordmark: 'Wordmark',
  app_icon_source: 'App_Icon_Source', custom: 'Custom'
}

export function typeLabel(type: string, customName?: string): string {
  if (type === 'custom') {
    const s = slugify(customName ?? '')
    return s ? s.replace(/-/g, '_') : 'Custom'
  }
  return LABELS[type] ?? 'Custom'
}

export function assetFolderNames(assets: { id: string; type: string; customName?: string }[]): { id: string; folder: string }[] {
  const seen = new Map<string, number>()
  let n = 0
  return assets.map(a => {
    n++
    let label = typeLabel(a.type, a.customName)
    const count = (seen.get(label) ?? 0) + 1
    seen.set(label, count)
    if (count > 1) label = `${label}-${count}`
    return { id: a.id, folder: `${String(n).padStart(2, '0')}_${label}` }
  })
}

export function zipFileName(brand: string): string {
  const s = slugify(brand)
  return `${s.charAt(0).toUpperCase() + s.slice(1)}_Logo_Asset_Pack.zip`
}

export async function buildZip(files: { path: string; blob: Blob }[]): Promise<Blob> {
  const zip = new JSZip()
  for (const f of files) zip.file(f.path, f.blob)
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export function downloadBlob(blob: Blob, name: string): void {
  saveAs(blob, name)
}
```

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: zip packaging and asset naming rules"`

---

### Task 8: generator orchestrator

**Files:**
- Create: `app/utils/generator.ts`
- Test: `tests/generator.test.ts`

**Interfaces:**
- Consumes: Tasks 3–7 (`parseSvg`, `embedImages`, `recolorSvg`, `grayscaleSvg`, `svgToText`, `getDimensions`, `makePlaceholderSvg`, `exportRasters`, `svgToEps`, `buildZip`, `assetFolderNames`, `zipFileName`, `typeLabel`, `ASSET_TYPES`, `rgbToCmyk`, `slugify`).
- Produces:
  ```ts
  export interface LogoAsset { id: string; type: string; customName?: string; name: string; file?: File }
  export interface BrandColor { id: string; name: string; hex: string; cmyk: { c: number; m: number; y: number; k: number }; cmykManual: boolean; useForLogo: boolean; useAsBackground: boolean; digitalOnly: boolean; printOnly: boolean }
  export interface GeneratorConfig { brandName: string; assets: LogoAsset[]; colors: BrandColor[]; bwVersion: boolean; originalVersion: boolean; jpgMargin: number }
  export interface Progress { step: number; total: number; message: string }
  export type ProgressCb = (p: Progress) => void
  export async function generateAssetPack(cfg: GeneratorConfig, onProgress: ProgressCb): Promise<{ zip: Blob; fileName: string; tree: ZipEntry[] }>
  export interface ZipEntry { name: string; depth: number; type: 'folder' | 'file' }
  export function buildVariants(cfg: GeneratorConfig): VariantInfo[]
  export interface VariantInfo { slug: string; label: string; kind: 'original' | 'color' | 'black' | 'white'; hex?: string; cmyk?: { c: number; m: number; y: number; k: number } }
  export function jpgBackgrounds(cfg: GeneratorConfig): { name: string; hex: string }[]
  export function estimateFileCount(cfg: GeneratorConfig): number
  export function buildTreePreview(cfg: GeneratorConfig): ZipEntry[]
  ```
  Behavior per spec §4: variant list = original (if `originalVersion`) + brand colors (`useForLogo !== false`) + black & white (if `bwVersion`); JPG backgrounds = white-bg/black-bg + one per brand color; same-hex variant/bg pair skipped; EPS first 4 variants only; PNG sizes [512,1024,2048,4096]; JPG 1024 q .92; WebP sizes [512,1024,2048,4096] q .92 (skipped if unsupported); folder/file naming per Task 7; progress messages `"{AssetTypeLabel}: generating PNG exports"` → `JPG` → `WebP` → `print exports`, `"Generating ZIP archive"`, `"Done!"`; total = assets×4+2; `setTimeout(0)` yields between phases; final `buildZip` + return blob/fileName/tree.

- [ ] **Step 1: Failing test** — `tests/generator.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { buildVariants, jpgBackgrounds, estimateFileCount, buildTreePreview } from '~/utils/generator'
import type { GeneratorConfig } from '~/utils/generator'

const base = {
  brandName: 'Acme',
  assets: [{ id: 'a1', type: 'primary_logo', name: 'acme-logo' }],
  colors: [
    { id: 'c1', name: 'Brand Blue', hex: '#3B82F6', cmyk: { c: 71, m: 47, y: 0, k: 4 }, cmykManual: false, useForLogo: true, useAsBackground: true, digitalOnly: false, printOnly: false }
  ],
  bwVersion: true,
  originalVersion: true,
  jpgMargin: 10
} as unknown as GeneratorConfig

describe('generator planning', () => {
  it('buildVariants order: original, colors, black, white', () => {
    const v = buildVariants(base)
    expect(v.map(x => x.slug)).toEqual(['original', 'brand-blue', 'black', 'white'])
    expect(v[1].cmyk).toEqual({ c: 71, m: 47, y: 0, k: 4 })
    expect(v[2].cmyk).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    expect(v[3].cmyk).toEqual({ c: 0, m: 0, y: 0, k: 0 })
  })
  it('respects toggles and useForLogo=false', () => {
    const v = buildVariants({ ...base, bwVersion: false, originalVersion: false, colors: [{ ...base.colors[0], useForLogo: false }] })
    expect(v).toEqual([])
  })
  it('jpgBackgrounds includes white, black, brand colors', () => {
    expect(jpgBackgrounds(base).map(b => b.name)).toEqual(['white-bg', 'black-bg', 'brand-blue-bg'])
  })
  it('estimateFileCount math', () => {
    // 1 asset, 4 variants: svg 4 + png 16 + jpg (4 variants × 3 bgs, minus same-hex skips: brand-blue on brand-blue-bg = 11) + webp 16 + eps 4
    expect(estimateFileCount(base)).toBe(4 + 16 + 11 + 16 + 4)
  })
  it('buildTreePreview matches zip layout', () => {
    const t = buildTreePreview(base)
    expect(t[0]).toEqual({ name: 'Acme_Logo_Asset_Pack.zip', depth: 0, type: 'folder' })
    expect(t.some(e => e.name === '01_Primary_Logo' && e.depth === 1)).toBe(true)
    expect(t.some(e => e.name === '01_RGB_Digital' && e.depth === 2)).toBe(true)
    expect(t.some(e => e.name.endsWith('-transparent-4096.png') && e.type === 'file')).toBe(true)
  })
})
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `app/utils/generator.ts`**

```ts
import { parseSvg, embedImages, recolorSvg, grayscaleSvg, svgToText, getDimensions, makePlaceholderSvg, fileToText } from './svg'
import { exportRasters } from './raster'
import { svgToEps } from './eps'
import { buildZip, assetFolderNames, zipFileName, typeLabel, ASSET_TYPES } from './zip'
import { rgbToCmyk, slugify, hexToRgb } from './color'

export type { ASSET_TYPES }
export interface LogoAsset { id: string; type: string; customName?: string; name: string; file?: File }
export interface BrandColor { id: string; name: string; hex: string; cmyk: { c: number; m: number; y: number; k: number }; cmykManual: boolean; useForLogo: boolean; useAsBackground: boolean; digitalOnly: boolean; printOnly: boolean }
export interface GeneratorConfig { brandName: string; assets: LogoAsset[]; colors: BrandColor[]; bwVersion: boolean; originalVersion: boolean; jpgMargin: number }
export interface Progress { step: number; total: number; message: string }
export type ProgressCb = (p: Progress) => void
export interface VariantInfo { slug: string; label: string; kind: 'original' | 'color' | 'black' | 'white'; hex?: string; cmyk?: { c: number; m: number; y: number; k: number } }
export interface ZipEntry { name: string; depth: number; type: 'folder' | 'file' }

const PNG_SIZES = [512, 1024, 2048, 4096]
const JPG_WIDTH = 1024
const QUALITY = 0.92
const EPS_VARIANT_LIMIT = 4

const yieldUI = () => new Promise(r => setTimeout(r, 0))

export function buildVariants(cfg: GeneratorConfig): VariantInfo[] {
  const out: VariantInfo[] = []
  if (cfg.originalVersion) out.push({ slug: 'original', label: 'Original', kind: 'original' })
  for (const c of cfg.colors) {
    if (c.useForLogo === false) continue
    const rgb = hexToRgb(c.hex)
    out.push({
      slug: slugify(c.name) || `brand-color-${out.length}`,
      label: c.name || `Brand Color ${out.length}`,
      kind: 'color', hex: c.hex,
      cmyk: c.cmykManual ? c.cmyk : rgbToCmyk(rgb.r, rgb.g, rgb.b)
    })
  }
  if (cfg.bwVersion) {
    out.push({ slug: 'black', label: 'Black', kind: 'black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 } })
    out.push({ slug: 'white', label: 'White', kind: 'white', hex: '#ffffff', cmyk: { c: 0, m: 0, y: 0, k: 0 } })
  }
  return out
}

export function jpgBackgrounds(cfg: GeneratorConfig): { name: string; hex: string }[] {
  return [
    { name: 'white-bg', hex: '#ffffff' },
    { name: 'black-bg', hex: '#000000' },
    ...cfg.colors.map(c => ({ name: `${slugify(c.name) || 'brand'}-bg`, hex: c.hex.toLowerCase() }))
  ]
}

export function estimateFileCount(cfg: GeneratorConfig): number {
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  let perAsset = 0
  for (const v of variants) {
    perAsset += 1 + PNG_SIZES.length * 2 // svg + png + webp
    for (const b of bgs) if (!v.hex || v.hex.toLowerCase() !== b.hex) perAsset += 1
  }
  perAsset += Math.min(variants.length, EPS_VARIANT_LIMIT)
  return perAsset * cfg.assets.length
}
```
Test check (1 asset, 4 variants, 3 bgs, brand-blue hex `#3B82F6` vs bg `#3b82f6` → 1 skip → 11 jpgs): perAsset = (1+8)×4 + 11 + 4 = 51 = 4+16+11+16+4 ✓.

```ts
export function buildTreePreview(cfg: GeneratorConfig): ZipEntry[] {
  const entries: ZipEntry[] = []
  entries.push({ name: zipFileName(cfg.brandName), depth: 0, type: 'folder' })
  const folders = assetFolderNames(cfg.assets)
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  const brand = slugify(cfg.brandName)
  cfg.assets.forEach((asset, i) => {
    const label = typeLabel(asset.type, asset.customName)
    const fileBase = `${brand}-${slugify(label.toLowerCase().replace(/_/g, '-'))}`
    entries.push({ name: folders[i].folder, depth: 1, type: 'folder' })
    entries.push({ name: '01_RGB_Digital', depth: 2, type: 'folder' })
    entries.push({ name: '01_SVG', depth: 3, type: 'folder' })
    for (const v of variants) entries.push({ name: `${fileBase}-rgb-${v.slug}.svg`, depth: 4, type: 'file' })
    entries.push({ name: '02_PNG_Transparent', depth: 3, type: 'folder' })
    for (const v of variants) for (const s of PNG_SIZES) entries.push({ name: `${fileBase}-rgb-${v.slug}-transparent-${s}.png`, depth: 4, type: 'file' })
    entries.push({ name: '03_JPG', depth: 3, type: 'folder' })
    for (const v of variants) for (const b of bgs) if (!v.hex || v.hex.toLowerCase() !== b.hex) entries.push({ name: `${fileBase}-rgb-${v.slug}-${b.name}.jpg`, depth: 4, type: 'file' })
    entries.push({ name: '04_WEBP', depth: 3, type: 'folder' })
    for (const v of variants) for (const s of PNG_SIZES) entries.push({ name: `${fileBase}-rgb-${v.slug}-transparent-${s}.webp`, depth: 4, type: 'file' })
    entries.push({ name: '02_CMYK_Print_EPS', depth: 2, type: 'folder' })
    for (const v of variants.slice(0, EPS_VARIANT_LIMIT)) entries.push({ name: `${fileBase}-cmyk-${v.slug}.eps`, depth: 3, type: 'file' })
  })
  return entries
}
```

Main pipeline:

```ts
export async function generateAssetPack(cfg: GeneratorConfig, onProgress: ProgressCb): Promise<{ zip: Blob; fileName: string; tree: ZipEntry[] }> {
  const variants = buildVariants(cfg)
  const bgs = jpgBackgrounds(cfg)
  const folders = assetFolderNames(cfg.assets)
  const brand = slugify(cfg.brandName)
  const total = cfg.assets.length * 4 + 2
  let step = 0
  const tick = (message: string) => { onProgress({ step: Math.min(step, total), total, message }); step++ }
  onProgress({ step: 0, total, message: 'Initializing…' })

  const files: { path: string; blob: Blob }[] = []

  for (let i = 0; i < cfg.assets.length; i++) {
    const asset = cfg.assets[i]
    const label = typeLabel(asset.type, asset.customName)
    const fileBase = `${brand}-${slugify(label.toLowerCase().replace(/_/g, '-'))}`
    const folder = `${folders[i].folder}/`
    const svgText = asset.file ? await fileToText(asset.file) : makePlaceholderSvg(asset.name)
    let svgEl = parseSvg(svgText)
    try { await embedImages(svgEl) } catch (e: any) {
      throw new Error(`"${asset.name}" links to external image(s) that could not be embedded ("${hasExternalImages(svgEl).join(', ')}"). Embed all images in your SVG before uploading — in Illustrator, place images with "Link" unchecked, then save as SVG.`)
    }
    const dims = getDimensions(svgEl)
    const ratio = dims.height / dims.width

    // SVG + PNG
    const variantSvgs = variants.map(v => {
      const el = parseSvg(svgToText(svgEl))
      if (v.kind === 'original') return { v, text: svgToText(el) }
      if (v.kind === 'black' || v.kind === 'white' || v.kind === 'color') recolorSvg(el, v.hex!)
      return { v, text: svgToText(el) }
    })
    for (const { v, text } of variantSvgs)
      files.push({ path: `${folder}01_RGB_Digital/01_SVG/${fileBase}-rgb-${v.slug}.svg`, blob: new Blob([text], { type: 'image/svg+xml' }) })
    tick(`${label}: generating PNG exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const { files: pngs } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: PNG_SIZES, jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: [], jpgBackgrounds: [], jpgMargin: 0, ratio
      })
      for (const f of pngs) files.push({ path: `${folder}01_RGB_Digital/02_PNG_Transparent/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating JPG exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const vBgs = bgs.filter(b => !v.hex || v.hex.toLowerCase() !== b.hex)
      const { files: jpgs } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: [], jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: [], jpgBackgrounds: vBgs, jpgMargin: cfg.jpgMargin, ratio
      })
      for (const f of jpgs) files.push({ path: `${folder}01_RGB_Digital/03_JPG/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating WebP exports`)
    await yieldUI()
    for (const { v, text } of variantSvgs) {
      const { files: webps } = await exportRasters(text, `${fileBase}-rgb-${v.slug}`, {
        pngSizes: [], jpgWidth: JPG_WIDTH, jpgQuality: QUALITY, webpSizes: PNG_SIZES, jpgBackgrounds: [], jpgMargin: 0, ratio
      })
      for (const f of webps) files.push({ path: `${folder}01_RGB_Digital/04_WEBP/${f.name}`, blob: f.blob })
    }
    tick(`${label}: generating print exports`)
    await yieldUI()
    for (const v of variants.slice(0, EPS_VARIANT_LIMIT)) {
      const el = parseSvg(variantSvgs.find(x => x.v.slug === v.slug)!.text)
      const eps = svgToEps(el, {
        cmyk: v.kind === 'original' ? undefined : v.cmyk,
        title: `${cfg.brandName} ${label} CMYK ${v.slug}`
      })
      files.push({ path: `${folder}02_CMYK_Print_EPS/${fileBase}-cmyk-${v.slug}.eps`, blob: new Blob([eps], { type: 'application/postscript' }) })
    }
  }

  tick('Generating ZIP archive')
  await yieldUI()
  const zip = await buildZip(files)
  tick('Done!')
  return { zip, fileName: zipFileName(cfg.brandName), tree: buildTreePreview(cfg) }
}
```
Import `hasExternalImages` in the error branch (add to the svg import list). Note JPG/WebP phases call exportRasters with empty pngSizes — the function tolerates empty arrays (loops just skip).

- [ ] **Step 4: Run — PASS** (`npx vitest run tests/generator.test.ts`)

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: asset pack generator pipeline with progress and tree preview"`

---

### Task 9: Wizard page — state, stepper, summary sidebar, Brand step

**Files:**
- Create: `app/pages/index.vue`, `app/components/stepper/StepNav.vue`, `app/components/stepper/SummarySidebar.vue`, `app/components/steps/BrandStep.vue`, `app/components/ErrorBanner.vue`
- Test: `tests/wizard.test.ts`

**Interfaces:**
- Consumes: UI primitives (Task 2), `Button/Input/Label`, lucide icons.
- Produces: wizard state refs in `index.vue` (`step: Ref<number>`, `brandName: Ref<string>`, `logoAssets: Ref<LogoAsset[]>`, `brandColors: Ref<BrandColor[]>`, `bwVersion/originalVersion: Ref<boolean>`, `jpgMargin: Ref<number>`, `errors: Ref<string[]>`, `isGenerating/done: Ref<boolean>`, `progress: Ref<Progress|null>`), passed via props/emit to step components. Step labels `['Brand', 'Assets', 'Colors', 'Generate']`.

`index.vue` skeleton (implement fully):
- `max-w-7xl mx-auto px-4 sm:px-6 py-8`; inner `grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start`; main `max-w-5xl w-full space-y-6`.
- `<StepNav :step="step" :can-go-to="canGoTo" @go="n => step = n" :done="done" />` rendered in a bar directly under header (visible on desktop; the original renders it in the header — acceptable parity).
- Step area: `<Transition name="step" mode="out-in">` wrapping `<component :is="currentStepComponent" ... />` with CSS: `.step-enter-active, .step-leave-active { transition: all .2s ease-out } .step-enter-from { opacity: 0; transform: translateY(12px) } .step-leave-to { opacity: 0; transform: translateY(-8px) }`.
- Nav row: Back (outline, disabled step===0) / Continue (ArrowRight) — on step 3 renders Generate button instead (Sparkles icon, `h-11 px-8 text-sm font-semibold`), states "Generating…" (Loader2 animate-spin) while `isGenerating`, "Download Again" (Download icon) when `done`.
- `canContinue` validation per spec (brand name required at step 0; ≥1 asset with file OR placeholder allowed? — original requires ≥1 file: enforce `logoAssets.some(a => a.file)`); errors pushed to `errors` ref, rendered by `<ErrorBanner :errors="errors" />` (AlertTriangle, `bg-destructive/10 border border-destructive/20 rounded-xl`).
- Continue handler: `validateCurrent(); if (errors.length) return; step++`.
- Generate handler (Task 12 wires real pipeline; for now `console.log(cfg)` — no: implement the real call here in Task 12; this task leaves a `onGenerate` stub that sets `done=false, isGenerating=true` then immediately `isGenerating=false, done=true` — replaced in Task 12).

`StepNav.vue`: pills Brand/Assets/Colors/Generate; `aria-label="Steps"`; current pill `bg-primary text-primary-foreground rounded-full px-3 h-8 text-xs font-medium flex items-center gap-1.5`; completed shows Check icon (`w-3.5 h-3.5`); future `text-muted-foreground cursor-not-allowed`; ChevronRight `w-4 h-4 text-muted-foreground` separators; click allowed only when `step <= props.step` (completed/current).

`SummarySidebar.vue` (desktop only, `hidden lg:block sticky top-20`): card `bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4`; title "Summary" (`text-sm font-display font-medium`); rows: "Brand" → `brandName || '—'`; "Logo Files" → count; "Brand Colors" → count `text-primary font-mono`; Separator; swatch strip (`flex gap-2 flex-wrap`; `w-6 h-6 rounded` per color, `:title="c.name + ' — ' + c.hex"`); Separator; numbered file list (`01`, `02`… `font-mono text-xs text-muted-foreground` + name or "Untitled").

`BrandStep.vue`: card wrapper `bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-5`; h2 "Set up your <em class="italic">brand</em>" (`text-3xl sm:text-4xl font-display font-medium tracking-tight`); description paragraph (spec §3.2 verbatim); section label "BRAND" (`text-xs font-medium tracking-widest text-muted-foreground`); field label "Brand Name"; `<Input id="brand-name" v-model="model" placeholder="e.g. Acme Corporation" />`; helper "Used in all generated filenames and folder names." (`text-xs text-muted-foreground`).

`ErrorBanner.vue`: props `errors: string[]`; `<Transition name="banner">` div with AlertTriangle icon, list of errors; hidden when empty.

- [ ] **Step 1: Failing test** — `tests/wizard.test.ts`

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement the five files** per descriptions above.

- [ ] **Step 4: Run — PASS.** Also `npm run dev` and click through: typing brand name, Continue moves to step 2 (AssetsStep from Task 10 not yet present — guard with `v-if` placeholders rendering "AssetsStep placeholder" so navigation works).

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: wizard shell, step nav, summary sidebar, brand step"`

---

### Task 10: Assets step (dropzone, asset rows, reorder, delete)

**Files:**
- Create: `app/components/steps/AssetsStep.vue`, `app/components/steps/AssetRow.vue`
- Test: `tests/assets.test.ts`

**Interfaces:**
- Consumes: `LogoAsset` type (Task 8), `ASSET_TYPES` (Task 7 via re-export in generator), UI primitives.
- Produces: `AssetsStep.vue` props `assets: LogoAsset[]`, emits `update:assets` (array replace), `error: string | null`; internal file handling: hidden `<input type="file" multiple accept=".svg">`; dropzone div with drag events; validation skip message state.
- `AssetRow.vue` props `asset: LogoAsset`, `index: number`; emits `update:type`, `update:customName`, `remove`, `move` (from sortable integration — implement reorder in AssetsStep with sortablejs on the list container: `onEnd` → splice assets → emit update:assets).

Behavior (verbatim copy):
- Heading "Upload logo <em>files</em>", description "Upload one or more logo source files. Each file becomes its own complete asset folder in the ZIP."
- Section label "LOGO ASSETS" + chip `{{ assets.length }} files` (`bg-primary/10 text-primary rounded-full font-mono text-xs px-2.5 h-6 flex items-center`).
- Dropzone: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors` (drag-over: `scale-[1.01] bg-primary/5 border-primary`, label "Drop to add files"); icon tile `w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center` with Upload icon `w-6 h-6 text-primary`; primary label "Drop logo files here" (`font-medium`), subtext "or click to browse" (`text-xs text-muted-foreground`), badge "SVG" (`text-[10px] font-mono bg-secondary rounded px-1.5 py-0.5`).
- File handling: on files selected/dropped — split `.svg` vs others; others → `skipped` ref = "Only clean SVG files without embedded raster images are supported. Skipped: {names}"; accepted → push `{ id: 'asset_' + Date.now() + Math.random().toString(36).slice(2,7), type: 'primary_logo', name: filename stem with -/_ → spaces, file }`; emit update:assets.
- Row: grip (GripVertical `w-4 h-4 text-muted-foreground cursor-grab`), icon tile `w-10 h-10 bg-muted rounded-lg`, filename `font-mono text-xs` (or "No file"), extension badge (SVG → `bg-emerald-500/10 text-emerald-600`, EPS → `bg-violet-500/10 text-violet-600`, AI → `bg-orange-500/10 text-orange-600`), size `(file.size/1024).toFixed(1) KB` (`text-xs text-muted-foreground font-mono`), AppSelect bound to type (options ASSET_TYPES) + when `type==='custom'` an Input placeholder "Custom name", remove button (X icon ghost).
- sortablejs: `onMounted` init `Sortable.create(listEl, { handle: '.grip', animation: 150, onEnd: ({oldIndex, newIndex}) => emit reorder })`; destroy in `onUnmounted`.

- [ ] **Step 1: Failing test** — `tests/assets.test.ts`

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement both components** per spec above. Expose `addFiles` via `defineExpose` for tests.

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: assets step with dropzone, typed rows, reorder and delete"`

---

### Task 11: Colors step (cards, CMYK editor, add form, toggles)

**Files:**
- Create: `app/components/steps/ColorsStep.vue`, `app/components/steps/ColorCard.vue`, `app/components/steps/CmykEditor.vue`
- Test: `tests/colors.test.ts`

**Interfaces:**
- Consumes: `BrandColor` (Task 8), color utils (Task 3), UI primitives.
- Produces:
  - `ColorsStep.vue` props `colors: BrandColor[]`, `bwVersion: boolean`, `originalVersion: boolean`, `jpgMargin: number`, `dominantSeed: string | null`; emits `update:colors`, `update:bwVersion`, `update:originalVersion`, `update:jpgMargin`.
  - `ColorCard.vue` props `color: BrandColor`, `index: number`; emits `update:color`, `duplicate`, `remove`.
  - `CmykEditor.vue` props `modelValue: { c: number; m: number; y: number; k: number }`, `manual: boolean`; emits `update:modelValue`, `update:manual`.

Behavior verbatim from spec §3.4 — headings "Brand <em>colors</em>", description; switches with exact labels + helper sentences; JPG margin labeled number input (min 0 max 50 step 1, suffix %, `w-20 h-9 text-right font-mono`); color card header `:style="{ backgroundColor: color.hex, color: textColorOn(color.hex) }"` `rounded-xl p-4 flex items-center justify-between`; name or italic "Unnamed"; HEX uppercase `font-mono text-xs`; buttons Duplicate (Copy icon)/expand (ChevronDown/ChevronUp)/Remove (X); strip HEX / `r, g, b` / `c, m, y, k` + "auto"/"manual" tag; expanded panel: "Color Name" Input placeholder "e.g. Brand Blue"; "HEX / Digital" row: `w-8 h-8 rounded-lg` swatch + mono Input (uppercase transform) + `<input type="color" title="Pick color">`; CmykEditor: label "CMYK Values", right "Manual input"/"Auto from HEX" + Switch, 4-col grid C/M/Y/K number inputs 0–100 disabled unless manual, hint text switches by mode; Usage switches `scale-75` with the four labels; "Add Brand Color" dashed button `w-full border-dashed border-border rounded-xl h-10 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2` (Plus icon) → inline form card `border-primary/30 bg-primary/5 rounded-xl p-4 space-y-4` with "Add Brand Color" title + X close; fields "Color name (optional)", "HEX / Digital" (placeholder `#3B82F6`), CmykEditor, "Add Color" (Check icon); default hex = `dominantSeed ?? '#3B82F6'`. New color id: `color_${Date.now()}`.
Hex editing: on valid hex (`isValidHex`) → update color.hex, recompute rgb display, and if `!cmykManual` recompute cmyk from rgbToCmyk.
Duplicate: deep-clone color, new id, push after index.

- [ ] **Step 1: Failing test** — `tests/colors.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorsStep from '~/components/steps/ColorsStep.vue'
import ColorCard from '~/components/steps/ColorCard.vue'
import CmykEditor from '~/components/steps/CmykEditor.vue'

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
})
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement the three components** per spec (use exact class hooks `.add-color-btn`, `.confirm-add`, `.btn-duplicate`, `.btn-remove` used by tests).

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: colors step with CMYK editor and add-color form"`

---

### Task 12: Generate step + pipeline wiring + 404 polish

**Files:**
- Create: `app/components/steps/GenerateStep.vue`, `app/components/steps/ProgressPanel.vue`, `app/components/steps/ZipTreePreview.vue`
- Modify: `app/pages/index.vue` (wire real generate, re-download, header re-download button area)
- Test: `tests/generate-step.test.ts`

**Interfaces:**
- Consumes: generator functions (Task 8), `downloadBlob` (Task 7), UI primitives, lucide icons.
- Produces: complete functional wizard.

`GenerateStep.vue` props: `cfg: GeneratorConfig`, `tree: ZipEntry[]`, `progress: Progress | null`, `isGenerating: boolean`, `done: boolean`; sections:
- Heading "Ready to <em>generate</em>" + description (spec §3.5).
- Stat cards grid `grid sm:grid-cols-3 gap-4`: each `bg-card rounded-xl border border-border/60 p-4` — label `text-xs tracking-widest text-muted-foreground` ("LOGO ASSETS"/"BRAND COLORS"/"EST. FILES"), value `text-2xl font-display font-medium` (`{{ cfg.assets.length }}` / `{{ cfg.colors.length }}` / `~{{ estimateFileCount(cfg) }}`), sub `text-xs text-muted-foreground` (`"{n} color versions each"` where n = buildVariants(cfg).length / `"{n} for recoloring"` where n = colors with useForLogo !== false / `"in ZIP archive"`).
- Panels row `grid sm:grid-cols-2 gap-4`: Digital/RGB panel `bg-blue-500/5 border border-blue-500/20 rounded-xl p-4` — title "Digital / RGB" (`text-sm font-medium text-blue-600`), chips SVG/PNG/JPG/WebP (`text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5`), note "SVG • PNG (4 sizes) • JPG (color × background) • WebP" (`text-xs text-muted-foreground`); Print/CMYK panel `bg-violet-500/5 border border-violet-500/20` — chip EPS, note "Vector EPS, CMYK (up to 4 variants)".
- "Color Versions per Asset" block: chips `rounded-full px-3 h-7 text-xs font-medium bg-secondary flex items-center` per variant label; empty state "Add brand colors to generate color versions" (`text-xs text-muted-foreground italic`).
- `<ZipTreePreview :tree="tree" />` inside "ZIP Folder Structure" card (`bg-card rounded-2xl border border-border/60 p-6 shadow-sm`) with "Preview" chip (`text-[10px] font-mono bg-secondary rounded px-1.5 py-0.5`).
- `<ProgressPanel v-if="progress" :progress="progress" :done="done" />`.

`ZipTreePreview.vue`: props `tree: ZipEntry[]`, `collapsed` internal ref (start expanded); toggle row "ZIP Folder Structure" + chevron; list `max-h-72 overflow-y-auto font-mono text-xs space-y-0.5`; row: indent `:style="{ paddingLeft: (e.depth * 16 + 4) + 'px' }"`; folder → Folder icon (`w-3.5 h-3.5 text-primary`) + name `text-foreground/80`; file → FileText icon `text-muted-foreground` + name `text-muted-foreground`.

`ProgressPanel.vue`: props `progress`, `done`; container `bg-card rounded-xl border p-4 space-y-3`; header row: if !done spinner `w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin` + title "Generating Asset Pack…" else green check circle `w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center` (Check icon) + title "Asset Pack Generated!"; message `text-xs text-muted-foreground font-mono` = progress.message; bar `h-1.5 rounded-full bg-muted overflow-hidden` inner `bg-primary h-full transition-all` width `{{ Math.round(progress.step / progress.total * 100) }}%`; percent text right-aligned `text-xs font-mono text-muted-foreground`; when done show box `bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700`: "Your ZIP archive is downloading. Check your downloads folder."

`index.vue` wiring:
- `onGenerate`: reset `errors`, `isGenerating = true`, `done = false`, `progress = { step: 0, total: 1, message: 'Starting…' }`; try `const { zip, fileName } = await generateAssetPack(configComputed, p => progress.value = p)`; `downloadBlob(zip, fileName)`; `done = true`; catch e → `errors.value = [e?.message ?? 'Generation failed. Please try again.']`; finally `isGenerating = false`.
- "Download Again" button and header "Re-download" button (index page top-right, outline `h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10`, Download icon) both call `onGenerate`.
- `tree` computed lazily: `buildTreePreview(configComputed)` — recomputes when inputs change.

- [ ] **Step 1: Failing test** — `tests/generate-step.test.ts`

```ts
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
```
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement the three components + wire index.vue** (replace Task 9's stub onGenerate).

- [ ] **Step 4: Run — PASS.** Then full verification:
  - `npx vitest run` — all green
  - `npm run build` — success
  - `npm run dev` → manual: enter "Acme", upload any SVG, add color, generate, verify ZIP downloads and structure matches `buildTreePreview` output. (jsdom can't run canvas pipeline; manual check only.)

- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: generate step with progress panel, zip preview, pipeline wiring"`

---

### Task 13: Final polish + full verification

**Files:**
- Modify: `app/pages/index.vue`, `app/layouts/default.vue` (if footer credit styling needed), any small gaps found

**Interfaces:** none new.

- [ ] **Step 1: Copy audit against spec §3** — walk every UI string in the spec and verify presence via grep:
```powershell
Select-String -Path app\components\**\*.vue, app\pages\*.vue -Pattern "e.g. Acme Corporation","Drop logo files here","Please upload at least one logo file","Add brand colors to generate color versions","Your ZIP archive is downloading","Created with care","Use for logo recoloring","Manual input","Auto from HEX"
```
Expected: every pattern found ≥ 1 match. Fix any missing string.

- [ ] **Step 2: Interaction audit** in dev: brand validation blocks empty continue; step pills navigate; dropzone rejects .png with skip message; color add/edit/duplicate/remove works; margin clamps; generate produces ZIP (check Downloads folder); "Download Again" and "Re-download" re-run; 404 page shows path.

- [ ] **Step 3: Full test suite + build**
```powershell
npx vitest run; npm run build
```
Expected: all tests pass, build succeeds.

- [ ] **Step 4: Update spec checklist / commit**
```powershell
git add -A; git commit -m "chore: final polish and copy audit for 1:1 parity"
```
