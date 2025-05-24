module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	setupFiles: ["<rootDir>/tests/mongooseSetup.js", "<rootDir>/tests/setupPolyfills.ts"],
	setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	modulePaths: ["<rootDir>"],
	transform: {
		"^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
	},
	testMatch: ["**/tests/**/*.test.(ts|tsx|js|jsx)"],
	projects: [
		// Backend tests configuration
		{
			displayName: "backend",
			testEnvironment: "node",
			testMatch: [
				"**/tests/api/**/*.test.(ts|js)",
				"**/tests/middleware/**/*.test.(ts|js)",
				"**/tests/models/**/*.test.(ts|js)",
				"**/tests/utils/**/*.test.(ts|js)",
			],
			setupFiles: ["<rootDir>/tests/mongooseSetup.js", "<rootDir>/tests/setupPolyfills.ts"],
			setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
			moduleNameMapper: {
				"^@/(.*)$": "<rootDir>/src/$1",
			},
			modulePaths: ["<rootDir>"],
			transform: {
				"^.+\\.(ts|js)$": "babel-jest",
			},
		},
		// Frontend tests configuration
		{
			displayName: "frontend",
			testEnvironment: "jsdom",
			testMatch: [
				"**/tests/components/**/*.test.(ts|tsx|js|jsx)",
				"**/tests/hooks/**/*.test.(ts|tsx|js|jsx)",
				"**/tests/pages/**/*.test.(ts|tsx|js|jsx)",
				"**/tests/stores/**/*.test.(ts|tsx|js|jsx)",
				"**/tests/integration/**/*.test.(ts|tsx|js|jsx)",
			],
			setupFiles: ["<rootDir>/tests/mongooseSetup.js"],
			setupFilesAfterEnv: ["<rootDir>/tests/setupReact.ts"],
			moduleNameMapper: {
				"^@/(.*)$": "<rootDir>/src/$1",
				"\\.(css|less|scss|sass)$": "identity-obj-proxy",
			},
			modulePaths: ["<rootDir>"],
			transform: {
				"^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
			},
		},
		// Lib tests configuration
		{
			displayName: "lib",
			testEnvironment: "jsdom",
			testMatch: ["**/tests/lib/**/*.test.(ts|js)"],
			setupFiles: ["<rootDir>/tests/mongooseSetup.js", "<rootDir>/tests/setupPolyfills.ts"],
			setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
			moduleNameMapper: {
				"^@/(.*)$": "<rootDir>/src/$1",
			},
			modulePaths: ["<rootDir>"],
			transform: {
				"^.+\\.(ts|js)$": "babel-jest",
			},
		},
	],
};
