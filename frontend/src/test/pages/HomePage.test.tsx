import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import HomePage from '../../pages/HomePage';
import useAppStore from '../../store';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

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
    useAppStore.setState({
      repoUrl: '',
      analysisStatus: '',
      documentation: '',
      isLoading: false,
      error: null,
    });
  });

  it('renders welcome message and input form', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Welcome to DeepWiki')).toBeInTheDocument();
    expect(screen.getByText('Enter a GitHub repository URL to generate documentation.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
  });

  it('shows loading state when analysis is in progress', () => {
    useAppStore.setState({
      isLoading: true,
      analysisStatus: 'Analyzing repository...',
    });

    render(<HomePage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing repository...')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    useAppStore.setState({
      error: 'Failed to analyze repository',
    });

    render(<HomePage />);
    
    expect(screen.getByText('Error: Failed to analyze repository')).toBeInTheDocument();
  });

  it('shows documentation when available', () => {
    useAppStore.setState({
      documentation: '# Test Documentation\n\nThis is a test.',
    });

    render(<HomePage />);
    
    expect(screen.getByText('Generated Documentation')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('starts analysis when form is submitted', async () => {
    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      data: { task_id: 'test-task-id' }
    });

    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        { repo_url: 'https://github.com/test/repo' }
      );
    });
  });

  it('handles API error gracefully', async () => {
    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockRejectedValue(new Error('Network error'));

    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to start analysis/)).toBeInTheDocument();
    });
  });

  it('updates store state during analysis flow', async () => {
    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      data: { task_id: 'test-task-id' }
    });

    render(<HomePage />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: 'Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    // Check that store state was updated
    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.repoUrl).toBe('https://github.com/test/repo');
      expect(state.isLoading).toBe(true);
      expect(state.analysisStatus).toContain('Analysis started with task ID: test-task-id');
      expect(state.error).toBe(null);
      expect(state.documentation).toBe('');
    });
  });
});