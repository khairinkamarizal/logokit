<template>
  <div class="bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-5">
    <div class="space-y-2">
      <h2 class="text-3xl sm:text-4xl font-display font-medium tracking-tight">Upload logo <em class="italic">files</em></h2>
      <p class="text-muted-foreground">Upload one or more logo source files. Each file becomes its own complete asset folder in the ZIP.</p>
    </div>
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-xs font-medium tracking-widest text-muted-foreground">LOGO ASSETS</div>
        <span class="bg-primary/10 text-primary rounded-full font-mono text-xs px-2.5 h-6 flex items-center">{{ assets.length }} files</span>
      </div>

      <div
        :class="['border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors', dragging ? 'scale-[1.01] bg-primary/5 border-primary' : 'border-border']"
        @click="openPicker"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
          <Upload class="w-6 h-6 text-primary" />
        </div>
        <div class="font-medium mt-3">{{ dragging ? 'Drop to add files' : 'Drop logo files here' }}</div>
        <div class="text-xs text-muted-foreground mt-1">or click to browse</div>
        <span class="inline-block mt-3 text-[10px] font-mono bg-secondary rounded px-1.5 py-0.5">SVG</span>
        <input ref="fileInput" type="file" multiple accept=".svg" class="hidden" @click.stop @change="onChange" />
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

function addFiles(files: File[]) {
  const accepted = files.filter(f => f.name.toLowerCase().endsWith('.svg'))
  const rejected = files.filter(f => !f.name.toLowerCase().endsWith('.svg'))
  skipped.value = rejected.length
    ? `Only clean SVG files without embedded raster images are supported. Skipped: ${rejected.map(f => f.name).join(', ')}`
    : ''
  if (!accepted.length) return
  const next = [...props.assets]
  for (const file of accepted) {
    next.push({
      id: 'asset_' + Date.now() + Math.random().toString(36).slice(2, 7),
      type: 'primary_logo',
      name: file.name.replace(/\.svg$/i, '').replace(/[-_]+/g, ' '),
      file
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
