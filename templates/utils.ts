import type { FileSystemTree } from '@webcontainer/api'
import type { VirtualFile } from '../structures/VirtualFile'

export function filesToWebContainerFs(
  files: VirtualFile[],
) {
  const tree: FileSystemTree = {}

  for (const file of files) {
    if (!file.filepath.includes('/')) {
      tree[file.filepath] = file.toNode()
    }
    else {
      const parts = file.filepath.split('/')
      const filename = parts.pop()
      let current = tree

      for (const dir of parts) {
        if (!current[dir]) {
          current[dir] = {
            directory: {},
          }
        }

        const node = current[dir]
        if (!('directory' in node))
          throw new Error('Unexpected directory but found file')
        current = node.directory
      }

      if (filename)
        current[filename] = file.toNode()
    }
  }

  return tree
}
