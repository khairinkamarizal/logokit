<template>
  <div class="rounded-xl border border-border/60 overflow-hidden bg-card">
    <div
      class="rounded-xl p-4 flex items-center justify-between"
      :style="{ backgroundColor: color.hex, color: textColorOn(color.hex) }"
    >
      <div class="min-w-0">
        <div v-if="color.name" class="font-medium truncate">{{ color.name }}</div>
        <div v-else class="italic">Unnamed</div>
        <div class="font-mono text-xs uppercase">{{ color.hex }}</div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          class="btn-duplicate inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/10 transition-colors"
          aria-label="Duplicate color"
          @click="emit('duplicate')"
        >
          <Copy class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/10 transition-colors"
          :aria-label="expanded ? 'Collapse' : 'Expand'"
          @click="expanded = !expanded"
        >
          <component :is="expanded ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="btn-remove inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/10 transition-colors"
          aria-label="Remove color"
          @click="emit('remove')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="px-4 py-2 flex items-center gap-3 flex-wrap font-mono text-xs text-muted-foreground">
      <span class="uppercase">{{ color.hex }}</span>
      <span>{{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }}</span>
      <span>{{ color.cmyk.c }}, {{ color.cmyk.m }}, {{ color.cmyk.y }}, {{ color.cmyk.k }}</span>
      <span :class="['rounded px-1.5 py-0.5 text-[10px]', color.cmykManual ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600']">
        {{ color.cmykManual ? 'manual' : 'auto' }}
      </span>
    </div>

    <div v-if="expanded" class="p-4 pt-2 space-y-4 border-t border-border/60">
      <div class="space-y-2">
        <Label>Color Name</Label>
        <Input :model-value="color.name" placeholder="e.g. Brand Blue" @update:model-value="v => patch({ name: v })" />
      </div>

      <div class="space-y-2">
        <Label>HEX / Digital</Label>
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg border border-border shrink-0" :style="{ backgroundColor: color.hex }" />
          <Input
            :model-value="color.hex"
            placeholder="#3B82F6"
            class="font-mono uppercase"
            @update:model-value="v => onHex(v)"
          />
          <input
            type="color"
            title="Pick color"
            class="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
            :value="pickerValue"
            @input="onPicker"
          />
        </div>
      </div>

      <CmykEditor
        :model-value="color.cmyk"
        :manual="color.cmykManual"
        @update:model-value="v => patch({ cmyk: v })"
        @update:manual="v => patch({ cmykManual: v })"
      />

      <div class="space-y-3">
        <div class="flex items-center gap-3 scale-75 origin-left">
          <Switch :model-value="color.useForLogo" @update:model-value="v => patch({ useForLogo: v })" />
          <Label>Use for logo recoloring</Label>
        </div>
        <div class="flex items-center gap-3 scale-75 origin-left">
          <Switch :model-value="color.useAsBackground" @update:model-value="v => patch({ useAsBackground: v })" />
          <Label>Use as background color</Label>
        </div>
        <div class="flex items-center gap-3 scale-75 origin-left">
          <Switch :model-value="color.digitalOnly" @update:model-value="v => patch({ digitalOnly: v })" />
          <Label>Digital only</Label>
        </div>
        <div class="flex items-center gap-3 scale-75 origin-left">
          <Switch :model-value="color.printOnly" @update:model-value="v => patch({ printOnly: v })" />
          <Label>Print only</Label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, ChevronDown, ChevronUp, X } from 'lucide-vue-next'
import Input from '~/components/ui/Input.vue'
import Label from '~/components/ui/Label.vue'
import Switch from '~/components/ui/Switch.vue'
import CmykEditor from '~/components/steps/CmykEditor.vue'
import { hexToRgb, rgbToCmyk, isValidHex, textColorOn } from '~/utils/color'
import type { BrandColor } from '~/utils/generator'

const props = defineProps<{ color: BrandColor; index: number }>()
const emit = defineEmits<{ 'update:color': [BrandColor]; duplicate: []; remove: [] }>()

const expanded = ref(false)

const rgb = computed(() => hexToRgb(props.color.hex))
const pickerValue = computed(() => (isValidHex(props.color.hex) ? props.color.hex : '#3b82f6'))

function patch(p: Partial<BrandColor>) {
  emit('update:color', { ...props.color, ...p })
}

function normalizedHex(s: string): string {
  const t = s.trim()
  return t.startsWith('#') ? t : `#${t}`
}

function onHex(v: string) {
  if (!isValidHex(v)) return
  const hex = normalizedHex(v)
  const next: Partial<BrandColor> = { hex }
  if (!props.color.cmykManual) {
    const { r, g, b } = hexToRgb(hex)
    next.cmyk = rgbToCmyk(r, g, b)
  }
  emit('update:color', { ...props.color, ...next })
}

function onPicker(e: Event) {
  onHex((e.target as HTMLInputElement).value)
}
</script>
