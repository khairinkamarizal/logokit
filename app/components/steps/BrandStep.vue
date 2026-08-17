<template>
  <div class="bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-5">
    <div class="space-y-2">
      <h2 class="text-3xl sm:text-4xl font-display font-medium tracking-tight">Set up your <em class="italic">brand</em></h2>
      <p class="text-muted-foreground">Enter your brand name — it will be used in all filenames and folder names.</p>
    </div>
    <div class="space-y-4">
      <div class="text-xs font-medium tracking-widest text-muted-foreground">BRAND</div>
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
