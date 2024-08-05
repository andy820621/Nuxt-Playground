<script setup lang="ts">
const router = useRouter()
const play = usePlaygroundStore()

const templatesMap = Object.fromEntries(
  Object.entries(import.meta.glob('~/content/**/.template/index.ts'))
    .map(([key, loader]) => [
      key
        .replace(/^\/content/, '') // 將路徑開頭的 '/content' 移除
        .replace(/\/\.template\/index\.ts$/, '') // 將路徑結尾的 '/.template/index.ts' 移除
        .replace(/\/\d+\./g, '/') || '/', // 將路徑中的數字部分替換為 '/'，如果結果為空則設置為 '/'
      loader,
    ]),
)

if (import.meta.dev) {
  onMounted(() => {
    // eslint-disable-next-line no-console
    console.log('nowww templates', Object.keys(templatesMap))
  })
}

async function mount(path: string) {
  // path = path.replace(/\/$/, '') // 去除路徑結尾的 '/'
  if (templatesMap[path])
    play.mountGuide(await templatesMap[path]().then((m: any) => m.meta))
  else
    play.mountGuide() // unmount previous guide
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
  </main>
</template>
