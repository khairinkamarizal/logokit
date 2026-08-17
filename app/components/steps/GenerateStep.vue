<template>
  <div>
    <div class="crop-card bg-card rounded-[2px] border border-border p-6 sm:p-10 space-y-6">
      <div class="space-y-3">
        <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight leading-[1.05]">Ready to <em class="italic font-medium">generate</em></h2>
        <p class="text-sm text-muted-foreground max-w-md">Review your export summary and folder structure, then generate your complete asset pack.</p>
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <div class="bg-card rounded-[3px] border border-border p-4">
          <p class="font-mono text-[10px] tracking-[.18em] uppercase text-muted-foreground">Logo Assets</p>
          <p class="text-3xl font-display font-semibold mt-1">{{ cfg.assets.length }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">{{ variants.length }} color versions each</p>
        </div>
        <div class="bg-card rounded-[3px] border border-border p-4">
          <p class="font-mono text-[10px] tracking-[.18em] uppercase text-muted-foreground">Brand Colors</p>
          <p class="text-3xl font-display font-semibold mt-1">{{ cfg.colors.length }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">{{ recolorCount }} for recoloring</p>
        </div>
        <div class="bg-card rounded-[3px] border border-border p-4">
          <p class="font-mono text-[10px] tracking-[.18em] uppercase text-muted-foreground">Est. Files</p>
          <p class="text-3xl font-display font-semibold mt-1">~{{ estimateFileCount(cfg) }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">in ZIP archive</p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="bg-blue-500/5 border border-blue-500/20 rounded-[3px] p-4 space-y-2">
          <p class="text-sm font-medium text-blue-600">Digital / RGB</p>
          <div class="flex gap-1.5 flex-wrap">
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded-[2px] px-1.5 py-0.5">SVG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded-[2px] px-1.5 py-0.5">PNG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded-[2px] px-1.5 py-0.5">JPG</span>
            <span class="text-[10px] font-mono bg-blue-500/10 text-blue-600 rounded-[2px] px-1.5 py-0.5">WebP</span>
          </div>
          <p class="text-xs text-muted-foreground">SVG • PNG (4 sizes) • JPG (color × background) • WebP</p>
        </div>
        <div class="bg-violet-500/5 border border-violet-500/20 rounded-[3px] p-4 space-y-2">
          <p class="text-sm font-medium text-violet-600">Print / CMYK</p>
          <div class="flex gap-1.5 flex-wrap">
            <span class="text-[10px] font-mono bg-violet-500/10 text-violet-600 rounded-[2px] px-1.5 py-0.5">EPS</span>
          </div>
          <p class="text-xs text-muted-foreground">Vector EPS, CMYK (up to 4 variants)</p>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">Color Versions per Asset</p>
        <div v-if="variants.length" class="flex flex-wrap gap-2">
          <span v-for="v in variants" :key="v.slug" class="rounded-[3px] px-3 h-7 text-xs font-medium bg-secondary border border-border flex items-center">
            {{ v.label }}
          </span>
        </div>
        <p v-else class="text-xs text-muted-foreground italic">Add brand colors to generate color versions</p>
      </div>
    </div>

    <div class="bg-card rounded-[2px] border border-border p-6 mt-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-display font-medium">ZIP Folder Structure</h3>
        <span class="text-[10px] font-mono bg-secondary rounded-[2px] px-1.5 py-0.5 border border-border">Preview</span>
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
