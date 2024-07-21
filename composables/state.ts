import type { PlaygroundInstance } from './playground'

export function usePanelDragging() {
  return useState('is-panel-dragging', () => false)
}

export function usePanelCookie(name: string, value: number) {
  return useCookie(
    name,
    { default: () => (value), watch: true },
  )
}

// TODO: migrate to Pinia
export function useGlobalPlayground() {
  return useState<PlaygroundInstance | undefined>(
    'playground',
    () => undefined,
  )
}