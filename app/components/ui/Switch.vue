<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="[
      'inline-flex items-center h-6 w-10 rounded-full transition-colors',
      modelValue ? 'bg-primary' : 'bg-muted border border-border',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'block w-[18px] h-[18px] rounded-full bg-white shadow transition-transform',
        modelValue ? 'translate-x-[21px]' : 'translate-x-[3px]',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
