import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    unocss: true,
    formatters: true,
    // rules: {
    //   'no-undef': 'off', // 避免 auto imports 無法被 eslint 認識
    // },
  },
  nuxt,
)
