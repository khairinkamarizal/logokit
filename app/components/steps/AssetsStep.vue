<template>
  <div class="crop-card bg-card rounded-[2px] border border-border p-6 sm:p-10 space-y-8">
    <div class="space-y-3">
      <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight leading-[1.05]">Upload logo <em class="italic font-medium">files</em></h2>
      <p class="text-sm text-muted-foreground max-w-md">Upload vector logo sources or rendered logo artwork. Each file becomes its own complete asset folder in the ZIP.</p>
    </div>
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="eyebrow flex-1">Logo Assets</div>
        <span class="bg-secondary text-foreground rounded-[3px] font-mono text-xs px-2.5 h-6 flex items-center">{{ assets.length }} files</span>
      </div>

      <div
        :class="['border-2 border-dashed rounded-[2px] p-8 text-center cursor-pointer hover:border-foreground/40 transition-colors', dragging ? 'scale-[1.01] bg-secondary border-foreground' : 'border-border']"
        @click="openPicker"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="w-12 h-12 rounded-[4px] bg-secondary mx-auto flex items-center justify-center">
          <Upload class="w-6 h-6 text-foreground" />
        </div>
        <div class="font-display font-medium mt-3">{{ dragging ? 'Drop to add files' : 'Drop logo files here' }}</div>
        <div class="text-xs text-muted-foreground mt-1">or click to browse</div>
        <div class="flex justify-center gap-1.5 mt-3">
          <span v-for="format in ['SVG', 'PNG', 'JPG', 'WEBP']" :key="format" class="text-[10px] font-mono bg-secondary rounded-[2px] px-1.5 py-0.5 border border-border">{{ format }}</span>
        </div>
        <input ref="fileInput" type="file" multiple accept=".svg,.png,.jpg,.jpeg,.webp" class="hidden" @click.stop @change="onChange" />
      </div>

      <p v-if="skipped" class="text-xs text-destructive">{{ skipped }}</p>

      <div v-if="assets.length" ref="listEl" class="space-y-3">
        <AssetRow
          v-for="(asset, i) in assets"
          :key="asset.id"
          :asset="asset"
          :index="i"
          @update:type="v => updateAsset(i, { type: v })"
          @update:customName="v => updateAsset(i, { customName: v })"
          @remove="removeAsset(i)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Upload } from 'lucide-vue-next'
import Sortable from 'sortablejs'
import AssetRow from '~/components/steps/AssetRow.vue'
import { readImageDimensions } from '~/utils/raster'
import { sourceKindFromFileName } from '~/utils/generator'
import type { LogoAsset } from '~/utils/generator'

const props = defineProps<{ assets: LogoAsset[] }>()
const emit = defineEmits<{ 'update:assets': [LogoAsset[]]; error: [string | null] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const dragging = ref(false)
const skipped = ref('')

let sortable: Sortable | null = null

function openPicker() {
  fileInput.value?.click()
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  addFiles(Array.from(e.dataTransfer?.files ?? []))
}

async function addFiles(files: File[]) {
  const accepted = files.filter(f => sourceKindFromFileName(f.name) !== null)
  const rejected = files.filter(f => sourceKindFromFileName(f.name) === null)
  skipped.value = rejected.length
    ? `Supported formats are SVG, PNG, JPG and WebP. Skipped: ${rejected.map(f => f.name).join(', ')}`
    : ''
  if (!accepted.length) return
  const next = [...props.assets]
  for (const file of accepted) {
    const sourceKind = sourceKindFromFileName(file.name)!
    let dimensions: { width?: number; height?: number } = {}
    if (sourceKind === 'raster') {
      try { dimensions = await readImageDimensions(file) } catch { /* generation will show a detailed error */ }
    }
    next.push({
      id: 'asset_' + Date.now() + Math.random().toString(36).slice(2, 7),
      type: sourceKind === 'raster' ? 'logo_3d' : 'primary_logo',
      sourceKind,
      name: file.name.replace(/\.(svg|png|jpe?g|webp)$/i, '').replace(/[-_]+/g, ' '),
      file,
      ...dimensions
    })
  }
  emit('update:assets', next)
}

function updateAsset(index: number, patch: Partial<LogoAsset>) {
  const next = [...props.assets]
  next[index] = { ...next[index], ...patch }
  emit('update:assets', next)
}

function removeAsset(index: number) {
  const next = [...props.assets]
  next.splice(index, 1)
  emit('update:assets', next)
}

const stopWatch = watch(listEl, el => {
  sortable?.destroy()
  sortable = null
  if (!el || typeof window === 'undefined') return
  try {
    sortable = Sortable.create(el, {
      handle: '.grip',
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const next = [...props.assets]
        const [moved] = next.splice(oldIndex, 1)
        next.splice(newIndex, 0, moved)
        emit('update:assets', next)
      }
    })
  } catch {
    sortable = null
  }
}, { immediate: true })

onUnmounted(() => {
  stopWatch()
  sortable?.destroy()
  sortable = null
})

defineExpose({ addFiles })
</script>
