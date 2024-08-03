import type { Raw } from 'vue'
import type { WebContainer, WebContainerProcess } from '@webcontainer/api'
import { dirname } from 'pathe'
import { VirtualFile } from '../structures/VirtualFile'
import type { ClientInfo } from '~/types/rpc'
import type { GuideMeta } from '~/types/guides'

export const PlaygroundStatusOrder = [
  'init',
  'mount',
  'install',
  'start',
  'ready',
] as const
export type PlaygroundStatus = typeof PlaygroundStatusOrder[number] | 'error'

export const usePlaygroundStore = defineStore('playground', () => {
  const status = ref<PlaygroundStatus>('init')
  const error = shallowRef<{ message: string }>() // 用於存儲錯誤信息
  const currentProcess = shallowRef<Raw<WebContainerProcess | undefined>>() // 當前運行的進程
  const files = shallowReactive<Raw<Map<string, VirtualFile>>>(new Map()) // 存儲虛擬文件列表
  const webcontainer = shallowRef<Raw<WebContainer>>() // WebContainer 實例
  const clientInfo = ref<ClientInfo>()
  const fileSelected = shallowRef<Raw<VirtualFile>>()
  const mountedGuide = shallowRef<Raw<GuideMeta>>()

  const previewLocation = ref({
    origin: '',
    fullPath: '',
  })
  const previewUrl = ref('') // 完整的預覽 URL

  function updatePreviewUrl() {
    previewUrl.value = previewLocation.value.origin + previewLocation.value.fullPath
  }

  const colorMode = useColorMode()
  let mountPromise: Promise<void> | undefined

  // 在客戶端側掛載 playground
  if (import.meta.client) {
    async function mount() {
      const { templates } = await import('../templates') // 導入模板
      const { files: _files, tree } = await templates.basic({ // 獲取模板文件及虛擬文件樹
        nuxtrc: [
          // 根據顏色模式設置初始 HTML 類
          colorMode.value === 'dark'
            ? 'app.head.htmlAttrs.class=dark'
            : '',
        ],
      })

      const wc = await import('@webcontainer/api') // 導入 WebContainer
        .then(({ WebContainer }) => WebContainer.boot()) // 啟動 WebContainer

      webcontainer.value = wc // 存儲 WebContainer 實例
      // 存儲文件列表
      _files.forEach((file) => {
        files.set(file.filepath, file)
        file.wc = wc
      })

      _files.forEach((file) => { // 為每個文件添加 WebContainer 引用
        file.wc = wc
      })

      wc.on('server-ready', async (port, url) => {
        // Nuxt 監聽多個端口，'server-ready' 會為每個端口觸發，我們需要專注於主要的那個
        if (port === 3000) {
          previewLocation.value = {
            origin: url,
            fullPath: '/',
          }
        }

        status.value = 'start'
      })

      wc.on('error', (err) => {
        error.value = err
        status.value = 'error'
      })

      status.value = 'mount'
      await wc.mount(tree)

      startServer() // 啟動服務器

      // 在開發模式下，進行熱模塊替換時，我們終止之前的進程，同時重用相同的 WebContainer
      if (import.meta.hot) {
        import.meta.hot.accept(() => {
          killPreviousProcess()
        })
      }
    }

    mountPromise = mount()
  }

  let abortController: AbortController | undefined // 用於中止操作的控制器

  function killPreviousProcess() { // 終止之前的進程
    abortController?.abort()
    abortController = undefined
    currentProcess.value?.kill()
    currentProcess.value = undefined
  }

  async function startServer() {
    if (!import.meta.client) // 如果不是客戶端，直接返回
      return

    killPreviousProcess() // 終止之前的進程

    const wc = webcontainer.value!
    abortController = new AbortController() // 創建新的用於中止操作的控制器
    const signal = abortController.signal // 獲取中止信號

    await launchDefaultProcess(wc, signal)
    await launchInteractiveProcess(wc, signal)
  }

  async function spawn(wc: WebContainer, command: string, args: string[] = []) { // 生成新進程
    if (currentProcess.value)
      throw new Error('A process is already running')
    const process = await wc.spawn(command, args)
    currentProcess.value = process
    return process.exit.then((r) => {
      if (currentProcess.value === process)
        currentProcess.value = undefined
      return r
    })
  }

  async function launchDefaultProcess(wc: WebContainer, signal: AbortSignal) { // 啟動默認進程
    if (!wc)
      return

    status.value = 'install'

    if (signal.aborted)
      return

    const installManager = 'pnpm'
    const installExitCode = await spawn(wc, installManager, ['install']) // 執行 install
    if (signal.aborted)
      return

    if (installExitCode !== 0) { // 如果安裝失敗
      status.value = 'error'
      error.value = {
        message: `Unable to run ${installManager} install, exit as ${installExitCode}`,
      }
      console.error(`Unable to run ${installManager} install`)
      return
    }

    await spawn(wc, installManager, ['run', 'dev', '--no-qr']) // 運行開發服務器
  }

  async function launchInteractiveProcess(wc: WebContainer, signal: AbortSignal) { // 啟動交互式進程
    if (signal.aborted)
      return
    await spawn(wc, 'jsh') // 啟動 jsh
  }

  async function downloadZip() {
    if (!import.meta.client)
      return

    const wc = webcontainer.value!

    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    type Zip = typeof zip

    const crawlFiles = async (dir: string, zip: Zip) => { // 遍歷文件並添加到 zip
      const files = await wc.fs.readdir(dir, { withFileTypes: true })

      await Promise.all(
        files.map(async (file) => {
          if (isFileIgnored(file.name)) // 如果文件被忽略，跳過
            return

          if (file.isFile()) {
            // TODO: 如果是 package.json，我們修改以移除一些字段
            const content = await wc.fs.readFile(`${dir}/${file.name}`, 'utf8')
            zip.file(file.name, content)
          }
          else if (file.isDirectory()) {
            const folder = zip.folder(file.name)!
            return crawlFiles(`${dir}/${file.name}`, folder)
          }
        }),
      )
    }

    await crawlFiles('.', zip)

    const blob = await zip.generateAsync({ type: 'blob' }) // 生成 zip blob
    const url = URL.createObjectURL(blob)
    const date = new Date()
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
    const link = document.createElement('a')
    link.href = url
    // TODO: 使用當前教程名稱生成更好的文件名
    link.download = `nuxt-playground-${dateString}.zip`
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const guideDispose: (() => void | Promise<void>)[] = [] // 用於存儲每個 guide 的釋放函數

  async function mountGuide(guide?: GuideMeta) {
    await mountPromise

    // Unmount the old guide
    await Promise.all(guideDispose.map(dispose => dispose()))
    guideDispose.length = 0 // 清空釋放函數列表

    if (guide) {
      // Mount the new guide
      // eslint-disable-next-line no-console
      console.log('mounting guide', guide)

      await Promise.all(
        Object.entries(guide?.files || {})
          .map(async ([filepath, content]) => {
            await webcontainer.value?.fs.mkdir(dirname(filepath), { recursive: true })
            await updateOrCreateFile(filepath, content)
          }),
      )
    }

    // if (status.value === 're
    previewLocation.value.fullPath = guide?.startingUrl || '/'
    fileSelected.value = files.get(guide?.startingFile || 'app.vue')
    updatePreviewUrl()

    mountedGuide.value = guide

    // TODO: trigger a editor update
    return undefined

    async function updateOrCreateFile(filepath: string, content: string) {
      const file = files.get(filepath)
      if (file) {
        const oldContent = file.read()
        await file.write(content)
        guideDispose.push(async () => {
          await file.write(oldContent)
        })
        return file
      }
      else {
        const newFile = new VirtualFile(filepath, content, webcontainer.value)
        await newFile.write(content)
        files.set(filepath, newFile)
        guideDispose.push(async () => {
          files.delete(filepath)
          await webcontainer.value!.fs.rm(filepath)
        })
        return newFile
      }
    }
  }

  return { // 返回 store 的公共接口
    webcontainer,
    updatePreviewUrl,
    status,
    restartServer: startServer,
    previewUrl,
    previewLocation,
    mountGuide,
    mountedGuide,
    fileSelected,
    files,
    error,
    downloadZip,
    currentProcess,
    clientInfo,
  }
})

export type PlaygroundStore = ReturnType<typeof usePlaygroundStore> // 導出 PlaygroundStore 類型

if (import.meta.hot) // 支持熱模塊替換
  import.meta.hot.accept(acceptHMRUpdate(usePlaygroundStore, import.meta.hot))
