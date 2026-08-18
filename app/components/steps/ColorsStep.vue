<template>
  <div class="crop-card bg-card rounded-[2px] border border-border p-6 sm:p-10 space-y-8">
    <div class="space-y-3">
      <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight leading-[1.05]">Brand <em class="italic font-medium">colors</em></h2>
      <p class="text-sm text-muted-foreground max-w-md">Add your brand colors. The app will generate logo versions in each color and use them as background options.</p>
    </div>

    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex items-start gap-3 rounded-[3px] border border-border p-4">
          <Switch :model-value="bwVersion" class="mt-0.5" @update:model-value="v => emit('update:bwVersion', v)" />
          <div class="space-y-1">
            <Label>Black &amp; White logo version</Label>
            <p class="text-xs text-muted-foreground">Generates black and white exports from SVG sources in SVG, PNG, JPG and WebP.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 rounded-[3px] border border-border p-4">
          <Switch :model-value="originalVersion" class="mt-0.5" @update:model-value="v => emit('update:originalVersion', v)" />
          <div class="space-y-1">
            <Label>Original (multicolor) logo</Label>
            <p class="text-xs text-muted-foreground">Exports SVG sources in their original colors across SVG, PNG, JPG, WebP and CMYK print formats. Rendered artwork is always preserved.</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <Label for="jpg-margin">JPG export margin</Label>
        <input
          id="jpg-margin"
          type="number"
          min="0"
          max="50"
          step="1"
          :value="jpgMargin"
          class="w-20 h-9 text-right font-mono rounded-[3px] border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          @input="onMargin"
        />
        <span class="text-sm text-muted-foreground">%</span>
      </div>
      <p class="text-xs text-muted-foreground -mt-2">Uniform padding around the logo on every JPG export, as a percentage of the logo's width. 0% fills the canvas edge-to-edge; 10% leaves breathing room on all sides.</p>

      <div v-if="colors.length" class="space-y-3">
        <ColorCard
          v-for="(color, i) in colors"
          :key="color.id"
          :color="color"
          :index="i"
          @update:color="v => updateColor(i, v)"
          @duplicate="duplicateColor(i)"
          @remove="removeColor(i)"
        />
      </div>

      <button
        v-if="!showAdd"
        type="button"
        class="add-color-btn w-full border-dashed border-border rounded-xl h-10 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2 transition-colors"
        @click="openAdd"
      >
        <Plus class="w-4 h-4" /> Add Brand Color
      </button>

      <div v-else class="border-primary/30 bg-primary/5 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between">
          <Label>Add Brand Color</Label>
          <Button variant="ghost" size="icon" aria-label="Close" @click="closeAdd">
            <X class="w-4 h-4" />
          </Button>
        </div>
        <div class="space-y-2">
          <Label for="new-color-name">Color name (optional)</Label>
          <Input id="new-color-name" v-model="newName" placeholder="e.g. Brand Blue" />
        </div>
        <div class="space-y-2">
          <Label>HEX / Digital</Label>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg border border-border shrink-0" :style="{ backgroundColor: newHex }" />
            <Input
              v-model="newHex"
              placeholder="#3B82F6"
              class="font-mono uppercase"
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
        <CmykEditor :model-value="newCmyk" :manual="newManual" @update:model-value="v => (newCmyk = v)" @update:manual="v => (newManual = v)" />
        <Button class="confirm-add w-full" @click="confirmAdd">
          <Check class="w-4 h-4" /> Add Color
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRaw, watch } from 'vue'
import { Plus, X, Check } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import Input from '~/components/ui/Input.vue'
import Label from '~/components/ui/Label.vue'
import Switch from '~/components/ui/Switch.vue'
import ColorCard from '~/components/steps/ColorCard.vue'
import CmykEditor from '~/components/steps/CmykEditor.vue'
import { isValidHex, hexToRgb, rgbToCmyk } from '~/utils/color'
import type { BrandColor } from '~/utils/generator'

const props = defineProps<{
  colors: BrandColor[]
  bwVersion: boolean
  originalVersion: boolean
  jpgMargin: number
  dominantSeed: string | null
}>()

const emit = defineEmits<{
  'update:colors': [BrandColor[]]
  'update:bwVersion': [boolean]
  'update:originalVersion': [boolean]
  'update:jpgMargin': [number]
}>()

const showAdd = ref(false)
const newName = ref('')
const newHex = ref('#3B82F6')
const newManual = ref(false)
const newCmyk = ref({ c: 0, m: 0, y: 0, k: 0 })

function normalizedHex(s: string): string {
  const t = s.trim()
  return t.startsWith('#') ? t : `#${t}`
}

const pickerValue = computed(() => (isValidHex(newHex.value) ? normalizedHex(newHex.value) : '#3b82f6'))

watch(newHex, v => {
  if (newManual.value || !isValidHex(v)) return
  const { r, g, b } = hexToRgb(normalizedHex(v))
  newCmyk.value = rgbToCmyk(r, g, b)
})

function onPicker(e: Event) {
  newHex.value = (e.target as HTMLInputElement).value
}

function onMargin(e: Event) {
  const raw = (e.target as HTMLInputElement).valueAsNumber
  const v = Number.isFinite(raw) ? Math.min(50, Math.max(0, Math.round(raw))) : 0
  emit('update:jpgMargin', v)
}
function openAdd() {
  const seed = props.dominantSeed ?? '#3B82F6'
  newHex.value = seed
  newName.value = ''
  newManual.value = false
  const { r, g, b } = hexToRgb(seed)
  newCmyk.value = rgbToCmyk(r, g, b)
  showAdd.value = true
}

function closeAdd() {
  showAdd.value = false
}

function confirmAdd() {
  if (!isValidHex(newHex.value)) return
  const hex = normalizedHex(newHex.value)
  const rgb = hexToRgb(hex)
  const cmyk = newManual.value ? newCmyk.value : rgbToCmyk(rgb.r, rgb.g, rgb.b)
  const color: BrandColor = {
    id: `color_${Date.now()}`,
    name: newName.value.trim(),
    hex,
    cmyk: { c: cmyk.c, m: cmyk.m, y: cmyk.y, k: cmyk.k },
    cmykManual: newManual.value,
    useForLogo: true,
    useAsBackground: true,
    digitalOnly: false,
    printOnly: false
  }
  emit('update:colors', [...props.colors, color])
  showAdd.value = false
}

function updateColor(index: number, color: BrandColor) {
  const next = [...props.colors]
  next[index] = color
  emit('update:colors', next)
}

function duplicateColor(index: number) {
  const source = props.colors[index]
  const copy: BrandColor = {
    ...structuredClone(toRaw(source)),
    id: `color_${Date.now()}`,
    cmyk: { ...source.cmyk }
  }
  const next = [...props.colors]
  next.splice(index + 1, 0, copy)
  emit('update:colors', next)
}

function removeColor(index: number) {
  const next = props.colors.filter((_, i) => i !== index)
  emit('update:colors', next)
}
</script>
