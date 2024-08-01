import { basename, dirname } from 'pathe'
import * as volar from '@volar/monaco'
import { Uri, editor, languages } from 'monaco-editor-core'
import * as onigasm from 'onigasm' // 引入 onigasm，用於語法高亮
import onigasmWasm from 'onigasm/lib/onigasm.wasm?url' // 引入 onigasm 的 wasm 文件
import { getOrCreateModel } from './utils'
import type { CreateData } from './vue.worker'
import type { FileType } from './types'

export type PlaygroundMonacoContext = Pick<PlaygroundStore, 'webcontainer' | 'files'>

export function loadWasm() {
  return onigasm.loadWASM(onigasmWasm)
}

export class WorkerHost {
  constructor(private ctx: PlaygroundMonacoContext) {}

  // 讀取文件系統中的文件內容
  async fsReadFile(uriString: string, encoding = 'utf-8') {
    const uri = Uri.parse(uriString)
    try {
      const filepath = withoutLeadingSlash(uri.fsPath)
      const content = await this.ctx.webcontainer!.fs.readFile(filepath, encoding as 'utf-8')
      if (content != null)
        getOrCreateModel(uri, undefined, content)
      return content
    }
    catch (err) {
      console.error(err)
      return undefined
    }
  }

  // 因為 WebContainer 不支持 fs.stat，所以使用 readdir 來檢查文件是否是目錄
  async fsStat(uriString: string) {
    const uri = Uri.parse(uriString)
    const dir = withoutLeadingSlash(dirname(uri.fsPath))
    const base = basename(uri.fsPath)

    try {
      // TODO: should we cache it?
      const files = await this.ctx.webcontainer!.fs.readdir(dir, { withFileTypes: true })
      const file = files.find(item => item.name === base)
      if (!file)
        return undefined
      if (file.isFile()) {
        return {
          type: 1 satisfies FileType.File,
          size: 100,
          ctime: Date.now(),
          mtime: Date.now(),
        }
      }
      else {
        return {
          type: 2 satisfies FileType.Directory,
          size: -1,
          ctime: -1,
          mtime: -1,
        }
      }
    }
    catch (err) {
      console.error(err);
      // file not found
      return undefined
    }
  }

  async fsReadDirectory(uriString: string) {
    const uri = Uri.parse(uriString)
    try {
      const filepath = withoutLeadingSlash(uri.fsPath)
      const result = await this.ctx.webcontainer!.fs.readdir(filepath, { withFileTypes: true })
      return result.map(item => [item.name, item.isDirectory() ? 2 : 1]) as [string, 1 | 2][] // 返回文件名和類型
    }
    catch (err) {
      console.error(err)
      return []
    }
  }
}

let disposeVue: undefined | (() => void) // 定義一個變量，用於存儲 Vue 語言工具的釋放函數
export async function reloadLanguageTools(ctx: PlaygroundMonacoContext) {
  disposeVue?.() // 如果存在舊的釋放函數，則調用它

  const worker = editor.createWebWorker<any>({
    moduleId: 'vs/language/vue/vueWorker',
    label: 'vue',
    host: new WorkerHost(ctx),
    createData: {
      tsconfig: {},
    } satisfies CreateData,
  })
  const languageId = ['vue', 'javascript', 'typescript']
  const getSyncUris = () => ctx.files.map(file => Uri.parse(`file:///${file.filepath}`))  // 將文件路徑轉換為 URI
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
    worker?.dispose()
    disposeMarkers()
    disposeAutoInsertion()
    disposeProvides()
  }
}

function withoutLeadingSlash(path: string) { 
  return path.replace(/^\/+/, '') // 解析文件路徑(不包括路徑前面的 /)
}