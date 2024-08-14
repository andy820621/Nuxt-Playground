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
      component: 'OgImageDocs',
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
  features: {
    inlineStyles: false,
  },
  runtimeConfig: {
    public: {
      buildTime: Date.now(),
      gitSha: execaSync('git', ['rev-parse', 'HEAD']).stdout.trim(),
    },
    app: {
      devtools: {
        iframeProps: {
          allow: 'cross-origin-isolated',
          credentialless: true,
        },
      },
    },
  },
  devtools: {
    enabled: true,
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
  vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
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
        'unified',
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
    experimental: {
      search: {},
    },
  },

})
