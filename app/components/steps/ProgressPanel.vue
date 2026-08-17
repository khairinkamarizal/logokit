<template>
  <div class="bg-card rounded-xl border p-4 space-y-3">
    <div class="flex items-center gap-3">
      <div v-if="!done" class="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      <div v-else class="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
        <Check class="w-4 h-4" />
      </div>
      <p class="text-sm font-medium">{{ done ? 'Asset Pack Generated!' : 'Generating Asset Pack…' }}</p>
    </div>
    <p class="text-xs text-muted-foreground font-mono">{{ progress.message }}</p>
    <div class="flex items-center gap-3">
      <div class="h-1.5 rounded-full bg-muted overflow-hidden flex-1">
        <div class="bg-primary h-full transition-all" :style="{ width: percent + '%' }" />
      </div>
      <span class="text-xs font-mono text-muted-foreground text-right">{{ percent }}%</span>
    </div>
    <div v-if="done" class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700">
      Your ZIP archive is downloading. Check your downloads folder.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import type { Progress } from '~/utils/generator'

const props = defineProps<{
  progress: Progress
  done: boolean
}>()

const percent = computed(() => Math.round((props.progress.step / (props.progress.total || 1)) * 100))
</script>
