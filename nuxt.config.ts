// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	compatibilityDate: "2024-07-04",
	modules: [
		"@vueuse/nuxt",
		"@unocss/nuxt",
		"@nuxt/content",
		"@nuxtjs/color-mode",
		"@nuxt/image",
		"@pinia/nuxt"
	],
	colorMode: {
		classSuffix: "",
	},
	typescript: {
		includeWorkspace: true,
	},
	nitro: {
		routeRules: {
			'*': {
				headers: {
					'Cross-Origin-Embedder-Policy': 'require-corp',
					'Cross-Origin-Opener-Policy': 'same-origin',
				}
			}
		}
	},
	vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
    }
  },
	content: {
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
});