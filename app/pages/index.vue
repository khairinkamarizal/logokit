<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div class="max-w-5xl w-full space-y-6">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <StepNav :step="step" :can-go-to="canGoTo" :done="done" @go="n => step = n" />
          <Button v-if="done" variant="outline" @click="onGenerate">
            <Download class="w-4 h-4" /> Re-download
          </Button>
        </div>
        <ErrorBanner :errors="errors" />
        <Transition name="step" mode="out-in">
          <component :is="currentStepComponent" :key="step" v-bind="currentStepProps" v-on="currentStepEvents" />
        </Transition>
        <div class="flex items-center justify-between gap-4">
          <Button variant="outline" :disabled="step === 0" @click="step--">Back</Button>
          <Button v-if="step < 3" @click="onContinue">
            Continue <ArrowRight class="w-4 h-4" />
          </Button>
          <Button v-else class="h-11 px-8 text-sm font-semibold" :disabled="isGenerating" @click="onGenerate">
            <template v-if="isGenerating">
              <Loader2 class="w-4 h-4 animate-spin" /> Generating…
            </template>
            <template v-else-if="done">
              <Download class="w-4 h-4" /> Download Again
            </template>
            <template v-else>
              <Sparkles class="w-4 h-4" /> Generate Asset Pack
            </template>
          </Button>
        </div>
      </div>
      <SummarySidebar :brand-name="brandName" :assets="logoAssets" :colors="brandColors" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { ArrowRight, Sparkles, Download, Loader2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import StepNav from '~/components/stepper/StepNav.vue'
import SummarySidebar from '~/components/stepper/SummarySidebar.vue'
import BrandStep from '~/components/steps/BrandStep.vue'
import AssetsStep from '~/components/steps/AssetsStep.vue'
import ErrorBanner from '~/components/ErrorBanner.vue'
import type { LogoAsset, BrandColor, Progress } from '~/utils/generator'

const step = ref(0)
const brandName = ref('')
const logoAssets = ref<LogoAsset[]>([])
const brandColors = ref<BrandColor[]>([])
const bwVersion = ref(false)
const originalVersion = ref(false)
const jpgMargin = ref(10)
const errors = ref<string[]>([])
const isGenerating = ref(false)
const done = ref(false)
const progress = ref<Progress | null>(null)

const canGoTo = (n: number) => n <= step.value

const placeholders = {
  colors: defineComponent({ render: () => h('div', 'ColorsStep placeholder') }),
  generate: defineComponent({ render: () => h('div', 'GenerateStep placeholder') })
}

const currentStepComponent = computed(() => {
  if (step.value === 0) return BrandStep
  if (step.value === 1) return AssetsStep
  if (step.value === 2) return placeholders.colors
  return placeholders.generate
})

const currentStepProps = computed(() => {
  if (step.value === 0) return { modelValue: brandName.value }
  if (step.value === 1) return { assets: logoAssets.value }
  return {}
})

const currentStepEvents = computed(() => {
  if (step.value === 0) return { 'update:modelValue': (v: string) => (brandName.value = v) }
  if (step.value === 1) return { 'update:assets': (v: LogoAsset[]) => (logoAssets.value = v) }
  return {}
})

function validateCurrent() {
  errors.value = []
  if (step.value === 0 && !brandName.value.trim()) {
    errors.value.push('Please enter a brand name.')
  }
  if (step.value === 1 && !logoAssets.value.some(a => a.file)) {
    errors.value.push('Please upload at least one logo file.')
  }
}

function onContinue() {
  validateCurrent()
  if (errors.value.length) return
  step.value++
}

// Stub — Task 12 wires the real generation pipeline.
function onGenerate() {
  done.value = false
  isGenerating.value = true
  progress.value = null
  isGenerating.value = false
  done.value = true
}
</script>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: all 0.2s ease-out;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
