import { WebContainer } from '@webcontainer/api'

let _webcontainerInstance: Promise<WebContainer>

export async function useWebContainer() {
  if (!_webcontainerInstance) _webcontainerInstance = WebContainer.boot()
    
  return await _webcontainerInstance
}