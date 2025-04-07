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
				primary: {
					heading: "#2B4C7E",
					subheading: "#4A4A4A",
					accent: "#3A8C96",
				},
				gradient: {
					start: "#E8F4FF",
					end: "#FFFFFF",
				},
				neutral: {
					white: "#FFFFFF",
					annotation: "#6C6C6C",
					body: "#D9D9D9",
					border: "#E0E0E0",
					placeholder: "#F5F5F5",
					shadow: "rgba(0, 0, 0, 0.05)",
				},
			},
		},
	},
	plugins: [],
};
