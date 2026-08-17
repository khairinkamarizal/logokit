<template>
  <input
    :id="id"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="h-11 w-full rounded-xl border border-input bg-card px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring/40"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    type?: string
    id?: string
    disabled?: boolean
  }>(),
  { modelValue: '', placeholder: '', type: 'text', id: undefined, disabled: false }
)

defineEmits<{ 'update:modelValue': [string] }>()
</script>
