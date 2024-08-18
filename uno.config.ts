import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
} from 'unocss'
import extractorMdc from '@unocss/extractor-mdc'

export default defineConfig({
  shortcuts: {
    'border-base': 'border-gray-200 dark:border-gray-800',
    'bg-active': 'bg-gray/24 dark:bg-gray-800',
    'bg-faded': 'bg-gray:5',
    'bg-base': 'bg-white dark:bg-[#050420]',
    'text-faded': 'text-gray6:100 dark:text-gray3:80',

    'bg-code': 'bg-gray/5',

    'bg-inline-code': 'bg-gray-100 dark:bg-gray-800/75',
    'border-inline-code': 'border-gray-200 dark:border-gray-700/75',

    'z-embedded-docs': 'z-100',
    'z-embedded-docs-raised': 'z-101',
    'z-splitter': 'z-102',
    'z-embedded-docs-close': 'z-103',
    'z-index-command-palette': 'z-200',
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: '#00c16a',
      },
    },
  },
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
    presetTypography(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: {
          name: 'DM Sans',
          weights: [200, 400, 600, 700],
        }, // 適合用於一般文本和界面設計中，提供現代、清晰的外觀
        mono: 'DM Mono', // 適合用於代碼顯示和需要精確對齊的文本中，便於閱讀和排版
      },
    }),
  ],
  extractors: [
    extractorMdc(),
  ],
  content: {
    filesystem: [
      './content/**/*.md',
    ],
  },
  transformers: [transformerDirectives()],
})
