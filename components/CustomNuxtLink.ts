const NuxtLink = defineNuxtLink({})

// Wrapping NuxtLink with custom handling for `https://nuxt.com` links
export default defineComponent({
  name: 'NuxtLink',
  props: NuxtLink.props,
  setup(props, { slots }) {
    const url = props.to || props.href // 獲取目標 URL

    // Get CORS and add url?.startsWith('https://vuejs.org')
    if (url?.startsWith('https://nuxt.com')) {
      // TODO: add setting to toggle this behavior
      const guide = useGuideStore()
      function onClick(e: MouseEvent) {
        if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey)
          return
        e.preventDefault()
        guide.openEmbeddedDocs(url) // 打開內嵌文檔
      }

      return () => {
        return h('a', { ...props, href: url, onClick }, slots) // 渲染 <a> 標籤、綁定點擊事件
      }
    }

    // 如果 URL 不符合條件，則渲染原始的 NuxtLink
    return () => h(NuxtLink, props, slots)
  },
})
