<script setup lang="ts">
const { x, y } = useMouse()
const color = useColorMode()

function toggleDark() {
  color.value = color.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="grid grid-cols-[1fr_2fr] h-full">
    <div class="p4 border-r border-base">
      Content
      <div class="text-red">
        Hello World {{ x }} {{ y }}
      </div>
      <button @click="toggleDark">
        {{ color.value }}
      </button>
    </div>

    <div class="p4">
      Playground
    </div>
  </div>
</template>

<style scoped></style>
