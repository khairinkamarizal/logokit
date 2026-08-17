<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <img src="~/assets/img/logo.svg" alt="LogoKit" class="w-[18px] h-[18px] invert" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-display font-medium tracking-tight leading-none">LogoKit</span>
            <span class="text-[10px] font-display italic text-muted-foreground">by Khairinkamarizal</span>
          </div>
        </NuxtLink>
        <a
          href="https://khair.ink"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[3px] border border-foreground/30 text-foreground hover:bg-secondary transition-colors"
        >
          khair.ink <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-border/50 bg-background/60 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
        LogoKit — crafted with care by <a href="https://khair.ink" target="_blank" rel="noopener" class="text-foreground font-medium hover:underline">Khairinkamarizal</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
</script>
