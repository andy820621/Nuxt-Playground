// @ts-expect-error missing types
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker'
import type * as monaco from 'monaco-editor'
import {
  createJsDelivrFs,
  createJsDelivrUriResolver,
  decorateServiceEnvironment,
} from '@volar/cdn'
import * as ts from 'typescript'
import type { VueCompilerOptions } from '@vue/language-service'
import { resolveConfig } from '@vue/language-service'
import {
  createLanguageHost,
  createLanguageService,
  createServiceEnvironment,
} from '@volar/monaco/worker'
import type { WorkerHost } from './env'

export interface CreateData {
  tsconfig: {
    compilerOptions?: import('typescript').CompilerOptions
    vueCompilerOptions?: Partial<VueCompilerOptions>
  }
}

const DEBUG_USE_JSDELIVR = false

// globalThis.onmessage = async (e) => {
//   console.log('message to vue worker', e)
worker.initialize(
  (
    ctx: monaco.worker.IWorkerContext<WorkerHost>,
    // TODO: it seems that the create data is not pass in, investigate later
    { tsconfig }: CreateData,
  ) => {
    // const rpc = createBirpc<HostFunctions, WorkerFunctions>(
    //   {},
    //   {
    //     post: message => globalThis.postMessage({
    //       type: 'birpc',
    //       data: message,
    //     }),
    //     on(handler) {
    //       globalThis.addEventListener('message', (e) => {
    //         if (e.data.type === 'birpc')
    //           handler(e.data)
    //       })
    //     },
    //   },
    // )

    const { options: compilerOptions } = ts.convertCompilerOptionsFromJson(
      tsconfig?.compilerOptions || {},
      '',
    )

    const env = createServiceEnvironment()
    const host = createLanguageHost(
      ctx.getMirrorModels,
      env,
      '/',
      compilerOptions,
    )

    if (DEBUG_USE_JSDELIVR) {
      const jsDelivrFs = createJsDelivrFs(ctx.host.onFetchCdnFile) // 創建 jsDelivr 文件系統
      const jsDelivrUriResolver = createJsDelivrUriResolver(
        '/node_modules', // 基本目錄
        {},
      )

      decorateServiceEnvironment(
        env,
        jsDelivrUriResolver, // jsDelivr URI 解析器
        {
          async stat(uri) {
            const result = await jsDelivrFs.stat(uri) // 獲取文件狀態
            return result
          },
          async readFile(uri) {
            const file = await jsDelivrFs.readFile(uri) // 讀取文件
            // console.log({ uri, file })
            return file
          },
          async readDirectory(uri) {
            const dirs = await jsDelivrFs.readDirectory(uri) // 讀取目錄
            return dirs
          },
        },
      )
    }
    else {
      const base = '/node_modules'
      decorateServiceEnvironment(
        env,
        {
          fileNameToUri(fileName) {
            if (fileName.startsWith(base)) {
              const uri = new URL(fileName, 'file://').href // 將文件名轉換為 URI
              return uri
            }
            return undefined
          },
          uriToFileName(uri) {
            if (uri.startsWith('file:///node_modules/')) {
              const filename = new URL(uri).pathname // 將 URI 轉換為文件名
              return filename
            }
            return undefined
          },
        },
        {
          async readFile(uri) {
            const file = await ctx.host.fsReadFile(uri) // 讀取文件
            // console.log('readFile', { uri, file })
            return file
          },
          async stat(uri) {
            const result = await ctx.host.fsStat(uri) // 獲取文件狀態
            // console.log('stat', uri, result)
            return result
          },
          async readDirectory(uri) {
            const dirs = await ctx.host.fsReadDirectory(uri) // 讀取目錄
            // console.log('readDirectory', uri, dirs)
            return dirs
          },
        },
      )
    }

    return createLanguageService( 
      { typescript: ts },
      env,
      resolveConfig(
        ts,
        {},
        compilerOptions,
        tsconfig?.vueCompilerOptions || {},
      ),
      host,
    )
  },
)
// }
