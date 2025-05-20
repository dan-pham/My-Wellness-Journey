import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock Next.js image component
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: 'img', // Mock as just a string 'img'
  };
});

// Mock global fetch
global.fetch = jest.fn();

// Clean up any mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 