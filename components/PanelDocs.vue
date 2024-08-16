<script setup lang="ts">
import type { NavItem } from '@nuxt/content'

const {
  navigation,
  page,
  next,
  prev,
} = useContent()
interface BreadcrumbItem {
  title: string
  path?: string
}
function findNavItemFromPath(path: string, items = navigation.value) {
  // 使用 find 方法在 items 中尋找路徑匹配的項目
  const item = items.find(i => i._path === path)
  if (item)
    return item as NavItem

  // 如果找不到，則分割路徑並嘗試尋找其父路徑
  const parts = path.split('/').filter(Boolean)
  for (let i = parts.length - 1; i > 0; i--) {
    const parentPath = `/${parts.slice(0, i).join('/')}`
    const parent = items.find(i => i._path === parentPath)
    if (parent)
      return findNavItemFromPath(path, parent.children || [])
  }
}
const contentPath = computed(() => page.value?._path) // 當前頁面的路徑
const breadcrumbs = computed(() => {
  const parts = contentPath.value?.split('/').filter(Boolean) || [] // 按斜線分割路徑成一個陣列，並過濾掉空字串
  const breadcrumbs = parts
    .map((part, idx): BreadcrumbItem => {
      const path = `/${parts.slice(0, idx + 1).join('/')}` // 根據 idx 生成路徑
      const item = findNavItemFromPath(path) // 根據路徑查找項目
      return {
        title: item?.title || 'Not found',
        path: item ? path : undefined,
      }
    })

  // 如果麵包屑中沒有根路徑，則在開頭添加一個根路徑項目
  if (!breadcrumbs.find(i => i.path === '/')) {
    breadcrumbs.unshift({
      title: 'Guide',
      path: '/',
    })
  }
  return breadcrumbs
})
const ui = useUiState()

const sourceUrl = computed(() => page.value?._file
  ? `https://github.com/andy820621/Nuxt-Playground/edit/main/content/${page.value._file}`
  : undefined)
</script>

<template>
  <div grid="~ rows-[min-content_1fr_min-content]" relative h-full>
    <div flex="~ gap-2 items-center" border="b base dashed" bg-faded px4 py2>
      <div i-ph-book-duotone />
      <!-- 渲染麵包屑導航 -->
      <template v-for="bc, idx of breadcrumbs" :key="bc.path">
        <div v-if="idx !== 0" i-ph-caret-right mx--1 text-sm op50 />   <!-- 非第一個項目，添加一個導航分隔符 -->
        <NuxtLink :to="bc.path" text-sm hover="underline underline-dashed text-primary">
          {{ bc.title }}
        </NuxtLink>
      </template>

      <button
        h-full flex-auto
        @click="ui.isContentDropdownShown = !ui.isContentDropdownShown"
      />
      <button
        i-ph-caret-down-duotone text-sm op50 transition duration-400
        :class="ui.isContentDropdownShown ? 'rotate-180' : ''"
        @click="ui.isContentDropdownShown = !ui.isContentDropdownShown"
      />
    </div>

    <!-- 教學內容區域 -->
    <div relative h-full of-hidden>
      <article class="max-w-none prose" h-full of-auto p6>
        <ContentDoc />

        <!-- 上一節教學和下一節教學導航卡片 -->
        <div mt8 py2 grid="~ cols-[1fr_1fr] gap-4">
          <div>
            <ContentNavCard
              v-if="prev"
              :to="prev._path"
              :title="prev.title"
              :description="prev.description"
              subheader="Previous section"
              icon="i-ph-arrow-left"
            />
          </div>
          <div>
            <ContentNavCard
              v-if="next"
              :to="next._path"
              :title="next.title"
              :description="next.description"
              subheader="Next section"
              icon="i-ph-arrow-right"
              items-end text-right
            />
          </div>
        </div>
      </article>
      <!-- Navigration Dropdown -->
      <div
        v-if="ui.isContentDropdownShown"
        flex="~ col"
        border="b base"
        absolute left-0 right-0 top-0 max-h-60vh py2
        backdrop-blur-10 bg-base important-bg-opacity-80
      >
        <ContentNavItem v-for="item in navigation" :key="item.url" :item="item" />
      </div>
    </div>

    <!-- 頁面底部編輯鏈接 -->
    <div border="t base dashed" px6 py2>
      <NuxtLink
        v-if="sourceUrl"
        :to="sourceUrl" target="_blank"
        flex="~ items-center gap-2" op50 hover="text-primary op100"
      >
        <div i-ph-note-pencil-duotone />
        Edit this page
      </NuxtLink>
    </div>
  </div>
</template>
