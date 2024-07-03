// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	compatibilityDate: "2024-07-04",
	modules: [
		"@vueuse/nuxt",
		"@unocss/nuxt",
		"@nuxt/content",
		"@nuxtjs/color-mode",
	],
	colorMode: {
		classSuffix: "",
	}
});
