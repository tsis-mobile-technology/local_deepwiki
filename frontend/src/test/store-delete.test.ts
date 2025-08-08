import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../store';

// Mock fetch globally
global.fetch = vi.fn();

describe('Store Delete Functionality', () => {
  beforeEach(() => {
    // Reset store state before each test
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
      selectedItems: new Set(),
      isSelectionMode: false,
      isDeleting: false,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Selection Mode', () => {
    it('toggles selection mode', () => {
      const { toggleSelectionMode } = useStore.getState();
      
      expect(useStore.getState().isSelectionMode).toBe(false);
      
      toggleSelectionMode();
      
      expect(useStore.getState().isSelectionMode).toBe(true);
      expect(useStore.getState().selectedItems.size).toBe(0);
    });

    it('clears selection when entering selection mode', () => {
      // Set some initial selection
      useStore.setState({ 
        selectedItems: new Set(['item1', 'item2']),
        isSelectionMode: true 
      });
      
      const { toggleSelectionMode } = useStore.getState();
      
      // Toggle off and back on
      toggleSelectionMode(); // Turn off
      toggleSelectionMode(); // Turn back on
      
      expect(useStore.getState().selectedItems.size).toBe(0);
    });
  });

  describe('Item Selection', () => {
    it('toggles item selection', () => {
      const { toggleItemSelection } = useStore.getState();
      
      // Add item
      toggleItemSelection('item1');
      
      expect(useStore.getState().selectedItems.has('item1')).toBe(true);
      
      // Remove item
      toggleItemSelection('item1');
      
      expect(useStore.getState().selectedItems.has('item1')).toBe(false);
    });

    it('handles multiple item selections', () => {
      const { toggleItemSelection } = useStore.getState();
      
      toggleItemSelection('item1');
      toggleItemSelection('item2');
      toggleItemSelection('item3');
      
      const selectedItems = useStore.getState().selectedItems;
      expect(selectedItems.has('item1')).toBe(true);
      expect(selectedItems.has('item2')).toBe(true);
      expect(selectedItems.has('item3')).toBe(true);
      expect(selectedItems.size).toBe(3);
    });

    it('selects all items', () => {
      // Set mock history
      const mockHistory = [
        { id: 'item1', repo_name: 'test/repo1', status: 'completed', updated_at: '2024-01-01', commit_hash: 'abc' },
        { id: 'item2', repo_name: 'test/repo2', status: 'completed', updated_at: '2024-01-02', commit_hash: 'def' },
        { id: 'item3', repo_name: 'test/repo3', status: 'pending', updated_at: '2024-01-03', commit_hash: 'ghi' }
      ];
      
      useStore.setState({ history: mockHistory });
      
      const { selectAllItems } = useStore.getState();
      selectAllItems();
      
      const selectedItems = useStore.getState().selectedItems;
      expect(selectedItems.size).toBe(3);
      expect(selectedItems.has('item1')).toBe(true);
      expect(selectedItems.has('item2')).toBe(true);
      expect(selectedItems.has('item3')).toBe(true);
    });

    it('clears all selections', () => {
      // Set initial selection
      useStore.setState({ 
        selectedItems: new Set(['item1', 'item2', 'item3'])
      });
      
      const { clearSelection } = useStore.getState();
      clearSelection();
      
      expect(useStore.getState().selectedItems.size).toBe(0);
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => {
      // Mock fetch for delete operations
      vi.mocked(fetch).mockClear();
    });

    it('does not delete when no items are selected', async () => {
      const { deleteSelectedItems } = useStore.getState();
      
      await deleteSelectedItems();
      
      expect(fetch).not.toHaveBeenCalled();
      expect(useStore.getState().isDeleting).toBe(false);
    });

    it('successfully deletes selected items', async () => {
      // Mock successful delete response
      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              deleted_count: 2,
              deleted_tasks: ['item1', 'item2'],
              failed_deletes: []
            })
          } as Response);
        }
        
        // Mock history fetch
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method !== 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
        
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      // Set selected items
      useStore.setState({ 
        selectedItems: new Set(['item1', 'item2'])
      });

      const { deleteSelectedItems } = useStore.getState();
      
      await deleteSelectedItems();

      // Verify delete request was made
      expect(fetch).toHaveBeenCalledWith('/api/analyses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_ids: ['item1', 'item2'] })
      });

      // Verify state is updated
      const state = useStore.getState();
      expect(state.selectedItems.size).toBe(0);
      expect(state.isSelectionMode).toBe(false);
      expect(state.error).toBe(null);
    });

    it('handles partial deletion failures', async () => {
      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              deleted_count: 1,
              deleted_tasks: ['item1'],
              failed_deletes: [{ id: 'item2', reason: 'Not found' }]
            })
          } as Response);
        }
        
        // Mock history fetch
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method !== 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }
        
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      useStore.setState({ 
        selectedItems: new Set(['item1', 'item2'])
      });

      const { deleteSelectedItems } = useStore.getState();
      
      await deleteSelectedItems();

      // Should show partial success message
      const state = useStore.getState();
      expect(state.error).toContain('1 items deleted, 1 failed to delete');
      expect(state.selectedItems.size).toBe(0);
      expect(state.isSelectionMode).toBe(false);
    });

    it('handles delete API errors', async () => {
      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              detail: 'Internal server error'
            })
          } as Response);
        }
        
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      useStore.setState({ 
        selectedItems: new Set(['item1'])
      });

      const { deleteSelectedItems } = useStore.getState();
      
      await deleteSelectedItems();

      // Should show error message
      const state = useStore.getState();
      expect(state.error).toContain('Internal server error');
      expect(state.isDeleting).toBe(false);
      // Selection should remain as delete failed
      expect(state.selectedItems.size).toBe(1);
    });

    it('handles network errors during deletion', async () => {
      vi.mocked(fetch).mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/api/analyses') && options?.method === 'DELETE') {
          return Promise.reject(new Error('Network error'));
        }
        
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      useStore.setState({ 
        selectedItems: new Set(['item1'])
      });

      const { deleteSelectedItems } = useStore.getState();
      
      await deleteSelectedItems();

      // Should show error message
      const state = useStore.getState();
      expect(state.error).toContain('Network error');
      expect(state.isDeleting).toBe(false);
    });

    it('sets isDeleting state during deletion', async () => {
      let resolvePromise: (value: any) => void;
      const deletePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(fetch).mockImplementation(() => deletePromise as any);

      useStore.setState({ 
        selectedItems: new Set(['item1'])
      });

      const { deleteSelectedItems } = useStore.getState();
      
      // Start deletion (don't await)
      const deletionPromise = deleteSelectedItems();
      
      // Check that isDeleting is true
      expect(useStore.getState().isDeleting).toBe(true);
      
      // Resolve the mock promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          deleted_count: 1,
          deleted_tasks: ['item1'],
          failed_deletes: []
        })
      });
      
      // Wait for deletion to complete
      await deletionPromise;
      
      // Check that isDeleting is false
      expect(useStore.getState().isDeleting).toBe(false);
    });
  });

  describe('Reset State', () => {
    it('clears selection state on reset', () => {
      // Set some selection state
      useStore.setState({
        selectedItems: new Set(['item1', 'item2']),
        isSelectionMode: true,
        isDeleting: true
      });

      const { resetState } = useStore.getState();
      resetState();

      const state = useStore.getState();
      expect(state.selectedItems.size).toBe(0);
      expect(state.isSelectionMode).toBe(false);
      expect(state.isDeleting).toBe(false);
    });
  });
});
