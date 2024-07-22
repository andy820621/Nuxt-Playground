<script setup lang="ts">

</script>

<template>
  <nav px4 py3 text-lg border="b base" flex="~ gap-1 items-center">
    <NuxtLink to="/" title="Nuxt Playground">
      <NuxtPlaygroundLogo h-2em />
    </NuxtLink>

    <div flex-auto />

    <ColorSchemeToggle />
    <NuxtLink
      rounded p2
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
