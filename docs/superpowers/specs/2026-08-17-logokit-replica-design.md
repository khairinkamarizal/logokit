# LogoKit Replica — Design Spec

**Date:** 2026-08-17
**Goal:** Replicate https://logokit.base44.app/ 1:1 in functionality — a client-side logo asset-pack generator — as a Nuxt 4 app with SSR, in `C:\laragon\www\logokit`.

**Out of scope (per user decisions):**
- `/feedback` page (original posts to a proprietary base44 email integration) — skipped entirely; footer credit text remains, link removed
- base44 auth / login / access-restricted screens — app is open
- Dark mode (original ships dark: classes but the app is light-only in practice)

---

## 1. Reference: What the Original Does

LogoKit is a 4-step wizard ("Logo Asset Pack Generator"), 100% client-side (React 18 + Vite + Tailwind + shadcn/Radix + framer-motion + JSZip + FileSaver + react-beautiful-dnd + lucide icons). Users enter a brand name, upload SVG logo files, define brand colors (with CMYK), then generate a ZIP containing recolored SVG/PNG/JPG/WebP digital exports plus CMYK EPS print files.

### 1.1 Design tokens (extracted from production CSS)
- Background `hsl(40 24% 96%)` (warm paper), foreground `hsl(0 0% 12%)`
- Primary `hsl(20 100% 66%)` (orange), primary-foreground `hsl(0 0% 12%)`
- Card `white`, muted `hsl(40 16% 93%)`, muted-foreground `hsl(0 0% 42%)`, border `hsl(40 14% 89%)`
- Destructive `hsl(0 72% 51%)`, ring = primary, radius `.625rem`
- Fonts: Inter (heading/body/display), JetBrains Mono (mono)
- Background effect: two fixed dot-grid layers (`radial-gradient(circle, rgba(26,26,26,.06) 1px / 18px grid` base; `rgba(26,26,26,.22)` bright layer masked by `radial-gradient(ellipse 420px 360px at var(--mx) var(--my))` flashlight that follows the mouse with rAF-lerp easing 0.12)

### 1.2 Pages
| Route | Content |
|---|---|
| `/` | Generator wizard |
| `*` | 404 page |
| `/feedback` | **skipped in replica** |

## 2. Architecture (Nuxt 4, SSR)

```
logokit/
├── nuxt.config.ts          # @nuxtjs/tailwindcss, google-fonts (Inter, JetBrains Mono)
├── app/assets/css/main.css # tokens + dot-grid/flashlight CSS
├── app/app.vue             # NuxtPage; global fixed bg layers (mouse flashlight client-only)
├── app/layouts/default.vue # sticky header + footer
├── app/pages/
│   ├── index.vue           # GeneratorPage: wizard state + step orchestration
│   └── [...slug].vue       # 404
├── app/components/
│   ├── ui/                 # Button, Input, Textarea, Select, Switch, Label (reka-ui + shadcn classes)
│   ├── stepper/            # StepNav, SummarySidebar
│   └── steps/              # BrandStep, AssetsStep, ColorsStep, GenerateStep, ColorCard,
│   │                       # AssetRow, Dropzone, ProgressPanel, ZipTreePreview, ErrorBanner
└── app/utils/
    ├── svg.ts              # parse/ingest, image embedding, recolor, grayscale, placeholder
    ├── raster.ts           # canvas → PNG/JPG/WebP blobs
    ├── eps.ts              # SVG → PostScript (CMYK EPS) compiler
    ├── color.ts            # hex↔rgb↔cmyk, luminance, dominant color extraction
    ├── zip.ts              # JSZip packaging + FileSaver download, slug/naming rules
    └── generator.ts        # pipeline orchestrator (onProgress callback)
```

**Dependencies:** `jszip`, `file-saver`, `reka-ui`, `lucide-vue-next`, `sortablejs`, `@vueuse/core`; dev: `vitest`, `@nuxtjs/tailwindcss`, `@nuxtjs/google-fonts`.

