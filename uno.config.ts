import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetUno,
} from "unocss";

export default defineConfig({
	shortcuts: {
		'border-base': 'border-gray-300 dark:border-gray-600',
		'bg-active': 'bg-gray/24 dark:bg-gray-800',
	},
	presets: [presetUno(), presetIcons(), presetAttributify()],
});
