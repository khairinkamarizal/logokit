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
