import Fuse from 'fuse.js' // 用於實現模糊搜索功能

export interface Command {
  id?: string
  title: string
  to?: string
  description?: string
  visible?: () => boolean
  handler?: () => void
  icon?: string
}

export const useCommandsStore = defineStore('commands', () => {
  const search = ref('') // 儲存當前的搜索字串
  const isShown = ref(false)
  const commandsAll = reactive<Set<Command>>(new Set()) // 儲存所有命令的集合
  const guidesResult = ref<Command[]>([]) // 儲存搜尋到的 guides 結果

  // 用於搜索命令
  const fuse = computed(() => new Fuse(Array.from(commandsAll), {
    keys: ['title', 'description'], // 指定要搜索的屬性
    threshold: 0.3, // 值介於 0~1，搜尋準確度（越低獲得更寬鬆的匹配結果，而高則會更嚴格）
  }))

  const debouncedSearch = refDebounced(search, 100)

  watch(debouncedSearch, async (v) => {
    if (v) { // 當搜尋內容變化被觸發時
      const result = await searchContent(v, {}) // 用 searchContent API 獲取内容目录
      guidesResult.value = result.value.map((i): Command => ({
        id: i.id,
        title: i.title || 'Untitled',
        to: i.id,
        icon: 'i-ph-file-duotone',
      }))
    }
    else {
      guidesResult.value = []
    }
  })

  // 用於獲取搜索結果
  const commandsResult = computed(() => {
    let result = !search.value
      ? Array.from(commandsAll)
      : [
          ...fuse.value.search(search.value).map(i => i.item),
          ...guidesResult.value,
        ]

    result = result
      .filter(i => i.visible ? i.visible() : true)

    return result
  })

  return {
    search,
    isShown,
    commandsAll,
    commandsResult,
  }
})

// 用於添加命令
export function addCommands(...inputs: Command[]) {
  const commands = useCommandsStore()
  onMounted(() => {
    for (const command of inputs)
      commands.commandsAll.add(command)
  })

  onUnmounted(() => {
    for (const command of inputs)
      commands.commandsAll.delete(command)
  })
}

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useCommandsStore, import.meta.hot))
