<script setup lang="ts">

</script>

<template>
  <div w-screen h-screen h-100dvh>
    <main
      h-100dvh h-screen w-screen of-hidden
      grid="~ rows-[max-content_1fr]"
    >
      <TheNav />
      <slot />
    </main>
  </div>
</template>

<style scoped>

</style>
