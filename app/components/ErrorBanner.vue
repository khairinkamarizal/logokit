<template>
  <Transition name="banner">
    <div
      v-if="errors.length"
      class="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3"
    >
      <AlertTriangle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      <ul class="space-y-1 text-sm text-destructive">
        <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{ errors: string[] }>()
</script>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.2s ease-out;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
