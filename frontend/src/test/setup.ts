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

// Mock fetch globally
global.fetch = vi.fn();

// Create a proper fetch mock that handles relative URLs
const originalFetch = global.fetch as any;
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  // Convert relative URLs to absolute URLs for testing
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `http://localhost:8000${input}`;
  }
  
  // Default successful responses for common endpoints
  if (typeof input === 'string') {
    if (input.includes('/api/analyze') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ task_id: 'test-task-123' })
      } as Response);
    }
    if (input.includes('/api/analyses')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      } as Response);
    }
    if (input.includes('/api/suggestions/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] })
      } as Response);
    }
    if (input.includes('/api/result/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'completed',
          result: { result: 'Test documentation', architecture: null },
          repo_name: 'test/repo'
        })
      } as Response);
    }
  }
  
  return originalFetch(input, init);
});

// Mock WebSocket with proper event handling
global.WebSocket = class WebSocket {
  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
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
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
  
  send(data: string) {
    // Simulate message echo for testing
    setTimeout(() => {
      if (this.onmessage && this.readyState === 1) {
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