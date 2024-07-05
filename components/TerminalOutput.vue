<template>
  <div ref="root">

  </div>
</template>

<script setup lang="ts">
import { Terminal } from '@xterm/xterm'

const props =defineProps<{
  stream?: ReadableStream
}>()

const root = ref<HTMLDivElement>()
const terminal = new Terminal();

watch(() => props.stream, (newS) => {
  if (!newS) return
  const reader = newS.getReader()

  function read() {
      reader.read().then(({ done, value }) => {
        terminal.write(value)
        if (!done)
          read()
      })
    }

  read()
}, { flush: 'sync', immediate: true })

onMounted(() => {
  terminal.open(root.value!)
})
</script>

<style scoped>

</style>