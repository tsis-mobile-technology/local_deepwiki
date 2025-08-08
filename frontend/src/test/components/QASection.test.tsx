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

describe('QASection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('loads and displays suggestions', async () => {
    const mockSuggestions = ['What is this project?', 'How to install?'];
    vi.mocked(axios.get).mockResolvedValue({
      data: { suggestions: mockSuggestions }
    });

    render(<QASection repoName="test/repo" />);
    
    await waitFor(() => {
      expect(screen.getByText('What is this project?')).toBeInTheDocument();
      expect(screen.getByText('How to install?')).toBeInTheDocument();
    });
  });

  it('submits question and displays answer', async () => {
    // Mock suggestions
    vi.mocked(axios.get).mockResolvedValue({
      data: { suggestions: [] }
    });

    // Mock question response
    const mockResponse = {
      success: true,
      answer: 'This is a test answer',
      sources: [{ content: 'Source content', metadata: {} }]
    };
    vi.mocked(axios.post).mockResolvedValue({ data: mockResponse });

    render(<QASection repoName="test/repo" />);
    
    const input = screen.getByPlaceholderText('궁금한 것을 질문해보세요...');
    const button = screen.getByRole('button', { name: '질문하기' });
    
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('🤖 답변')).toBeInTheDocument();
      expect(screen.getByText('This is a test answer')).toBeInTheDocument();
      expect(screen.getByText('📚 참조된 문서')).toBeInTheDocument();
    });

    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      '/api/ask',
      {
        question: 'Test question',
        repo_name: 'test/repo'
      }
    );
  });

  it('handles API error gracefully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { suggestions: [] } });
    vi.mocked(axios.post).mockRejectedValue(new Error('API Error'));

    render(<QASection repoName="test/repo" />);
    
    const input = screen.getByPlaceholderText('궁금한 것을 질문해보세요...');
    const button = screen.getByRole('button', { name: '질문하기' });
    
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/질문 처리 중 오류가 발생했습니다/)).toBeInTheDocument();
    });
  });

  it('handles suggestion click', async () => {
    const mockSuggestions = ['What is this project?'];
    vi.mocked(axios.get).mockResolvedValue({
      data: { suggestions: mockSuggestions }
    });

    const mockResponse = {
      success: true,
      answer: 'Answer to suggested question',
      sources: []
    };
    vi.mocked(axios.post).mockResolvedValue({ data: mockResponse });

    render(<QASection repoName="test/repo" />);
    
    await waitFor(() => {
      expect(screen.getByText('What is this project?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('What is this project?'));
    
    await waitFor(() => {
      expect(screen.getByText('Answer to suggested question')).toBeInTheDocument();
    });

    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      '/api/ask',
      {
        question: 'What is this project?',
        repo_name: 'test/repo'
      }
    );
  });

  it('disables button when question is empty', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { suggestions: [] } });

    await act(async () => {
      render(<QASection repoName="test/repo" />);
    });
    
    const button = screen.getByRole('button', { name: '질문하기' });
    expect(button).toBeDisabled();
  });

  it('shows loading state during question submission', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { suggestions: [] } });
    
    // Mock delayed response
    vi.mocked(axios.post).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true, answer: 'Answer', sources: [] } }), 100))
    );

    render(<QASection repoName="test/repo" />);
    
    const input = screen.getByPlaceholderText('궁금한 것을 질문해보세요...');
    const button = screen.getByRole('button', { name: '질문하기' });
    
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(button);
    
    expect(screen.getByText('생각중...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('질문하기')).toBeInTheDocument();
    });
  });
});