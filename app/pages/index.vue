<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div class="max-w-5xl w-full space-y-6">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <StepNav :step="step" :can-go-to="canGoTo" :done="done" @go="n => step = n" />
          <button
            v-if="done"
            type="button"
            class="inline-flex items-center justify-center h-8 px-3 text-xs gap-1.5 rounded-[3px] border border-foreground/30 text-foreground hover:bg-secondary transition-colors"
            @click="onGenerate"
          >
            <Download class="w-3.5 h-3.5" /> Re-download
          </button>
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
import { ref, computed, watch } from 'vue'
import { ArrowRight, Sparkles, Download, Loader2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import StepNav from '~/components/stepper/StepNav.vue'
import SummarySidebar from '~/components/stepper/SummarySidebar.vue'
import BrandStep from '~/components/steps/BrandStep.vue'
import AssetsStep from '~/components/steps/AssetsStep.vue'
import ColorsStep from '~/components/steps/ColorsStep.vue'
import GenerateStep from '~/components/steps/GenerateStep.vue'
import ErrorBanner from '~/components/ErrorBanner.vue'
import { dominantColorFromSvg } from '~/utils/color'
import { generateAssetPack, buildTreePreview, assetSourceKind } from '~/utils/generator'
import { downloadBlob } from '~/utils/zip'
import type { LogoAsset, BrandColor, Progress, GeneratorConfig } from '~/utils/generator'

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

const firstSvgText = ref<string | null>(null)

watch(logoAssets, assets => {
  const first = assets.find(a => a.file && assetSourceKind(a) === 'svg')
  if (!first?.file || typeof window === 'undefined' || typeof FileReader === 'undefined') {
    if (!first?.file) firstSvgText.value = null
    return
  }
  const reader = new FileReader()
  reader.onload = () => { firstSvgText.value = typeof reader.result === 'string' ? reader.result : null }
  reader.onerror = () => { firstSvgText.value = null }
  reader.readAsText(first.file)
}, { deep: true })

const dominantSeed = computed(() => (firstSvgText.value ? dominantColorFromSvg(firstSvgText.value) : null))

const configComputed = computed<GeneratorConfig>(() => ({
  brandName: brandName.value,
  assets: logoAssets.value,
  colors: brandColors.value,
  bwVersion: bwVersion.value,
  originalVersion: originalVersion.value,
  jpgMargin: jpgMargin.value
}))

const tree = computed(() => buildTreePreview(configComputed.value))

const currentStepComponent = computed(() => {
  if (step.value === 0) return BrandStep
  if (step.value === 1) return AssetsStep
  if (step.value === 2) return ColorsStep
  return GenerateStep
})

const currentStepProps = computed(() => {
  if (step.value === 0) return { modelValue: brandName.value }
  if (step.value === 1) return { assets: logoAssets.value }
  if (step.value === 2) return {
    colors: brandColors.value,
    bwVersion: bwVersion.value,
    originalVersion: originalVersion.value,
    jpgMargin: jpgMargin.value,
    dominantSeed: dominantSeed.value
  }
  return { cfg: configComputed.value, tree: tree.value, progress: progress.value, isGenerating: isGenerating.value, done: done.value }
})

const currentStepEvents = computed(() => {
  if (step.value === 0) return { 'update:modelValue': (v: string) => (brandName.value = v) }
  if (step.value === 1) return { 'update:assets': (v: LogoAsset[]) => (logoAssets.value = v) }
  if (step.value === 2) return {
    'update:colors': (v: BrandColor[]) => (brandColors.value = v),
    'update:bwVersion': (v: boolean) => (bwVersion.value = v),
    'update:originalVersion': (v: boolean) => (originalVersion.value = v),
    'update:jpgMargin': (v: number) => (jpgMargin.value = v)
  }
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

async function onGenerate() {
  if (!import.meta.client) return
  errors.value = []
  isGenerating.value = true
  done.value = false
  progress.value = { step: 0, total: 1, message: 'Starting…' }
  try {
    const { zip, fileName } = await generateAssetPack(configComputed.value, p => { progress.value = p })
    downloadBlob(zip, fileName)
    done.value = true
  } catch (e: any) {
    errors.value = [e?.message ?? 'Generation failed. Please try again.']
  } finally {
    isGenerating.value = false
  }
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
