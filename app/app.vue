<template>
  <div ref="rootRef" class="min-h-screen">
    <div class="fixed inset-0 -z-20 bg-dots" aria-hidden="true" />
    <div class="fixed inset-0 -z-10 bg-dots-bright" aria-hidden="true" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const rootRef = ref<HTMLElement | null>(null)
let raf = 0
let tx = -9999, ty = -9999, cx = -9999, cy = -9999

onMounted(() => {
  const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
  const tick = () => {
    if (Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5) {
      cx += (tx - cx) * .12
      cy += (ty - cy) * .12
      rootRef.value?.style.setProperty('--mx', `${cx}px`)
      rootRef.value?.style.setProperty('--my', `${cy}px`)
    }
    raf = requestAnimationFrame(tick)
  }
  window.addEventListener('mousemove', onMove, { passive: true })
  raf = requestAnimationFrame(tick)
  onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove) })
})
</script>
