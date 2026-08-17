<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <Label>CMYK Values</Label>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">{{ manual ? 'Manual input' : 'Auto from HEX' }}</span>
        <Switch :model-value="manual" @update:model-value="v => emit('update:manual', v)" />
      </div>
    </div>
    <div class="grid grid-cols-4 gap-2">
      <div v-for="ch in channels" :key="ch.key" class="space-y-1">
        <span class="text-xs font-medium text-muted-foreground">{{ ch.key.toUpperCase() }}</span>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          :value="modelValue[ch.key]"
          :disabled="!manual"
          class="h-9 w-full text-right font-mono rounded-xl border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50 disabled:cursor-not-allowed"
          @input="onInput(ch.key, $event)"
        />
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      {{ manual
        ? 'Manual CMYK values are saved-as and are not recalculated when HEX changes.'
        : 'Values are calculated automatically from HEX. Toggle the switch to enter your own.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import Label from '~/components/ui/Label.vue'
import Switch from '~/components/ui/Switch.vue'

const props = defineProps<{
  modelValue: { c: number; m: number; y: number; k: number }
  manual: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [{ c: number; m: number; y: number; k: number }]
  'update:manual': [boolean]
}>()

const channels = [
  { key: 'c' as const },
  { key: 'm' as const },
  { key: 'y' as const },
  { key: 'k' as const }
]

function onInput(key: 'c' | 'm' | 'y' | 'k', e: Event) {
  const raw = (e.target as HTMLInputElement).valueAsNumber
  const v = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0
  emit('update:modelValue', { ...props.modelValue, [key]: v })
}
</script>
