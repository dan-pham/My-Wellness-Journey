import { TextEncoder, TextDecoder } from "util";

// Add TextEncoder and TextDecoder to global
global.TextEncoder = TextEncoder;
// @ts-ignore - TypeScript doesn't like assigning TextDecoder to global
global.TextDecoder = TextDecoder; 