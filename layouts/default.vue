<script setup lang="ts">

</script>

<template>
  <div class="w-screen h-screen h-100dvh">
    <main
      class="w-screen h-screen h-100dvh of-hidden"
      grid="~ rows-[max-content_1fr]"
    >
      <TheNav />
      <slot />
    </main>
  </div>
</template>

<style scoped>

</style>
