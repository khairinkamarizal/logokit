<template>
  <div class="flex items-center gap-3 bg-card border border-border/60 rounded-xl p-3">
    <button class="grip p-1 cursor-grab bg-transparent border-0" type="button" aria-label="Drag to reorder">
      <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab" />
    </button>
    <div class="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
      <FileIcon class="w-4 h-4 text-muted-foreground" />
    </div>
    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-medium truncate">{{ asset.name }}</span>
        <span :class="['text-[10px] font-mono rounded px-1.5 py-0.5', badgeClass]">{{ extension }}</span>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-mono text-xs truncate">{{ asset.file ? asset.file.name : 'No file' }}</span>
        <span v-if="asset.file" class="text-xs text-muted-foreground font-mono">{{ (asset.file.size / 1024).toFixed(1) + ' KB' }}</span>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <AppSelect
        :model-value="asset.type"
        :options="[...ASSET_TYPES]"
        placeholder="Asset type"
        @update:model-value="v => emit('update:type', v)"
      />
      <Input
        v-if="asset.type === 'custom'"
        :model-value="asset.customName"
        placeholder="Custom name"
        class="w-36"
        @update:model-value="v => emit('update:customName', v)"
      />
      <Button variant="ghost" size="icon" aria-label="Remove asset" @click="emit('remove')">
        <X class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GripVertical, X, File as FileIcon } from 'lucide-vue-next'
import AppSelect from '~/components/ui/AppSelect.vue'
import Button from '~/components/ui/Button.vue'
import Input from '~/components/ui/Input.vue'
import { ASSET_TYPES } from '~/utils/zip'
import type { LogoAsset } from '~/utils/generator'

const props = defineProps<{ asset: LogoAsset; index: number }>()
const emit = defineEmits<{ 'update:type': [string]; 'update:customName': [string]; remove: []; move: [] }>()

const extension = computed(() => {
  const name = props.asset.file?.name ?? ''
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : ''
})

const badgeClass = computed(() => {
  if (extension.value === 'SVG') return 'bg-emerald-500/10 text-emerald-600'
  if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(extension.value)) return 'bg-blue-500/10 text-blue-600'
  if (extension.value === 'EPS') return 'bg-violet-500/10 text-violet-600'
  if (extension.value === 'AI') return 'bg-orange-500/10 text-orange-600'
  return 'bg-secondary text-muted-foreground'
})
</script>
