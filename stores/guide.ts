import type { Raw } from 'vue'
import type { GuideMeta, PlaygroundFeatures } from '~/types/guides'

const defaultFeatures: PlaygroundFeatures = Object.freeze({
  fileTree: false,
  terminal: false,
})

export const useGuideStore = defineStore('guide', () => {
  const play = usePlaygroundStore()
  const ui = useUiState()
  const preview = usePreviewStore()

  const features = ref<PlaygroundFeatures>(defaultFeatures) // terminal、fileTree、download...等屬性的狀態
  const currentGuide = shallowRef<Raw<GuideMeta>>()
  const showingSolution = ref(false)
  const embeddedDocs = ref('')

  watch(features, () => { // 監聽 features 的變化，根據變化更新 terminal UI 狀態
    if (features.value.fileTree === true) {
      if (ui.panelFileTree <= 0)
        ui.panelFileTree = 20
    }
    else if (features.value.fileTree === false) {
      ui.panelFileTree = 0
    }

    if (features.value.terminal === true)
      ui.showTerminal = true
    else if (features.value.terminal === false)
      ui.showTerminal = false
  })

  async function mount(guide?: GuideMeta, withSolution = false) {
    await play.init // 初始化 playground

    // eslint-disable-next-line no-console
    console.log('mounting guide', guide)

    await play.mount({
      ...guide?.files,
      ...withSolution ? guide?.solutions : {},
    })

    play.fileSelected = play.files.get(guide?.startingFile || 'app.vue') // 選擇起始文件
    preview.location.fullPath = guide?.startingUrl || '/' // 設定預覽的起始 URL
    preview.updateUrl()

    features.value = guide?.features || { ...defaultFeatures } // 更新 features 用於控制 terminal 狀態
    currentGuide.value = guide
    showingSolution.value = withSolution // 在確定 mount 後設定是否顯示解決方案

    return undefined
  }

  async function toggleSolutions() {
    await mount(currentGuide.value, !showingSolution.value)
  }

  function openEmbeddedDocs(url: string) {
    embeddedDocs.value = url
  }

  return {
    mount,
    toggleSolutions,
    features,
    currentGuide,
    showingSolution,
    embeddedDocs,
    openEmbeddedDocs,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGuideStore, import.meta.hot))
