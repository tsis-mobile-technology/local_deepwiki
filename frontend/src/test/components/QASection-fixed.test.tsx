import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import QASection from '../../components/QASection';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('QASection Fixed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock for suggestions API
    vi.mocked(axios.get).mockResolvedValue({
      data: { suggestions: [] }
    });
  });

  it('shows message when no repo name provided', () => {
    render(<QASection repoName="" />);
    
    expect(screen.getByText(/문서 분석이 완료되면 질문할 수 있습니다/)).toBeInTheDocument();
  });

  it('renders QA interface with repo name', async () => {
    const mockSuggestions = ['What is this project?', 'How to install?'];
    vi.mocked(axios.get).mockResolvedValue({
      data: { suggestions: mockSuggestions }
    });

    await act(async () => {
      render(<QASection repoName="test/repo" />);
    });
    
    expect(screen.getByText('💬 AI와 대화하기')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('궁금한 것을 질문해보세요...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '질문하기' })).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(axios.post).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(<QASection repoName="test/repo" />);
    });

    const input = screen.getByPlaceholderText('궁금한 것을 질문해보세요...');
    const button = screen.getByRole('button', { name: '질문하기' });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test question' } });
    });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Check that error handling occurs (component should show error state)
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('disables button when question is empty', async () => {
    await act(async () => {
      render(<QASection repoName="test/repo" />);
    });

    const button = screen.getByRole('button', { name: '질문하기' });
    expect(button).toBeDisabled();
  });

  it('enables button when question is entered', async () => {
    await act(async () => {
      render(<QASection repoName="test/repo" />);
    });

    const input = screen.getByPlaceholderText('궁금한 것을 질문해보세요...');
    const button = screen.getByRole('button', { name: '질문하기' });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test question' } });
    });

    expect(button).not.toBeDisabled();
  });
});