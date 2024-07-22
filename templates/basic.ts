import { VirtualFile } from '../structures/VirtualFile'
import { filesToWebContainerFs } from './utils'

export default function load() {
  const rawInput = import.meta.glob([
    './basic/**/*.*',
    './basic/**/.npmrc',
  ], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const files = Object.entries(rawInput)
    .map(([path, content]) => {
      return new VirtualFile(path.replace('./basic/', ''), content)
    })

  const tree = filesToWebContainerFs(
    files,
  )

  return {
    files,
    tree,
  }
}