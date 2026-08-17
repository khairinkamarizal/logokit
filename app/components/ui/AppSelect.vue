<template>
  <select
    :value="modelValue"
    class="h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  options: { value: string; label: string }[]
  placeholder?: string
}>()

defineEmits<{ 'update:modelValue': [string] }>()
</script>
