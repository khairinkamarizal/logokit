<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center gap-2 text-sm font-medium"
      @click="collapsed = !collapsed"
    >
      <FolderOpen class="w-4 h-4 text-primary" />
      <ChevronDown class="ml-auto w-4 h-4 text-muted-foreground transition-transform" :class="collapsed ? '' : 'rotate-180'" />
    </button>
    <div v-if="!collapsed" class="mt-3 max-h-72 overflow-y-auto font-mono text-xs space-y-0.5">
      <div v-for="(e, i) in tree" :key="i" class="flex items-center gap-1.5" :style="{ paddingLeft: (e.depth * 16 + 4) + 'px' }">
        <Folder v-if="e.type === 'folder'" class="w-3.5 h-3.5 text-primary shrink-0" />
        <FileText v-else class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span :class="e.type === 'folder' ? 'text-foreground/80' : 'text-muted-foreground'">{{ e.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Folder, FolderOpen, FileText, ChevronDown } from 'lucide-vue-next'
import type { ZipEntry } from '~/utils/generator'

defineProps<{ tree: ZipEntry[] }>()

const collapsed = ref(false)
</script>
