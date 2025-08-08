import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../../pages/HomePage';
import { useStore } from '../../store';

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

// Mock rehype-highlight
vi.mock('rehype-highlight', () => ({
  default: {},
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useStore.setState({
      currentView: 'home',
      loading: false,
      error: null,
      progress: '',
      taskId: null,
      documentation: null,
      architecture: null,
      repoName: '',
      history: [],
    });
  });

  it('renders welcome message and input form', () => {
    render(<HomePage />);
    
    // Updated to match actual HomePage component text
    expect(screen.getByText('DeepWiki')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🔍 Analyze' })).toBeInTheDocument();
  });

  it('shows loading state when analysis is in progress', () => {
    useStore.setState({
      loading: true,
      progress: 'Analyzing repository...',
      currentView: 'loading'
    });

    render(<HomePage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    useStore.setState({
      error: 'Failed to analyze repository',
      currentView: 'home'
    });

    render(<HomePage />);
    
    expect(screen.getByText(/Failed to analyze repository/)).toBeInTheDocument();
  });

  it('shows documentation when available', () => {
    useStore.setState({
      documentation: '# Test Documentation\n\nThis is a test.',
      currentView: 'docs',
      repoName: 'test/repo'
    });

    render(<HomePage />);
    
    // This test needs to be updated based on actual component behavior
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('starts analysis when form is submitted', async () => {
    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: '🔍 Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    // The store should handle the submission via fetch
    await waitFor(() => {
      const state = useStore.getState();
      expect(state.loading).toBe(true);
      expect(state.currentView).toBe('loading');
    });
  });

  it('handles API error gracefully', async () => {
    // Mock fetch to return error response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Network error' })
    });
    global.fetch = mockFetch;

    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: '🔍 Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      const state = useStore.getState();
      expect(state.error).toContain('Failed to start analysis');
      expect(state.currentView).toBe('home');
    });
  });

  it('updates store state during analysis flow', async () => {
    // Reset fetch mock to use the default one from setup.ts
    const originalFetch = global.fetch;
    const mockFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        input = `http://localhost:8000${input}`;
      }
      
      if (typeof input === 'string' && input.includes('/api/analyze') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ task_id: 'test-task-123' })
        } as Response);
      }
      
      return originalFetch(input, init);
    });
    global.fetch = mockFetch;

    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: '🔍 Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    // Check that store state was updated (using the mock response)
    await waitFor(() => {
      const state = useStore.getState();
      expect(state.loading).toBe(true);
      expect(state.taskId).toBe('test-task-123');
      expect(state.error).toBe(null);
      expect(state.currentView).toBe('loading');
    });
  });
});