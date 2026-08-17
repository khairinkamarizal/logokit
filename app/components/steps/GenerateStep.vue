<template>
  <div>
    <div class="bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-6">
      <div class="space-y-2">
        <h2 class="text-3xl sm:text-4xl font-display font-medium tracking-tight">Ready to <em class="italic">generate</em></h2>
        <p class="text-muted-foreground">Review your export summary and folder structure, then generate your complete asset pack.</p>
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <div class="bg-card rounded-xl border border-border/60 p-4">
          <p class="text-xs tracking-widest text-muted-foreground">LOGO ASSETS</p>
          <p class="text-2xl font-display font-medium">{{ cfg.assets.length }}</p>
          <p class="text-xs text-muted-foreground">{{ variants.length }} color versions each</p>
        </div>
        <div class="bg-card rounded-xl border border-border/60 p-4">
          <p class="text-xs tracking-widest text-muted-foreground">BRAND COLORS</p>
          <p class="text-2xl font-display font-medium">{{ cfg.colors.length }}</p>
          <p class="text-xs text-muted-foreground">{{ recolorCount }} for recoloring</p>
        </div>
        <div class="bg-card rounded-xl border border-border/60 p-4">
          <p class="text-xs tracking-widest text-muted-foreground">EST. FILES</p>
          <p class="text-2xl font-display font-medium">~{{ estimateFileCount(cfg) }}</p>
          <p class="text-xs text-muted-foreground">in ZIP archive</p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
          <p class="text-sm font-medium text-blue-600">Digital / RGB</p>
          <div class="flex gap-1.5 flex-wrap">
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5">SVG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5">PNG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5">JPG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded px-1.5 py-0.5">WebP</span>
          </div>
          <p class="text-xs text-muted-foreground">SVG • PNG (4 sizes) • JPG (color × background) • WebP</p>
        </div>
        <div class="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-2">
          <p class="text-sm font-medium text-violet-600">Print / CMYK</p>
          <div class="flex gap-1.5 flex-wrap">
            <span class="text-[10px] font-mono bg-violet-500/10 text-violet-600 rounded px-1.5 py-0.5">EPS</span>
          </div>
          <p class="text-xs text-muted-foreground">Vector EPS, CMYK (up to 4 variants)</p>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">Color Versions per Asset</p>
        <div v-if="variants.length" class="flex flex-wrap gap-2">
          <span v-for="v in variants" :key="v.slug" class="rounded-full px-3 h-7 text-xs font-medium bg-secondary flex items-center">
            {{ v.label }}
          </span>
        </div>
        <p v-else class="text-xs text-muted-foreground italic">Add brand colors to generate color versions</p>
      </div>
    </div>

    <div class="bg-card rounded-2xl border border-border/60 p-6 shadow-sm mt-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-display font-medium">ZIP Folder Structure</h3>
        <span class="text-[10px] font-mono bg-secondary rounded px-1.5 py-0.5">Preview</span>
      </div>
      <ZipTreePreview :tree="tree" />
    </div>

    <ProgressPanel v-if="progress" :progress="progress" :done="done" class="mt-6" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ZipTreePreview from './ZipTreePreview.vue'
import ProgressPanel from './ProgressPanel.vue'
import { buildVariants, estimateFileCount } from '~/utils/generator'
import type { GeneratorConfig, Progress, ZipEntry } from '~/utils/generator'

const props = defineProps<{
  cfg: GeneratorConfig
  tree: ZipEntry[]
  progress: Progress | null
  isGenerating: boolean
  done: boolean
}>()

const variants = computed(() => buildVariants(props.cfg))
const recolorCount = computed(() => props.cfg.colors.filter(c => c.useForLogo !== false).length)
</script>
