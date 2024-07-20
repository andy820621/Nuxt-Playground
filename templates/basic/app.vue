<script setup lang="ts">
const { isHydrating } = useNuxtApp()

// if (process.client) {
if (isHydrating) {
  console.log('Client Init')
  window.addEventListener('message', (e) => {
    console.log('got message', e)
  })

  const route = useRoute()
  watch(
    () => route.fullPath,
    (newFullPath) => {
      window.parent.postMessage({
        type: 'update:path',
        path: newFullPath,
      }, '*')
    },
    { immediate: true },
  )
}
</script>

<template>
  <NuxtPage />
</template>