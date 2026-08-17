<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue ?? false"
    :class="[
      'flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      modelValue ? 'bg-primary' : 'bg-border',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      aria-hidden="true"
      :class="[
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-150',
        modelValue ? 'translate-x-5' : 'translate-x-0',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
