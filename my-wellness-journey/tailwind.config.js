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
			typography: (theme) => ({
				DEFAULT: {
					css: {
						color: theme('colors.primary-subheading'),
						h1: {
							color: theme('colors.primary-heading'),
							fontWeight: '700',
						},
						h2: {
							color: theme('colors.primary-heading'),
							fontWeight: '600',
						},
						h3: {
							color: theme('colors.primary-heading'),
							fontWeight: '600',
						},
						a: {
							color: theme('colors.primary-accent'),
							'&:hover': {
								color: theme('colors.primary-accent'),
								opacity: '0.8',
							},
						},
						ul: {
							listStyleType: 'disc',
							marginTop: '1em',
							marginBottom: '1em',
							paddingLeft: '1.5em',
						},
						ol: {
							listStyleType: 'decimal',
							marginTop: '1em',
							marginBottom: '1em',
							paddingLeft: '1.5em',
						},
						li: {
							marginTop: '0.5em',
							marginBottom: '0.5em',
						},
						p: {
							marginTop: '1.25em',
							marginBottom: '1.25em',
						},
					},
				},
			}),
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
};
