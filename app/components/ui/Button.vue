<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    disabled?: boolean
    type?: string
  }>(),
  { variant: 'default', size: 'default', disabled: false, type: 'button' }
)

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'border border-border bg-card hover:bg-secondary',
    ghost: 'hover:bg-secondary',
    destructive: 'bg-destructive text-white hover:opacity-90',
  }[props.variant],
  {
    default: 'h-10 px-5 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  }[props.size],
])
</script>
