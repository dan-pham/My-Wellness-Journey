// Set environment variables for Jest
process.env.SUPPRESS_JEST_WARNINGS = "true";
process.env.SUPPRESS_MONGOOSE_DEPRECATION_WARNINGS = "true";

// Tell Mongoose to skip the warning about Jest environment
if (typeof global.mongoose === 'object') {
  global.mongoose._skipJestEnvironmentCheck = true;
} 