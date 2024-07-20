<script setup lang="ts">
// @ts-expect-error missing type
import { Pane, Splitpanes } from 'splitpanes'

const isDragging = usePanelDragging()
const panelSizeEditor = usePanelCookie('nuxt-playground-panel-editor', 30)
const panelSizeFrame = usePanelCookie('nuxt-playground-panel-frame', 30)

const iframe = ref<HTMLIFrameElement>()

type Status = 'init' | 'mounting' | 'installing' | 'error' | 'start' | 'ready'
const status = ref<Status>('init')
const error = shallowRef<{message: string;}>()
const { iframeLocation, wcUrl } = usePlayground()
// auto update inputUrl when location value changed
const inputUrl = ref<string>('')
syncRef(computed(() => iframeLocation.value.fullPath), inputUrl, { direction: 'ltr' })

const stream = ref<ReadableStream>()

async function startDevServer() {
  const tree = globFilesToWebContainerFs(
    '../templates/basic/',
    import.meta.glob([
      '../templates/basic/**/*.*',
      '../templates/basic/**/.npmrc',
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
      iframeLocation.value = {
        origin: url,
        fullPath: '/',
      }
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

function refreshIframe() {
  if (wcUrl.value && iframe.value) {
    iframe.value.src = wcUrl.value
    inputUrl.value = iframeLocation.value.fullPath
  }
}
function navigate() {
  iframeLocation.value.fullPath = inputUrl.value
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement)
    activeElement.blur()
}

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
      <PanelEditor />
    </Pane>

    <Pane :size="panelSizeFrame" min-size="10">
      <div grid="~ cols-[80px_1fr_80px]" px4 border="b base dashed" bg-faded>
        <div flex="~ gap-2 items-center" py2>
          <div i-ph-globe-duotone />
          <span text-sm>Preview</span>
        </div>
        <div flex px-2 py1.5>
          <div
            flex="~ items-center justify-center" mx-auto w-full px2 max-w-100 bg-faded rounded text-sm border="base 1 hover:gray-500/30"
            :class="{
              'pointer-events-none': !wcUrl,
            }"
          >
            <form w-full @submit.prevent="navigate">
              <input v-model="inputUrl" w-full type="text" bg-transparent flex-1 focus:outline-none>
            </form>
            <div flex="~ items-center justify-end">
              <button v-if="wcUrl" mx1 op-75 hover:op-100 @click="refreshIframe">
                <div i-ph-arrow-clockwise-duotone text-sm />
              </button>
            </div>
          </div>
        </div>
      </div>

      <iframe 
        v-if="wcUrl"
        ref="iframe"
        :src="wcUrl"
        :class="{ 'pointer-events-none': isDragging }"
        w-full h-full
        bg-transparent
        allow="geolocation; microphone; camera; payment; autoplay; serial; cross-origin-isolated"
      />

      <div v-if="status !== 'ready'" w-full h-full flex="~ col items-center justify-center" capitalize text-lg>
        <div i-svg-spinners-90-ring-with-bg /> {{ status }}
      </div>
    </Pane>

    <Pane>
      <PanelTerminal :stream="stream" />
    </Pane>
  </Splitpanes>
</template>

<style scoped>
</style>
