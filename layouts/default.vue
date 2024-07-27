<script setup lang="ts">

</script>

<template>
  <div h-100dvh h-screen w-screen>
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
