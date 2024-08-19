import { fileURLToPath } from 'node:url' // 將 URL 轉換為檔案路徑
import fs from 'node:fs/promises'
import { addTemplate, addVitePlugin, defineNuxtModule } from '@nuxt/kit' // 用於定義 Nuxt 模組和添加模板
import fg from 'fast-glob' // 用於匹配檔案模式
import { relative, resolve } from 'pathe' // 用於計算相對路徑
import { SourceMapGenerator } from 'source-map'

export default defineNuxtModule({
  meta: {
    name: 'template-loader',
  },
  setup(_) {
    addTemplate({
      filename: 'templates/basic.ts',
      getContents: async () => {
        const dir = fileURLToPath(new URL('../templates/basic', import.meta.url))
        const files = await fg('**/*.*', {
          ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/.nuxt/**',
          ],
          dot: true,
          cwd: dir, // 設置當前工作目錄為模板目錄
          onlyFiles: true,
          absolute: true, // 返回絕對路徑
        })

        const filesMap: Record<string, string> = {}

        await Promise.all(
          files.sort().map(async (filename) => {
            try {
              const content = await fs.readFile(filename, 'utf-8')
              filesMap[relative(dir, filename)] = content
            }
            catch (err) {
              console.error(`Error reading file ${filename}:`, err)
            }
          }),
        )

        return `export default ${JSON.stringify(filesMap)}`
      },
    })

    addVitePlugin({
      name: 'nuxt-playground:template-loader',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.match(/\/\.template\/index\.ts/))
          return

        async function getFileMap(dir: string) {
          const files = await fg('**/*.*', {
            cwd: dir,
            dot: true,
            onlyFiles: true,
            absolute: false,
            ignore: [
              '**/node_modules/**',
              '**/.git/**',
              '**/.nuxt/**',
            ],
          })

          if (!files.length)
            return undefined

          const filesMap: Record<string, string> = {}

          await Promise.all(
            files.sort().map(async (filename) => {
              try {
                const content = await fs.readFile(resolve(dir, filename), 'utf-8')
                filesMap[filename] = content
              }
              catch (err) {
                console.error(`Error reading file ${filename}:`, err)
              }
            }),
          )

          return filesMap
        }

        const [files, solutions] = await Promise.all([
          getFileMap(resolve(id, '../files')),
          getFileMap(resolve(id, '../solutions')),
        ])

        const transformedCode = [
          code,
          `meta.files = ${JSON.stringify(files)}`,
          `meta.solutions = ${JSON.stringify(solutions)}`,
          '',
        ].join('\n')

        // 假設您需要手動生成源映射
        const map = new SourceMapGenerator({ file: id })
        map.addMapping({
          generated: { line: 1, column: 0 },
          source: id,
          original: { line: 1, column: 0 },
        })

        return {
          code: transformedCode,
          map: map.toString(), // 返回生成的源映射
        }
      },
    })
  },
})
