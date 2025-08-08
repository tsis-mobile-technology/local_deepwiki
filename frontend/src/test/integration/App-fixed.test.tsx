import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import App from '../../App';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mock Diagram</svg>' }),
  },
}));

// Mock fetch for store API calls
global.fetch = vi.fn();

describe('App Integration Fixed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch mock for history API
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/analyses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });
  });

  it('renders the main application', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByText('DeepWiki')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered GitHub Documentation Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
  });

  it('handles repository analysis workflow', async () => {
    // Mock API responses
    vi.mocked(fetch).mockImplementation((url, options) => {
      if (typeof url === 'string') {
        if (url.includes('/api/analyze')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ task_id: 'test-task-123' })
          } as Response);
        }
        if (url.includes('/api/analyses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

    await act(async () => {
      render(<App />);
    });
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    
    // Find button by text content (including emoji)
    const button = screen.getByRole('button', { name: /Analyze/ });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Should transition to loading state
      expect(screen.getByText(/Starting analysis/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('updates analysis status through WebSocket', async () => {
    // Mock WebSocket messages
    const mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1,
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onclose: null as ((event: CloseEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    // Mock successful analysis API call
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/analyze')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ task_id: 'test-task-123' })
          } as Response);
        }
        if (url.includes('/api/analyses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

    await act(async () => {
      render(<App />);
    });
    
    // First verify components are present
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze/ })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: /Analyze/ });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
      fireEvent.click(button);
    });

    // Wait for transition to loading state
    await waitFor(() => {
      expect(screen.getByText(/Starting analysis/)).toBeInTheDocument();
    });

    // Simulate WebSocket messages
    await act(async () => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            task_id: 'test-task-123',
            status: 'processing',
            progress: 'Analyzing repository structure...'
          })
        }));
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Analyzing repository structure/)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch to reject for analysis, but allow history fetch
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/analyze')) {
          return Promise.reject(new Error('Network error'));
        }
        if (url.includes('/api/analyses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

    await act(async () => {
      render(<App />);
    });
    
    // Verify components are present initially
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze/ })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: /Analyze/ });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Should show error and return to home view
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Should be back on home page after error
      expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});