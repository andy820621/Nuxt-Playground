/* eslint-disable no-restricted-globals */
/* eslint-disable new-cap */
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type { ThemeRegistrationRaw } from '@shikijs/core'

// TODO: material-theme-palenight's format it not compatible with monaco
import themeDark from 'shiki/themes/vitesse-dark.mjs'
import themeLight from 'shiki/themes/vitesse-light.mjs'
import vueWorker from './vue.worker?worker'
import { loadWasm, reloadLanguageTools } from './env'
import type { Store, WorkerMessage } from './env'

export function initMonaco(store: Store) {
  self.MonacoEnvironment = {
    async getWorker(_: any, label: string) {
      if (label === 'vue') {
        const worker = new vueWorker()
        const init = new Promise<void>((resolve) => {
          worker.addEventListener('message', (data) => {
            if (data.data === 'inited')
              resolve()
          })
          worker.postMessage({
            event: 'init',
            tsVersion: store.state.typescriptVersion,
            tsLocale: undefined,
          } satisfies WorkerMessage)
        })
        await init
        return worker
      }
      if (label === 'json')
        return new jsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less')
        return new cssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor')
        return new htmlWorker()
      if (label === 'typescript' || label === 'javascript')
        return new tsWorker()

      return new editorWorker()
    },
  }

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    strict: true,
  })

  monaco.languages.register({ id: 'vue', extensions: ['.vue'] })
  monaco.languages.register({ id: 'javascript', extensions: ['.js'] })
  monaco.languages.register({ id: 'typescript', extensions: ['.ts'] })
  monaco.languages.register({ id: 'json', extensions: ['.json'] })
  monaco.languages.register({ id: 'html', extensions: ['.html'] })

  const monacoLightTheme = convertShikiThemeToMonaco(themeLight, 'vs')
  const monacoDarkTheme = convertShikiThemeToMonaco(themeDark, 'vs-dark')

  // 應用自定義的背景顏色
  monacoDarkTheme.colors = {
    ...monacoDarkTheme.colors,
    'editor.background': '#00000000',
    'editor.lineHighlightBackground': '#00000000',
  }

  monaco.editor.defineTheme('theme-light', monacoLightTheme)
  monaco.editor.defineTheme('theme-dark', monacoDarkTheme)

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
  monaco.languages.onLanguage('vue', () => reloadLanguageTools(store))

  loadWasm()
}

function convertShikiThemeToMonaco(shikiTheme: ThemeRegistrationRaw, base: monaco.editor.BuiltinTheme): monaco.editor.IStandaloneThemeData {
  const rules: monaco.editor.ITokenThemeRule[] = shikiTheme.tokenColors?.flatMap((tokenColor) => {
    const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope]
    return scopes.map(scope => ({
      token: scope || '',
      foreground: tokenColor.settings.foreground,
      background: tokenColor.settings.background,
      fontStyle: tokenColor.settings.fontStyle,
    } as monaco.editor.ITokenThemeRule))
  }).filter((rule): rule is monaco.editor.ITokenThemeRule => !!rule.token) || []

  return {
    base,
    inherit: false,
    rules,
    colors: shikiTheme.colors || {},
    encodedTokensColors: [],
  }
}