**State:** plain refs in `index.vue` (wizard state: `step`, `brandName`, `logoAssets[]`, `brandColors[]`, `bwVersion=false`, `originalVersion=false`, `jpgMargin=10`, `isGenerating`, `done`, `progress{step,total,message}`, `errors[]`), passed via props/v-model. No store.

**SSR safety:** wizard renders statically; all File/canvas/JSZip code runs only in event handlers (client-only by nature). Mouse-flashlight effect guarded to run only on client (rAF + window listeners in onMounted).

## 3. UI Spec (1:1)

### 3.1 Global chrome
- Sticky `h-14` header: logo tile (`w-7 h-7 bg-primary rounded-lg`, Package icon), title "Logo Asset Pack" + italic subtitle "Generator"; step nav pills (Brand/Assets/Colors/Generate; current = filled, completed = check icon, future = disabled); "Re-download" outline button after first generation
- Main layout `grid lg:grid-cols-[1fr_300px]`, content `max-w-5xl`; right sticky Summary card (brand name or "—", logo file count, color count, swatches w/ `title="{name} — {hex}"`, numbered file list)
- Step cards: `rounded-2xl border p-6/8 shadow-sm`, headings `text-3xl/4xl` with one italic word
- Footer: "Created with care for brand designers by @iggykos" (no link)
- Step transitions: enter `opacity 0→1, y 12→0, .2s easeOut`; exit `y→-8`
- Buttons: "Back" outline / "Continue" + ArrowRight / final "Generate Asset Pack" (Sparkles, `h-11 px-8 font-semibold`), "Generating…" spinner state, then "Download Again" (Download icon)

### 3.2 Step 1 — Brand
Heading "Set up your *brand*", description "Enter your brand name — it will be used in all filenames and folder names." Input label "Brand Name", placeholder "e.g. Acme Corporation", helper "Used in all generated filenames and folder names." Validation: "Please enter a brand name."

### 3.3 Step 2 — Assets
Heading "Upload logo *files*", description "Upload one or more logo source files. Each file becomes its own complete asset folder in the ZIP."
- Dashed dropzone: "Drop logo files here" / "Drop to add files" (drag-over, scale 1.01, bg tint), subtext "or click to browse", badge "SVG", `accept=".svg" multiple`
- Skip message: "Only clean SVG files without embedded raster images are supported. Skipped: {names}"
- Asset rows (drag-reorder via sortablejs): grip handle, icon tile, filename (mono) or "No file", extension badge (SVG emerald / EPS violet / AI orange), size `(kb/1024).toFixed(1) KB`, type Select — Primary Logo, Horizontal Logo, Vertical Logo, Logo Mark, Monogram, Wordmark, App Icon Source, Custom (+ "Custom name" input when Custom), delete button
- New upload defaults: type `primary_logo`, name = filename stem with `-`/`_` → spaces
- Validation: "Please upload at least one logo file."

### 3.4 Step 3 — Colors
Heading "Brand *colors*", description "Add your brand colors. The app will generate logo versions in each color and use them as background options."
- Switches: "Black & White logo version" — "Generates black and white exports in SVG, PNG, JPG and WebP." (off); "Original (multicolor) logo" — "Exports the uploaded logo with its original colors across SVG, PNG, JPG, WebP and CMYK print formats." (off)
- "JPG export margin" number input, 0–50 step 1, default 10, helper "Uniform padding around the logo on every JPG export, as a percentage of the logo's width. 0% fills the canvas edge-to-edge; 10% leaves breathing room on all sides."
- Color cards: header bg = hex with luminance-based black/white text (`0.299r+0.587g+0.114b > .5`), name or italic "Unnamed", HEX uppercase; Duplicate / expand / Remove buttons; strip shows HEX, `r, g, b`, `c, m, y, k` (+ "auto"/"manual"); expanded panel: "Color Name" ("e.g. Brand Blue"), "HEX / Digital" (swatch + mono input + native picker "Pick color"), CMYK editor ("Manual input"/"Auto from HEX" switch; C/M/Y/K 0–100 inputs disabled unless manual; hints "Values are calculated automatically from HEX. Toggle the switch to enter your own." / "Manual CMYK values are saved-as and are not recalculated when HEX changes."), Usage switches (scale-75): "Use for logo recoloring", "Use as background color", "Digital only", "Print only" — only recolor toggle filters exports (matches original; others stored)
- "Add Brand Color" dashed button → inline form: name (optional), HEX (placeholder `#3B82F6`) + picker, CMYK editor, "Add Color" — HEX auto-seeded from first logo's dominant color
- Color model: `{id:"color_XXXXXXXXX", name, hex, rgb, cmyk{c,m,y,k}, cmykSource:"manual"|"generated", cmykManual}`; invalid hex rejected (`#?[0-9A-Fa-f]{6}`)

