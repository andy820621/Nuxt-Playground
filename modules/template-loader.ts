import { fileURLToPath } from 'node:url' // 將 URL 轉換為檔案路徑
import fs from 'node:fs/promises'
import { addTemplate, defineNuxtModule } from '@nuxt/kit' // 用於定義 Nuxt 模組和添加模板
import fg from 'fast-glob' // 用於匹配檔案模式
import { relative } from 'pathe' // 用於計算相對路徑

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
  },
})
