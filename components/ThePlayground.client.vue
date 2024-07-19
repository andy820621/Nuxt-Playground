<script setup lang="ts">
// @ts-expect-error missing type
import { Pane, Splitpanes } from 'splitpanes'

const isDragging = usePanelDragging()
const panelSizeEditor = useLocalStorage('nuxt-playground-panel-editor', 30)
const panelSizeFrame = useLocalStorage('nuxt-playground-panel-frame', 30)

const iframe = ref<HTMLIFrameElement>()
const wcUrl = ref<string>()

type Status = 'init' | 'mounting' | 'installing' | 'error' | 'start' | 'ready'
const status = ref<Status>('init')
const error = shallowRef<{message: string;}>()

const stream = ref<ReadableStream>()

async function startDevServer() {
  const tree = globFilesToWebContainerFs(
    '../templates/basic/',
    import.meta.glob([
      '../templates/basic/**/*.*',
      '!**/node_modules/**',
    ], {
      query: '?raw',
      import: 'default',
      eager: true,
    })
  );

  const webcontainerInstance = await useWebContainer()

  // Evant Handler
  webcontainerInstance.on('server-ready', (port, url) => {
    if (port === 3000) {
      status.value = 'ready'
      wcUrl.value = url
    }
  })
  webcontainerInstance.on('error', (err) => {
    status.value = 'error'
    error.value = err
  })

  status.value = 'mounting'
  await webcontainerInstance.mount(tree)
  
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

function startDragging() {
  isDragging.value = true
}
function endDragging(e: { size: number }[]) {
  isDragging.value = false
}
</script>

<template>
  <Splitpanes 
    max-h-full w-full of-hidden horizontal
    @resize="startDragging" @resized="endDragging"
  >
    <Pane :size="panelSizeEditor" min-size="10">
      "This is the editor pane"
    </Pane>

    <Pane :size="panelSizeFrame" min-size="10">
      <iframe 
        v-show="status === 'ready'" ref="iframe" w-full h-full :class="{ 'pointer-events-none': isDragging }" 
      />

      <div v-if="status !== 'ready'" w-full h-full flex="~ col items-center justify-center" capitalize text-lg>
        <div i-svg-spinners-90-ring-with-bg /> {{ status }}
      </div>
    </Pane>

    <Pane>
      <TerminalOutput :stream="stream" />
    </Pane>
  </Splitpanes>
</template>

<style scoped>
</style>