### 3.5 Step 4 — Generate
Heading "Ready to *generate*", description "Review your export summary and folder structure, then generate your complete asset pack."
- Stat cards: "LOGO ASSETS" (count, "{n} color versions each"), "BRAND COLORS" (count, "{n} for recoloring"), "EST. FILES" ("~{n}", "in ZIP archive")
- Panels: "Digital / RGB" (blue, chips SVG/PNG/JPG/WebP, note "SVG • PNG (4 sizes) • JPG (color × background) • WebP"); "Print / CMYK" (violet, chip EPS, note "Vector EPS, CMYK (up to 4 variants)")
- "Color Versions per Asset" chips: Original (if enabled), color names / "Brand Color N", Black, White (if B&W); empty state "Add brand colors to generate color versions"
- "ZIP Folder Structure" card, "Preview" chip, collapsible tree (`max-h-72 overflow`, indent `depth*16+4px`, Folder/FolderOpen/FileText/Chevron icons) rooted at `{CapitalizedBrand}_Logo_Asset_Pack.zip`
- ProgressPanel: spinner → green check; "Generating Asset Pack…" → "Asset Pack Generated!"; sub-message per phase; percent = step/total; bar `h-1.5 bg-muted` + primary fill; success box "Your ZIP archive is downloading. Check your downloads folder."; initial message "Initializing…", final "Done!"

### 3.6 404
"404" (`text-7xl font-light text-slate-300`), "Page Not Found", `The page "{path}" could not be found in this application.`, "Go Home" button. (No admin note.)

## 4. Generation Pipeline

### 4.1 Ingest
1. Accept `.svg` only → `readAsText` → DOMParser
2. `<image href>` resolution: non-`data:` hrefs fetched (CORS), converted to data-URLs, embedded. Failure → hard error: `"{name}" links to external image(s) that could not be embedded ("{urls}"). Embed all images in your SVG before uploading — in Illustrator, place images with "Link" unchecked, then save as SVG.`
3. Dimensions: viewBox → width/height attrs → 800×600 fallback; raster height = `size * h / w`

