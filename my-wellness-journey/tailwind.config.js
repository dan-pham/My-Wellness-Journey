/** @type {import('tailwindcss').Config} */

module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx}",
		"./src/components/**/*.{js,ts,jsx,tsx}",
		"./src/app/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				"primary-heading": "#2B4C7E",
				"primary-subheading": "#4A4A4A",
				"primary-accent": "#3A8C96",
				"gradient-start": "#E8F4FF",
				"gradient-end": "#FFFFFF",
			},
			spacing: {
				section: "5rem",
			},
			boxShadow: {
				card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)",
			},
		},
	},
	plugins: [],
};
