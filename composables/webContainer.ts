import { WebContainer, type FileNode, type FileSystemTree } from '@webcontainer/api'

let _webContainerPromise: Promise<WebContainer>

export async function useWebContainer() {
  if (!_webContainerPromise) _webContainerPromise = WebContainer.boot()
    
  return await _webContainerPromise
}

export   function globFilesToWebContainerFs(
  prefix: string,
  rawFiles: Record<string, string>,
) {
    const files = Object.fromEntries(
      Object.entries(rawFiles).map(([path, content]) => {
        return [path.replace(prefix, ''), {
          file: {
            contents: content,
          },
        }]
      }),
    ) as {
      readonly [Symbol.toStringTag]: string;
    };

    const tree: FileSystemTree = {};

    for (const [path, file] of Object.entries(files)) {
      if (!path.includes('/')) { tree[path] = file as FileNode; }
      else {
        const parts = path.split('/')
        const filename = parts.pop()!
        let current = tree
        for (const dir of parts) {
          if (!current[dir]) current[dir] = { directory: {} };

          if (!('directory' in current[dir])) throw new Error('not a directory');
          current = current[dir].directory;
        }
        current[filename] = file as FileNode
      }
    }

    return tree;
  }