import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main application', () => {
    render(<App />);
    
    expect(screen.getByText('Welcome to DeepWiki')).toBeInTheDocument();
    expect(screen.getByText('Enter a GitHub repository URL to generate documentation.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
  });

  it('handles repository analysis workflow', async () => {
    // Mock API responses
    vi.mocked(axios.post).mockResolvedValue({
      data: { task_id: 'test-task-123' }
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      'http://localhost:8000/api/analyze',
      { repo_url: 'https://github.com/test/repo' }
    );
  });

  it('displays error message on API failure', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

    render(<App />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to start analysis/)).toBeInTheDocument();
    });
  });

  it('shows tabs after documentation is generated', async () => {
    render(<App />);
    
    // Simulate documentation being available
    const { reopen } = render(<App />);
    
    // Use store to simulate completed analysis
    const store = require('../../store').default;
    store.getState().setDocumentation('# Test Documentation\n\nThis is test documentation.');
    
    reopen();
    
    expect(screen.getByText('📝 문서')).toBeInTheDocument();
    expect(screen.getByText('🏗️아키텍처')).toBeInTheDocument();
    expect(screen.getByText('💬 Q&A')).toBeInTheDocument();
  });

  it('validates empty repository URL', () => {
    render(<App />);
    
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    // Button should be enabled even with empty input (validation happens on server)
    expect(button).toBeEnabled();
  });

  it('handles WebSocket connection simulation', async () => {
    // Mock WebSocket
    const mockWebSocket = {
      onopen: null as any,
      onmessage: null as any,
      onclose: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    // @ts-ignore
    global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

    vi.mocked(axios.post).mockResolvedValue({
      data: { task_id: 'test-task-123' }
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/status/test-task-123');
    });
  });

  it('updates analysis status through WebSocket', async () => {
    const mockWebSocket = {
      onopen: null as any,
      onmessage: null as any,
      onclose: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    // @ts-ignore
    global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

    vi.mocked(axios.post).mockResolvedValue({
      data: { task_id: 'test-task-123' }
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockWebSocket.onmessage).toBeDefined();
    });

    // Simulate WebSocket message
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({
        data: JSON.stringify({
          status: 'Analyzing files...'
        })
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Analyzing files...')).toBeInTheDocument();
    });
  });
});