<script setup lang="ts">

</script>

<template>
  <nav px6 py3 text-lg border="b base" flex="~ gap-2 items-center">
    <NuxtLink to="/" flex items-center gap-2 title="Nuxt Playground">
      <NuxtLogo class="h-1.3em mt--1.9"  />
      <span text-xl font-bold>Playground</span>
    </NuxtLink>

    <div flex-auto />

    <ColorSchemeToggle />
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
