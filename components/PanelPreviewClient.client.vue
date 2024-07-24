<script setup lang="ts">
const ui = useUiState()
const play = usePlaygroundStore()
const iframe = ref<HTMLIFrameElement>()
const colorMode = useColorMode()

function syncColorMode() {
  iframe.value?.contentWindow?.postMessage({ type: 'color-mode', mode: colorMode.value }, '*')
}

watch(colorMode, syncColorMode, { flush: 'sync' })

onMounted(() => {
  mountPlayground(play, colorMode.value)
})
</script>

<template>
  <iframe
    v-if="play.previewUrl"
    ref="iframe"
    :src="play.previewUrl"
    :class="{ 'pointer-events-none': ui.isPanelDragging }"
    h-full
    w-full bg-transparent allow="geolocation; microphone; camera; payment; autoplay; serial; cross-origin-isolated"
    @load="syncColorMode"
  />
</template>