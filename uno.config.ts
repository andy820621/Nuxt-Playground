import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetUno,
	presetWebFonts,
	presetTypography,
	transformerDirectives,
} from "unocss";

export default defineConfig({
	shortcuts: {
		'border-base': 'border-gray-200 dark:border-gray-800',
		'bg-active': 'bg-gray/24 dark:bg-gray-800',
		'bg-base': 'bg-white dark:bg-[#050420]',
	},
	presets: [
		presetUno(), 
		presetIcons(), 
		presetAttributify(),
		presetTypography(),
		presetWebFonts({
			provider: 'bunny',
			fonts: {
				'sans': 'DM Sans', // 適合用於一般文本和界面設計中，提供現代、清晰的外觀
				'mono': 'DM Mono', // 適合用於代碼顯示和需要精確對齊的文本中，便於閱讀和排版
			},
		})
	],
	transformers: [transformerDirectives()],
});
