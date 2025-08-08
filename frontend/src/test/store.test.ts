import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';

describe('Zustand Store', () => {
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
    });
  });

  it('has initial state', () => {
    const state = useStore.getState();
    
    expect(state.currentView).toBe('home');
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.progress).toBe('');
    expect(state.taskId).toBe(null);
    expect(state.documentation).toBe(null);
    expect(state.architecture).toBe(null);
    expect(state.repoName).toBe('');
    expect(state.history).toEqual([]);
  });

  it('can submit repo URL', async () => {
    const { submitRepoUrl } = useStore.getState();
    
    // Test that the function exists and is callable
    expect(typeof submitRepoUrl).toBe('function');
    
    // We can't easily test the full async behavior without mocking fetch,
    // but we can test that it sets loading state initially
    const promise = submitRepoUrl('https://github.com/test/repo');
    
    // Check that loading state was set
    expect(useStore.getState().loading).toBe(true);
    expect(useStore.getState().currentView).toBe('loading');
    
    // Wait for the promise to complete (will fail due to mock fetch)
    await expect(promise).resolves.toBeUndefined();
  });

  it('can reset state', () => {
    // First set some non-default state
    useStore.setState({
      currentView: 'docs',
      loading: true,
      error: 'test error',
      progress: 'test progress',
      taskId: 'test-id',
      documentation: 'test doc',
      architecture: 'test arch',
      repoName: 'test repo',
    });
    
    const { resetState } = useStore.getState();
    resetState();
    
    const state = useStore.getState();
    expect(state.currentView).toBe('home');
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.progress).toBe('');
    expect(state.taskId).toBe(null);
    expect(state.documentation).toBe(null);
    expect(state.architecture).toBe(null);
    expect(state.repoName).toBe('');
  });

  it('can fetch history', async () => {
    const { fetchHistory } = useStore.getState();
    
    // Test that the function exists and is callable
    expect(typeof fetchHistory).toBe('function');
    
    // The function will use the mocked fetch from setup.ts
    await fetchHistory();
    
    // Should have empty array due to mock setup
    expect(useStore.getState().history).toEqual([]);
  });

  it('has all required methods', () => {
    const state = useStore.getState();
    
    expect(typeof state.submitRepoUrl).toBe('function');
    expect(typeof state.fetchHistory).toBe('function');
    expect(typeof state.fetchResult).toBe('function');
    expect(typeof state.resetState).toBe('function');
  });

  it('state updates work correctly', () => {
    // Test direct state updates
    useStore.setState({ 
      loading: true, 
      error: 'test error',
      progress: 'test progress',
      repoName: 'test repo'
    });
    
    const state = useStore.getState();
    expect(state.loading).toBe(true);
    expect(state.error).toBe('test error');
    expect(state.progress).toBe('test progress');
    expect(state.repoName).toBe('test repo');
  });

  it('fetchResult method exists and is callable', async () => {
    const { fetchResult } = useStore.getState();
    
    expect(typeof fetchResult).toBe('function');
    
    // Call it with a test task ID - this will use the mocked fetch
    await fetchResult('test-task-id');
    
    // Should have set loading to true initially
    expect(useStore.getState().loading).toBe(true);
  });
});