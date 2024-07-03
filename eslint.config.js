import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-undef': 'off', // 避免 auto imports 無法被 eslint 認識
  },
})
