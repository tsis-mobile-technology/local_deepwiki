import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for API base URL
Object.defineProperty(global, 'location', {
  value: {
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000'
  }
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Override fetch to handle relative URLs
const originalFetch = global.fetch;
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  // Convert relative URLs to absolute URLs for testing
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `http://localhost:8000${input}`;
  }
  return originalFetch(input, init);
});

// Mock WebSocket with proper event handling
global.WebSocket = class WebSocket {
  constructor(url: string) {
    this.url = url;
    // Simulate immediate connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  url: string;
  readyState: number = 1; // OPEN
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  close() {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
  
  send(data: string) {
    // Simulate message echo for testing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
    }, 0);
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
} as any;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback,
}));

// Mock ResizeObserver  
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback,
}));