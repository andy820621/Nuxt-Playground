import type { Raw } from 'vue'
import type { WebContainer, WebContainerProcess } from '@webcontainer/api'
import { VirtualFile } from '../structures/VirtualFile'
import { filesToWebContainerFs } from '~/templates/utils'

export const PlaygroundStatusOrder = [
  'init',
  'mount',
  'install',
  'start',
  'polling',
  'ready',
  'interactive',
] as const
export type PlaygroundStatus = typeof PlaygroundStatusOrder[number] | 'error'

const NUXT_PORT = 4000

export const usePlaygroundStore = defineStore('playground', () => {
  const preview = usePreviewStore()

  const webcontainer = shallowRef<Raw<WebContainer>>()
  const status = ref<PlaygroundStatus>('init')
  const fileSelected = shallowRef<Raw<VirtualFile>>()
  const files = shallowReactive<Raw<Map<string, VirtualFile>>>(new Map()) // 存儲虛擬文件列表
  const error = shallowRef<{ message: string }>()
  const currentProcess = shallowRef<Raw<WebContainerProcess | undefined>>()

  let filesTemplate: Record<string, string> = {}

  const INSTALL_MANAGER = 'pnpm'

  const colorMode = useColorMode()
  let _promiseInit: Promise<void> | undefined
  let hasInstalled = false

  if (import.meta.client) {
    async function init() { // 僅在客戶端初始化
      const [
        wc,
        filesRaw,
      ] = await Promise.all([
        import('@webcontainer/api').then(({ WebContainer }) => WebContainer.boot()), // 啟動 WebContainer

        import('../templates') // 加載模板文件
          .then(r => r.templates.basic({
            nuxtrc: [ // Have color mode on initial load
              colorMode.value === 'dark' ? 'app.head.htmlAttrs.class=dark' : '',
            ],
          })),
      ])

      filesTemplate = filesRaw

      webcontainer.value = wc // 存儲 WebContainer 實例

      Object.entries(filesRaw)
        .forEach(([path, content]) => {
          files.set(path, new VirtualFile(path, content, wc)) // 創建虛擬文件並存儲
        })

      wc.on('server-ready', async (port, url) => {
        // Nuxt 監聽多個端口，'server-ready' 會為每個端口觸發，我們需要專注於主要的那個
        if (port === NUXT_PORT) {
          preview.location = {
            origin: url,
            fullPath: '/',
          }
        }

        status.value = 'polling'
      })

      wc.on('error', (err) => {
        error.value = err
        status.value = 'error'
      })

      status.value = 'mount'
      await wc.mount(filesToWebContainerFs([...files.values()]))

      startServer() // 啟動服務器

      // 在開發模式下，進行熱模塊替換時，我們終止之前的進程
      if (import.meta.hot) {
        import.meta.hot.accept(() => {
          killPreviousProcess()
        })
      }
    }

    _promiseInit = init()
  }

  let abortController: AbortController | undefined // 用於中止操作的控制器

  function killPreviousProcess() { // 終止之前的進程
    abortController?.abort()
    abortController = undefined
    currentProcess.value?.kill()
    currentProcess.value = undefined
  }

  async function startServer(reinstall = false) {
    if (!import.meta.client) // 如果不是客戶端，直接返回
      return

    killPreviousProcess() // 終止之前的進程

    const wc = webcontainer.value!
    abortController = new AbortController() // 創建新的用於中止操作的控制器
    const signal = abortController.signal // 獲取中止信號

    if (reinstall)
      hasInstalled = false

    if (!hasInstalled)
      await launchInstallProcess(wc, signal)

    if (hasInstalled)
      await launchNuxtProcess(wc, signal)

    await launchInteractiveProcess(wc, signal)
  }

  async function spawn(wc: WebContainer, command: string, args: string[] = []) { // 生成新進程
    if (currentProcess.value)
      throw new Error('A process is already running')
    const process = await wc.spawn(command, args, {
      env: {
        NUXT_PORT: NUXT_PORT.toString(),
      },
    })
    currentProcess.value = process
    return process.exit.then((r) => {
      if (currentProcess.value === process)
        currentProcess.value = undefined
      return r
    })
  }

  async function launchInstallProcess(wc: WebContainer, signal: AbortSignal) { // 啟動默認進程
    if (signal.aborted)
      return

    status.value = 'install'

    const installExitCode = await spawn(wc, 'pnpm', ['install', '--prefer-offline']) // 執行 install
    if (signal.aborted)
      return

    if (installExitCode !== 0) { // 如果安裝失敗
      status.value = 'error'
      error.value = {
        message: `Unable to run ${INSTALL_MANAGER} install, exit as ${installExitCode}`,
      }
      console.error(`Unable to run ${INSTALL_MANAGER} install`)
      return false
    }

    hasInstalled = true
  }

  async function launchNuxtProcess(wc: WebContainer, signal: AbortSignal) {
    if (signal.aborted)
      return
    status.value = 'start'

    await spawn(wc, INSTALL_MANAGER, ['run', 'dev', '--no-qr']) // 運行開發服務器
  }

  async function launchInteractiveProcess(wc: WebContainer, signal: AbortSignal) { // 啟動交互式進程
    if (signal.aborted)
      return
    status.value = 'interactive'
    await spawn(wc, 'jsh') // 啟動 jsh
  }

  async function _updateOrCreateFile(filepath: string, content: string) {
    const file = files.get(filepath)
    if (file) {
      if (file.read() !== content) // 如果檔案內容不同，才更新檔案
        await file.write(content)
      return file
    }
    else {
      const newFile = new VirtualFile(filepath, content, webcontainer.value!)
      files.set(filepath, newFile)
      await newFile.write(content)
      return newFile
    }
  }

  /**
   * Mount files to WebContainer.
   * This will do a diff with the current files and only update the ones that changed
   */
  async function mount(map: Record<string, string>, templates = filesTemplate) {
    const objects = {
      ...templates,
      ...map,
    }

    await Promise.all([
      // 更新或創建檔案
      ...Object.entries(objects)
        .map(async ([filepath, content]) => {
          await _updateOrCreateFile(filepath, content)
        }),
      // 刪除多餘的檔案
      ...Array.from(files.keys())
        .filter(filepath => !(filepath in objects))
        .map(async (filepath) => {
          const file = files.get(filepath)
          await file?.remove()
          files.delete(filepath)
        }),
    ])
  }

  return {
    get init() {
      return _promiseInit
    },

    webcontainer,
    status,
    error,
    currentProcess,

    restartServer: startServer,

    fileSelected,
    files,
    mount,
  }
})

export type PlaygroundStore = ReturnType<typeof usePlaygroundStore> // 導出 PlaygroundStore 類型

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePlaygroundStore, import.meta.hot))
