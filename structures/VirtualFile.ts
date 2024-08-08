import type { FileNode, WebContainer } from '@webcontainer/api'
import { dirname } from 'pathe'

export class VirtualFile {
  constructor(
    public readonly filepath: string,
    private _content: string,
    public wc: WebContainer,
  ) {}

  toNode(): FileNode {
    // eslint-disable-next-line ts/no-this-alias
    const self = this
    return {
      file: {
        get contents() {
          return self._content
        },
      },
    }
  }

  read() {
    return this._content
  }

  async write(content: string) {
    this._content = content
    await this.wc.fs.mkdir(dirname(this.filepath), { recursive: true }) // 確保目錄存在 (防止在嘗試寫入文件時，因為目錄不存在而導致的錯誤)
    await this.wc.fs.writeFile(this.filepath, content, 'utf-8')
  }

  async remove() {
    await this.wc.fs.rm(this.filepath)
  }
}
