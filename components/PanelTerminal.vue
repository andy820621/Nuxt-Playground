<template>
  <div ref="root" w-full h-full></div>
</template>

<script setup lang="ts">
import '@xterm/xterm/css/xterm.css'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit';

const props = defineProps<{
  stream?: ReadableStream
}>()

const root = ref<HTMLDivElement>()
const terminal = new Terminal({
  customGlyphs: true,
  lineHeight: 0.9,
})
const fitAddon = new FitAddon()

terminal.loadAddon(fitAddon)

watch(
  () => props.stream,
  (newS) => {
    if (!newS) return
    const reader = newS.getReader()

    function read() {
      reader.read().then(({ done, value }) => {
        if (value) terminal.write(value)
        if (!done) read()
      })
    }

    read()
  },
  { flush: 'sync', immediate: true }
)

useResizeObserver(root, useDebounceFn(() => fitAddon.fit(), 200))

onMounted(() => {
  terminal.open(root.value!)
  terminal.write('\n')
  fitAddon.fit()
})
</script>

<style scoped></style>
