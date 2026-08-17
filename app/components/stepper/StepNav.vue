<template>
  <nav aria-label="Steps" class="flex items-center gap-1.5">
    <template v-for="(label, i) in labels" :key="label">
      <button
        type="button"
        :class="pillClass(i)"
        :disabled="!allowed(i)"
        @click="allowed(i) && $emit('go', i)"
      >
        <Check v-if="i < step || (done && i <= step)" class="w-3.5 h-3.5" />
        <span>{{ label }}</span>
      </button>
      <ChevronRight v-if="i < labels.length - 1" class="w-4 h-4 text-muted-foreground" />
    </template>
  </nav>
</template>

<script setup lang="ts">
import { Check, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{ step: number; done: boolean; canGoTo?: (n: number) => boolean }>()
defineEmits<{ go: [number] }>()

const labels = ['Brand', 'Assets', 'Colors', 'Generate']

const allowed = (i: number) => (props.canGoTo ? props.canGoTo(i) : i <= props.step)

const pillClass = (i: number) => {
  if (i === props.step && !props.done)
    return 'bg-primary text-primary-foreground rounded-[3px] px-3 h-8 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5'
  if (i < props.step || props.done)
    return 'text-foreground hover:bg-secondary rounded-[3px] px-3 h-8 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors'
  return 'text-muted-foreground cursor-not-allowed rounded-[3px] px-3 h-8 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5'
}
</script>
