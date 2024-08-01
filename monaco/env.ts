import * as volar from '@volar/monaco'
import { Uri, editor, languages } from 'monaco-editor'
import * as onigasm from 'onigasm' // 引入 onigasm，用於語法高亮
import onigasmWasm from 'onigasm/lib/onigasm.wasm?url' // 引入 onigasm 的 wasm 文件
import type { WebContainer } from '@webcontainer/api'
import { getOrCreateModel } from './utils'
import type { CreateData } from './vue.worker'
import type { FileType } from './types'

// TODO: refactor this out
export class Store {
  constructor(
    public ws: WebContainer,
  ) {}

  state = {
    typescriptVersion: '5.3.3',
    files: [] as string[],
  }

  vueVersion = '3.3.10'
}

export function loadWasm() {
  return onigasm.loadWASM(onigasmWasm)
}

export class WorkerHost {
  constructor(private store: Store) {}

  // 從 CDN 獲取文件內容並創建或更新模型
  onFetchCdnFile(uri: string, content: string) {
    return getOrCreateModel(Uri.parse(uri), undefined, content)
  }

  // 讀取文件系統中的文件內容
  async fsReadFile(uri: string, encoding = 'utf-8') {
    try {
      const filepath = new URL(uri).pathname.replace(/^\/+/, '') // 解析文件路徑(不包括路徑前面的 /)
      const content = await this.store.ws.fs.readFile(filepath, encoding as 'utf-8') // 讀取文件內容
      if (content != null)
        getOrCreateModel(Uri.parse(uri), undefined, content) // 創建或更新模型
      return content
    }
    catch (err) {
      console.error(err)
      return undefined
    }
  }

  // 因為 WebContainer 不支持 fs.stat，所以使用 readdir 來檢查文件是否是目錄
  async fsStat(uriString: string) {
    const filepath = new URL(uriString).pathname.replace(/^\/+/, '') // 獲取文件路徑 (不包括路徑前面的 /)
    const dirpath = new URL('.', uriString).pathname.replace(/^\/+/, '') // 獲取當前目錄路徑 (不包括路徑前面的 /)
    const basename = filepath.slice(dirpath.length) // filepath - dirpath 得到文件名

    const files = await this.store.ws.fs.readdir(dirpath, { withFileTypes: true }) // 讀取目錄內容
    const file = files.find(item => item.name === basename) // 查找文件
    if (!file)
      return undefined
    if (file.isDirectory()) {
      return {
        type: 2 satisfies FileType.Directory, // 類型為目錄
        size: -1,
        ctime: -1,
        mtime: -1,
      }
    }
    else if (file.isFile()) {
      const content = await this.store.ws.fs.readFile(filepath, 'utf-8')
      return {
        type: 1 satisfies FileType.File, // 類型為文件
        size: content.length,
        ctime: Date.now(),
        mtime: Date.now(),
      }
    }
  }

  async fsReadDirectory(uri: string) {
    const filepath = new URL(uri).pathname.replace(/^\/+/, '') // 解析文件路徑 (不包括路徑前面的 /)
    const result = await this.store.ws.fs.readdir(filepath, { withFileTypes: true }) // 讀取目錄內容
    return result.map(item => [item.name, item.isDirectory() ? 2 : 1]) as [string, 1 | 2][] // 返回文件名和類型
  }
}

let disposeVue: undefined | (() => void) // 定義一個變量，用於存儲 Vue 語言工具的釋放函數
export async function reloadLanguageTools(store: Store) {
  disposeVue?.() // 如果存在舊的釋放函數，則調用它

  const worker = editor.createWebWorker<any>({
    moduleId: 'vs/language/vue/vueWorker',
    label: 'vue',
    host: new WorkerHost(store),
    createData: {
      tsconfig: {},
    } satisfies CreateData,
  })
  const languageId = ['vue', 'javascript', 'typescript']
  const getSyncUris = () => { // 定義一個函數，用於獲取同步的 URI
    const files = store.state.files.map(filename =>
      Uri.parse(`file:///${filename}`), // 標準化路徑表示
    )
    return files
  }
  const { dispose: disposeMarkers } = volar.editor.activateMarkers( // 啟用標記
    worker,
    languageId,
    'vue',
    getSyncUris,
    editor,
  )
  const { dispose: disposeAutoInsertion } = volar.editor.activateAutoInsertion( // 啟用自動插入
    worker,
    languageId,
    getSyncUris,
    editor,
  )
  const { dispose: disposeProvides } = await volar.languages.registerProvides( // 註冊提供者
    worker,
    languageId,
    getSyncUris,
    languages,
  )

  disposeVue = () => {
    disposeMarkers()
    disposeAutoInsertion()
    disposeProvides()
  }
}

export interface WorkerMessage {
  event: 'init'
  tsVersion: string
  tsLocale?: string
}
