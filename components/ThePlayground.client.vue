<script setup lang="ts">
const iframe = ref<HTMLIFrameElement>()
const wcUrl = ref<string>()

type Status = 'init' | 'mounting' | 'installing' | 'error' | 'start' | 'ready'
const status = ref<Status>('init')
const error = shallowRef<{message: string;}>()

const stream = ref<ReadableStream>()

async function startDevServer() {
  const rawFiles = import.meta.glob('../templates/basic/*.*', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const files = Object.fromEntries(
    Object.entries(rawFiles).map(([path, content]) => {
      return [path.replace('../templates/basic/', ''), {
        file: {
          contents: content,
        },
      }]
    }),
  ) as {
    readonly [Symbol.toStringTag]: string;
  };

  const webcontainerInstance = await useWebContainer()

  // Evant Handler
  webcontainerInstance.on('server-ready', (port, url) => {
    status.value = 'ready'
    wcUrl.value = url
  })
  webcontainerInstance.on('error', (err) => {
    status.value = 'error'
    error.value = err
  })

  status.value = 'mounting'
  await webcontainerInstance.mount(files)
  
  status.value = 'installing'
  const installProcess = await webcontainerInstance.spawn('npm', ['install'])
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
  const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev'])
  stream.value = devProcess.output

  // In dev, when doing HMR, we kill the previous process while reuseing the same WebContainer
  if(import.meta.hot) {
    import.meta.hot.accept(() => {
      devProcess.kill()
      // startDevServer()
    })
  }
}

watchEffect(() => {
  if (iframe.value && wcUrl.value) iframe.value.src = wcUrl.value
})

onMounted(startDevServer)
</script>

<template>
  <div max-h-full w-full grid="~ rows-[2fr_1fr]" of-hidden>
    <iframe v-show="status === 'ready'" ref="iframe" w-full h-full />
    <div v-if="status !== 'ready'" w-full h-full flex="~ col items-center justify-center" capitalize text-lg>
      <div i-svg-spinners-90-ring-with-bg /> {{ status }}
    </div>
    

    <TerminalOutput :stream="stream" min-h-0 />
  </div>
</template>

<style scoped>
</style>
