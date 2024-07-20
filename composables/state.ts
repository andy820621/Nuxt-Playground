export function usePanelDragging() {
  return useState('is-panel-dragging', () => false)
}

export function usePanelCookie(name: string, value: number) {
  return useCookie(
    name,
    { default: () => (value), watch: true },
  )
}

export function useTerminalStream() {
  return useState<ReadableStream | undefined>('terminal-stream', () => undefined)
}