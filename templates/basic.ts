import { VirtualFile } from '../structures/VirtualFile'
import { filesToWebContainerFs } from './utils'
import type { TemplateOptions } from './types'

export default function load(options: TemplateOptions = {}) {
  const rawInput = import.meta.glob([
    './basic/**/*.*',
    './basic/**/.layer-playground/**/*.*',
    './basic/**/.nuxtrc',
    './basic/**/.npmrc',
  ], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const rawFiles = {
    ...Object.fromEntries(
      Object.entries(rawInput)
        .map(([key, value]) => [key.replace('./basic/', ''), value]),
    ),
    ...options.files,
  }

  // Merge .nuxtrc
  if (options.nuxtrc) {
    rawFiles['.nuxtrc'] = [
      ...(rawFiles['.nuxtrc'] || '').split(/\n/g),
      ...options.nuxtrc,
    ].filter(Boolean).join('\n')
  }

  const files = Object.entries(rawFiles)
    .map(([path, content]) => {
      return new VirtualFile(path, content)
    })

  const tree = filesToWebContainerFs(
    files,
  )

  return {
    files,
    tree,
  }
}