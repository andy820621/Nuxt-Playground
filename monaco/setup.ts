/* eslint-disable no-restricted-globals */
/* eslint-disable new-cap */
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

// TODO: material-theme-palenight's format it not compatible with monaco
// import themeDark from 'shiki/themes/vitesse-dark.mjs'
// import themeLight from 'shiki/themes/vitesse-light.mjs'
import themeDark from 'theme-vitesse/themes/vitesse-black.json'
import themeLight from 'theme-vitesse/themes/vitesse-light.json'

import vueWorker from './vue.worker?worker'
import { loadWasm, reloadLanguageTools } from './env'

export function initMonaco(ctx: PlaygroundStore) {
  self.MonacoEnvironment = {
    async getWorker(_: any, label: string) {
      switch (label) {
        case 'typescript':
        case 'javascript':
        case 'vue':
          return new vueWorker()
        case 'json':
          return new jsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker()

        default:
          return new editorWorker()
      }
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

  // const monacoLightTheme = convertShikiThemeToMonaco(themeLight, 'vs')
  // const monacoDarkTheme = convertShikiThemeToMonaco(themeDark, 'vs-dark')

  // 應用自定義的背景顏色
  // monacoDarkTheme.colors = {
  //   ...monacoDarkTheme.colors,
  //   'editor.background': '#00000000',
  //   'editor.lineHighlightBackground': '#00000000',
  // }

  // monaco.editor.defineTheme('theme-light', monacoLightTheme)
  // monaco.editor.defineTheme('theme-dark', monacoDarkTheme)

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    strict: true,
  })

  const darkColors = (themeDark as any).colors as Record<string, string>
  darkColors['editor.background'] = '#00000000'
  darkColors['editor.lineHighlightBackground'] = '#00000000'

  monaco.editor.defineTheme('theme-light', themeLight as any)
  monaco.editor.defineTheme('theme-dark', themeDark as any)

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
  monaco.languages.onLanguage('vue', () => reloadLanguageTools(ctx))

  loadWasm()
}

// function convertShikiThemeToMonaco(shikiTheme: ThemeRegistrationRaw, base: monaco.editor.BuiltinTheme): monaco.editor.IStandaloneThemeData {
//   const rules: monaco.editor.ITokenThemeRule[] = shikiTheme.tokenColors?.flatMap((tokenColor) => {
//     const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope]
//     return scopes.map(scope => ({
//       token: scope || '',
//       foreground: tokenColor.settings.foreground,
//       background: tokenColor.settings.background,
//       fontStyle: tokenColor.settings.fontStyle,
//     } as monaco.editor.ITokenThemeRule))
//   }).filter((rule): rule is monaco.editor.ITokenThemeRule => !!rule.token) || []

//   return {
//     base,
//     inherit: false,
//     rules,
//     colors: shikiTheme.colors || {},
//     encodedTokensColors: [],
//   }
// }
