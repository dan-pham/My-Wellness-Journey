// This file needs to be loaded before any mongoose imports
// It suppresses the mongoose warnings in Jest environment

// Set environment variable
process.env.SUPPRESS_MONGOOSE_WARNINGS = "true";

// Add this as soon as possible before any mongoose imports
Object.defineProperty(global, 'SUPPRESS_MONGOOSE_WARNINGS', {
  value: true,
  configurable: false,
  writable: false,
});

// Mock console.warn to suppress the specific mongoose warning
const originalWarn = console.warn;
console.warn = function(message) {
  // Skip mongoose warnings about jest environment
  if (typeof message === 'string' && 
      (message.includes('mongoose') || message.includes('Mongoose')) && 
      message.includes('jsdom')) {
    return;
  }
  originalWarn.apply(console, arguments);
}; 