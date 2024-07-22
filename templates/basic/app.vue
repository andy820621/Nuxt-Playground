<script setup lang="ts">
const { isHydrating } = useNuxtApp()

// if (process.client) {
if (isHydrating) {
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