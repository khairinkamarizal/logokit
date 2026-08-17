<template>
  <div class="crop-card bg-card rounded-[2px] border border-border p-6 sm:p-10 space-y-8">
    <div class="space-y-3">
      <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight leading-[1.05]">Set up your <em class="italic font-medium">brand</em></h2>
      <p class="text-sm text-muted-foreground max-w-md">Enter your brand name — it will be used in all filenames and folder names.</p>
    </div>
    <div class="space-y-4">
      <div class="eyebrow">Brand</div>
      <div class="space-y-2">
        <Label for="brand-name">Brand Name</Label>
        <Input id="brand-name" v-model="model" placeholder="e.g. Acme Corporation" />
        <p class="text-xs text-muted-foreground">Used in all generated filenames and folder names.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Input from '~/components/ui/Input.vue'
import Label from '~/components/ui/Label.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})
</script>
