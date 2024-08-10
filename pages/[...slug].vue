<script setup lang="ts">
const router = useRouter()
const guide = useGuideStore()

const templatesMap = Object.fromEntries(
  Object.entries(import.meta.glob('~/content/**/.template/index.ts'))
    .map(([key, loader]) => [
      key
        .replace(/^\/content/, '') // 將路徑開頭的 '/content' 移除
        .replace(/\/\.template\/index\.ts$/, '') // 將路徑結尾的 '/.template/index.ts' 移除
        .replace(/\/\d+\./g, '/'), // 將路徑中的數字部分替換為 '/'，如果結果為空則設置為 '/'
      loader,
    ]),
)

async function mount(path: string) {
  path = path.replace(/\/$/, '') // remove trailing slash
  await guide.mount(
    await templatesMap[path]?.().then((m: any) => m.meta),
    false,
  )
}

router.afterEach(async (to) => {
  mount(to.path)
})

onMounted(() => {
  mount(router.currentRoute.value.path)
})
</script>

<template>
  <main
    h-100dvh h-screen w-screen of-hidden
    grid="~ rows-[max-content_1fr]"
  >
    <TheNav />
    <MainPlayground />
    <CommandPalette />
  </main>
</template>
