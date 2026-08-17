<template>
  <aside class="hidden lg:block sticky top-20">
    <div class="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
      <h3 class="text-sm font-display font-medium">Summary</h3>
      <div class="space-y-2 text-sm">
        <div class="flex items-center justify-between gap-4">
          <span class="text-muted-foreground">Brand</span>
          <span class="font-medium truncate">{{ brandName || '—' }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-muted-foreground">Logo Files</span>
          <span class="font-medium">{{ assets.length }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-muted-foreground">Brand Colors</span>
          <span class="text-primary font-mono">{{ colors.length }}</span>
        </div>
      </div>
      <div class="h-px bg-border/60" />
      <div v-if="colors.length" class="flex gap-2 flex-wrap">
        <div
          v-for="c in colors"
          :key="c.id"
          class="w-6 h-6 rounded border border-border/60"
          :style="{ backgroundColor: c.hex }"
          :title="c.name + ' — ' + c.hex"
        />
      </div>
      <div class="h-px bg-border/60" />
      <ol v-if="assets.length" class="space-y-1.5">
        <li v-for="(a, i) in assets" :key="a.id" class="flex items-baseline gap-2 text-xs">
          <span class="font-mono text-muted-foreground">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="truncate">{{ a.name || 'Untitled' }}</span>
        </li>
      </ol>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { LogoAsset, BrandColor } from '~/utils/generator'

defineProps<{
  brandName: string
  assets: LogoAsset[]
  colors: BrandColor[]
}>()
</script>
