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

const stream = new WritableStream({
  write(chunk) {
    terminal.write(chunk)
  }
})

watch(() => props.stream, (newS) => {
  newS?.pipeTo(stream)
}, { immediate: true })

onMounted(() => {
  terminal.open(root.value!)
})
</script>

<style scoped>

</style>