### 4.2 Color variants
- Export list = Original (if toggle) + brand colors with `useForLogo !== false` + Black (#000000, CMYK 0,0,0,100) + White (#ffffff, CMYK 0,0,0,0) if B&W. Grayscale computed (root style `filter: grayscale(1)`) but never exported.
- Recolor = DOM walk: set `fill` (skip `none`/`transparent`/`url()`), gradient `stop-color`, regex-replace `fill:` in inline styles, set root `svg fill`
- CMYK: manual brand-color values win; else standard RGB→CMYK formula

### 4.3 Raster exports (canvas, all via Blob→objectURL→Image, revoked after draw)
- **PNG** transparent, widths 512/1024/2048/4096
- **JPG** 1024 wide, quality .92, bg fill; backgrounds = white-bg, black-bg + one per brand color (`{slug}-bg`); skip variant on same-hex background; margin: `p = clamp(0,50,margin)/100`, `canvas = logo/(1+2p) + 2·p·logo`, logo drawn centered
- **WebP** transparent, 512/1024/2048/4096, quality .92; if `image/webp` unsupported (canvas toBlob check) skip silently

### 4.4 EPS compiler (ported 1:1)
Header: `%!PS-Adobe-3.0 EPSF-3.0`, `%%BoundingBox: 0 0 {w} {h}`, `%%Title: {brand} {AssetType} CMYK {variant}`, `%%Creator: Logo Asset Pack Generator`, `%%LanguageLevel: 2`, `%%EndComments`, `%%Page: 1 1`, `gsave`, `{c m y k} setcmykcolor` (single override only), `0 {h} translate 1 -1 scale` (y-flip), compiled ops, `grestore`, `%%EOF`.
Compiler: skip `defs, clippath, lineargradient, radialgradient, pattern, filter, style, metadata, title, desc, symbol, use, image`; recurse `<g>` w/ gsave/grestore; `transform` matrix/translate/scale/rotate → concat/translate/scale/rotate; path `d` parser M/L/H/V/C/S/Q/T/A/Z (relative+absolute) → PS ops + fill; rect/circle/ellipse/line/polygon/polyline → path ops + fill; text → Helvetica/Times-Roman/Courier selectfont + start/middle/end anchor + show; per-element fill → setcmykcolor (RGB→CMYK); numbers rounded to 3 decimals; ellipses emit arcs without fill.

### 4.5 ZIP (JSZip DEFLATE 6, FileSaver saveAs)
```
{CapitalizedBrand}_Logo_Asset_Pack.zip
└── {NN}_{CustomName|TypeLabel}/          NN=01,02…; dup same-type → -2, -3
    ├── 01_RGB_Digital/
    │   ├── 01_SVG/       {brand}-{asset}-rgb-{variant}.svg
    │   ├── 02_PNG_Transparent/ {brand}-{asset}-rgb-{variant}-transparent-{size}.png
    │   ├── 03_JPG/       {brand}-{asset}-rgb-{variant}-{white|black|colorslug}-bg.jpg
    │   └── 04_WEBP/      {brand}-{asset}-rgb-{variant}-transparent-{size}.webp
    └── 02_CMYK_Print_EPS/ {brand}-{asset}-cmyk-{variant}.eps   (first 4 variants only)
```
Type labels: `Primary_Logo, Horizontal_Logo, Vertical_Logo, Logo_Mark, Monogram, Wordmark, App_Icon_Source, Custom`. `{brand}` = lowercase slug (non-alphanum → `-`). Variants: `original`, `black`, `white`, brand-color slugs.

### 4.6 Progress & errors
- Messages: `"{AssetType}: generating PNG exports"` / `…JPG exports` / `…WebP exports` / `…print exports`, then "Generating ZIP archive", "Done!"; "Initializing…" at start. Total steps = `assets × 4 + 2`.
- `await` yields (setTimeout 0) between phases for UI responsiveness
- Pipeline failure → banner with thrown message or "Generation failed. Please try again."
- Dominant color seed: scan first logo's fill/stop-color/style values; fallback = downsample embedded raster to 64px + quantization; filter near-black/near-white/gray

## 5. Testing
- **Vitest** unit tests: `color.ts` (hex↔rgb↔cmyk round-trips, luminance, dominant extraction from SVG string), `svg.ts` (recolor skips none/url fills, gradient stops, grayscale filter, viewBox parsing fallbacks), `eps.ts` (simple SVG → EPS snapshot: header, bbox, y-flip, fill ops), `zip.ts` (slug rules, asset folder naming/dedup, file naming), `generator.ts` (variant list construction, JPG background matrix incl. same-hex skip, est. file count)
- Manual E2E: upload sample SVG, generate, inspect ZIP structure vs original output

## 6. Deliverables
1. Nuxt 4 app in `C:\laragon\www\logokit` (served via Laragon)
2. All unit tests passing (`npm run test`)
3. `npm run build` succeeds
