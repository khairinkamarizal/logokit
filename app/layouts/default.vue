<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Package class="w-4 h-4 text-primary-foreground" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-display font-medium tracking-tight leading-none">Logo Asset Pack</span>
            <span class="text-[10px] font-display italic text-muted-foreground">Generator</span>
          </div>
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-border/50 bg-background/60 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
        Created with care for brand designers by <span class="text-foreground font-medium">@iggykos</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Package } from 'lucide-vue-next'
</script>
