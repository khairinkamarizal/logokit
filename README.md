# LogoKit

LogoKit turns logo source files into a professionally organized asset pack. Add a brand name, upload the artwork, define the brand colors, and download a ZIP containing digital and print-ready variants.

Created by [Khairinkamarizal](https://khair.ink).

## Features

- Accepts SVG, PNG, JPG, and WebP logo files
- Organizes multiple logo types, including primary, horizontal, vertical, mark, monogram, wordmark, app icon, 3D, effect, dark, light, and custom assets
- Reorders assets with drag and drop before generation
- Creates brand-color, black, white, and original SVG variants
- Recolors SVG fills, strokes, gradients, inline styles, stylesheet classes, and `currentColor`
- Supports automatic or manually entered CMYK values
- Generates transparent PNG and WebP files at multiple sizes
- Generates JPG files on white, black, and brand-color backgrounds with configurable margins
- Excludes solid-color JPG combinations below a 3:1 contrast ratio
- Generates CMYK EPS files for vector artwork
- Previews the estimated file count and ZIP folder structure
- Processes files and builds the ZIP in the browser

## Export behavior

### SVG sources

Each enabled color variant can produce:

- RGB SVG
- Transparent PNG at 512, 1024, 2048, and 4096 pixels
- JPG at 1024 pixels on eligible backgrounds
- Transparent WebP at 512, 1024, 2048, and 4096 pixels
- CMYK EPS for up to four variants

JPG logo/background pairs are only included when a solid-color variant reaches a minimum 3:1 contrast ratio. Original multicolor artwork is preserved and exported on every configured background.

### Raster sources

PNG, JPG, and WebP uploads are treated as rendered artwork. LogoKit preserves the original file and creates optimized PNG, JPG, and WebP copies without recoloring or vector/CMYK conversion. Upscaled sizes are not generated when the source image is smaller.

## SVG compatibility

LogoKit preserves `none`, `transparent`, and `url(...)` paint values while recoloring visible fills, strokes, and gradient stops. SVG files containing linked external images should embed those images before upload; otherwise the remote files must be accessible from the browser through CORS.

## Getting started

Requirements:

- Node.js 22.19+, 24.11+, or 26+
- npm

Install the dependencies:

```bash
npm install
```

Start the development server at `http://localhost:3000`:

```bash
npm run dev
```

## Commands

```bash
npm run dev       # Start the development server
npm test          # Run the Vitest test suite
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run generate  # Generate a static deployment
```

## Tech stack

- Nuxt 4 and Vue 3
- TypeScript
- Tailwind CSS 4
- Vitest
- JSZip and FileSaver
- SortableJS

## Project structure

```text
app/
|-- components/       Wizard steps and reusable UI
|-- pages/            Application routes
|-- utils/            SVG, raster, EPS, ZIP, color, and generation logic
`-- assets/           Styles and application artwork
tests/                Unit and component tests
public/               Public static files
```
