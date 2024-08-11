import { execaSync } from 'execa'
import { compression } from 'vite-plugin-compression2'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-04',
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/content',
    '@nuxtjs/color-mode',
    '@nuxt/image',
    '@pinia/nuxt',
    'floating-vue/nuxt',
    '@nuxtjs/seo',
    '@nuxt/icon',

    // local
    '~/modules/template-loader',
    '~/modules/nuxt-link',
  ],
  icon: {
    serverBundle: {
      collections: ['ph', 'logos', 'file-icons', 'devicon', 'uim', 'svg-spinners', 'simple-icons', 'carbon'],
      // externalizeIconsJson: true,
    },
  },
  colorMode: {
    classSuffix: '',
  },
  site: {
    url: 'https://nuxt-tutorial-playground.netlify.app/',
    name: 'Nuxt Tutorial Playground',
  },
  ogImage: {
    debug: true,
    defaults: {
      component: 'NuxtSeo',
      props: {
        colorMode: 'dark',
      },
    },
    componentOptions: {
      global: true,
    },
  },
  app: {
    head: {
      titleTemplate: '%s - Nuxt Tutorial',
      htmlAttrs: {
        lang: 'en-US',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
  typescript: {
    includeWorkspace: true,
    tsConfig: {
      include: [
        '../content/**/.template/**/*.ts',
      ],
    },
  },
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/**': {
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },
  features: {
    inlineStyles: false,
  },
  runtimeConfig: {
    public: {
      buildTime: Date.now(),
      gitSha: execaSync('git', ['rev-parse', 'HEAD']).stdout.trim(),
    },
  },
  vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // if (id.includes('node_modules')) {
            //   if (id.includes('@iconify')) {
            //     if (id.includes('simple-icons')) {
            //       return 'iconify-simple-icons'
            //     }
            //     if (id.includes('devicon')) {
            //       return 'iconify-devicon'
            //     }
            //     if (id.includes('logos')) {
            //       return 'iconify-logos'
            //     }
            //     if (id.includes('carbon')) {
            //       return 'iconify-carbon'
            //     }
            //   }
            //   return id.toString().split('node_modules/')[1].split('/')[0].toString()
            // }
            if (id.includes('node_modules')) {
              // 將 node_modules 中的模塊分開打包
              return id
                .toString()
                .split('node_modules/')[1]
                .split('/')[0]
                .toString()
            }
          },
        },
      },
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    optimizeDeps: {
      include: [
        'monaco-editor/esm/vs/editor/editor.worker',
        'monaco-editor-core/esm/vs/editor/editor.worker',
        'typescript/lib/tsserverlibrary',
        '@vue/language-service',
        '@volar/monaco/worker',
        'typescript',
      ],
    },
    plugins: [compression()],
  },
  content: {
    documentDriven: true,
    highlight: {
      theme: {
        default: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    },
    markdown: {
      remarkPlugins: [
        'remark-external-links',
      ],
    },
  },
  devtools: {
    enabled: true,
  },
})
