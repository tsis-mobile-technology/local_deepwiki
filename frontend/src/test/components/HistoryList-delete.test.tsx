import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryList from '../../components/HistoryList';
import { useStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn()
}));

const mockHistory = [
  {
    id: 'task-1',
    repo_name: 'user/repo1',
    status: 'completed',
    updated_at: new Date().toISOString(),
    commit_hash: 'abc123'
  },
  {
    id: 'task-2', 
    repo_name: 'user/repo2',
    status: 'pending',
    updated_at: new Date().toISOString(),
    commit_hash: 'def456'
  }
];

describe('HistoryList Delete Functionality', () => {
  const mockFunctions = {
    fetchResult: vi.fn(),
    toggleSelectionMode: vi.fn(),
    toggleItemSelection: vi.fn(),
    selectAllItems: vi.fn(),
    clearSelection: vi.fn(),
    deleteSelectedItems: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default store state
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: false,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });
  });

  it('renders edit button when not in selection mode', () => {
    render(<HistoryList />);
    
    expect(screen.getByText('편집')).toBeInTheDocument();
    expect(screen.queryByText('완료')).not.toBeInTheDocument();
  });

  it('toggles to selection mode when edit button is clicked', () => {
    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('편집'));
    
    expect(mockFunctions.toggleSelectionMode).toHaveBeenCalled();
  });

  it('shows selection controls in selection mode', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('전체선택')).toBeInTheDocument();
    expect(screen.getByText('선택해제')).toBeInTheDocument();
    expect(screen.getByText('0개 선택됨')).toBeInTheDocument();
  });

  it('shows delete button when items are selected', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    expect(screen.getByText('1개 항목 삭제')).toBeInTheDocument();
  });

  it('calls selectAllItems when select all button is clicked', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('전체선택'));
    
    expect(mockFunctions.selectAllItems).toHaveBeenCalled();
  });

  it('calls clearSelection when clear selection button is clicked', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('선택해제'));
    
    expect(mockFunctions.clearSelection).toHaveBeenCalled();
  });

  it('shows checkboxes on cards in selection mode', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('highlights selected items', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('opens delete dialog when delete button is clicked', async () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    fireEvent.click(screen.getByText('1개 항목 삭제'));
    
    await waitFor(() => {
      expect(screen.getByText('선택한 항목 삭제')).toBeInTheDocument();
      expect(screen.getByText(/선택한 1개의 분석 결과를 삭제하시겠습니까/)).toBeInTheDocument();
    });
  });

  it('calls deleteSelectedItems when deletion is confirmed', async () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    // Open delete dialog
    fireEvent.click(screen.getByText('1개 항목 삭제'));
    
    await waitFor(() => {
      expect(screen.getByText('선택한 항목 삭제')).toBeInTheDocument();
    });
    
    // Confirm deletion
    const deleteButton = screen.getByRole('button', { name: /삭제/ });
    fireEvent.click(deleteButton);
    
    expect(mockFunctions.deleteSelectedItems).toHaveBeenCalled();
  });

  it('closes delete dialog when cancelled', async () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    // Open delete dialog
    fireEvent.click(screen.getByText('1개 항목 삭제'));
    
    await waitFor(() => {
      expect(screen.getByText('선택한 항목 삭제')).toBeInTheDocument();
    });
    
    // Cancel
    fireEvent.click(screen.getByText('취소'));
    
    await waitFor(() => {
      expect(screen.queryByText('선택한 항목 삭제')).not.toBeInTheDocument();
    });
  });

  it('shows loading state when deleting', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(['task-1']),
      isDeleting: true,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    expect(screen.getByText('삭제 중...')).toBeInTheDocument();
  });

  it('toggles item selection when checkbox is clicked in selection mode', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(firstCheckbox);
    
    expect(mockFunctions.toggleItemSelection).toHaveBeenCalledWith('task-1');
  });

  it('calls fetchResult when item is clicked in normal mode', () => {
    render(<HistoryList />);
    
    // Click on the first repository card
    const repoCard = screen.getByText('repo1').closest('[role="button"], .MuiPaper-root');
    if (repoCard) {
      fireEvent.click(repoCard);
    }
    
    expect(mockFunctions.fetchResult).toHaveBeenCalledWith('task-1');
  });

  it('calls toggleItemSelection when item is clicked in selection mode', () => {
    vi.mocked(useStore).mockReturnValue({
      history: mockHistory,
      isSelectionMode: true,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    // Click on the first repository card
    const repoCard = screen.getByText('repo1').closest('[role="button"], .MuiPaper-root');
    if (repoCard) {
      fireEvent.click(repoCard);
    }
    
    expect(mockFunctions.toggleItemSelection).toHaveBeenCalledWith('task-1');
  });

  it('shows empty state when no history items', () => {
    vi.mocked(useStore).mockReturnValue({
      history: [],
      isSelectionMode: false,
      selectedItems: new Set(),
      isDeleting: false,
      error: null,
      ...mockFunctions
    });

    render(<HistoryList />);
    
    expect(screen.getByText('분석 기록이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('GitHub 리포지토리를 분석해보세요!')).toBeInTheDocument();
  });
});  
