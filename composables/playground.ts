export function usePlayground() {
  type Status = 'init' | 'mounting' | 'installing' | 'error' | 'start' | 'ready'

  const status = ref<Status>('init')
  const error = shallowRef<{ message: string }>()
  const stream = useTerminalStream()

  const previewLocation = ref({
    origin: '',
    fullPath: '',
  })
  const previewUrl = computed(() => previewLocation.value.origin + previewLocation.value.fullPath)

  window.addEventListener('message', (event) => {
    if (event.origin !== previewLocation.value.origin)
      return

    console.log('event', event)

    switch (event.data.type) {
      case 'update:path':
        previewLocation.value.fullPath = event.data.path
        break
      default:
        break
    }
  })

  const tree = globFilesToWebContainerFs(
    '../templates/basic/',
    import.meta.glob([
      '../templates/basic/**/*.*',
      '../templates/basic/**/.npmrc',
    ], {
      as: 'raw',
      eager: true,
    }),
  )

  console.log({ tree })

  async function mount() {
    const webContainer = await useWebContainer()

    webContainer.on('server-ready', (port, url) => {
      // Nuxt listen to multiple ports, and 'server-ready' is emitted for each of them
      // We need the main one
      if (port === 3000) {
        status.value = 'ready'
        previewLocation.value = {
          origin: url,
          fullPath: '/',
        }
      }
    })

    webContainer.on('error', (err) => {
      status.value = 'error'
      error.value = err
    })

    status.value = 'mounting'
    await webContainer.mount(tree)

    status.value = 'installing'

    const installProcess = await webContainer.spawn('pnpm', ['install'])
    stream.value = installProcess.output
    const installExitCode = await installProcess.exit

    if (installExitCode !== 0) {
      status.value = 'error'
      error.value = {
        message: `Unable to run npm install, exit as ${installExitCode}`,
      }
      throw new Error('Unable to run npm install')
    }

    status.value = 'start'
    const devProcess = await webContainer.spawn('pnpm', ['run', 'dev'])
    stream.value = devProcess.output

    // In dev, when doing HMR, we kill the previous process while reusing the same WebContainer
    if (import.meta.hot) import.meta.hot.accept(devProcess.kill)
  }

  return {
    status,
    error,
    stream,
    mount,
    previewUrl,
    previewLocation,
  }
}