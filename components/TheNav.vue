<script setup lang="ts">

</script>

<template>
  <nav px6 py4 text-lg border="b base" flex="~ gap-2 items-center">
    <div i-logos-nuxt-icon text-3xl />

    <span text-xl>Learn.nuxt</span>

    <div flex-auto />

    <NuxtLink
      p1 rounded
      duration-200
      hover="bg-active"
      href="https://github.com/andy820621/Nuxt-Playground" target="_blank"
    >
      <div i-carbon-logo-github text-2xl />
    </NuxtLink>
  </nav>
</template>

<style scoped>

</style>
