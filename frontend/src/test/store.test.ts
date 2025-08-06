import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../store';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      repoUrl: '',
      analysisStatus: '',
      documentation: '',
      isLoading: false,
      error: null,
    });
  });

  it('has initial state', () => {
    const state = useAppStore.getState();
    
    expect(state.repoUrl).toBe('');
    expect(state.analysisStatus).toBe('');
    expect(state.documentation).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('can set repo URL', () => {
    const { setRepoUrl } = useAppStore.getState();
    
    setRepoUrl('https://github.com/test/repo');
    
    expect(useAppStore.getState().repoUrl).toBe('https://github.com/test/repo');
  });

  it('can set analysis status', () => {
    const { setAnalysisStatus } = useAppStore.getState();
    
    setAnalysisStatus('Analyzing...');
    
    expect(useAppStore.getState().analysisStatus).toBe('Analyzing...');
  });

  it('can set documentation', () => {
    const { setDocumentation } = useAppStore.getState();
    
    setDocumentation('# Test Doc\nContent here');
    
    expect(useAppStore.getState().documentation).toBe('# Test Doc\nContent here');
  });

  it('can set loading state', () => {
    const { setIsLoading } = useAppStore.getState();
    
    setIsLoading(true);
    expect(useAppStore.getState().isLoading).toBe(true);
    
    setIsLoading(false);
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it('can set error state', () => {
    const { setError } = useAppStore.getState();
    
    setError('Something went wrong');
    expect(useAppStore.getState().error).toBe('Something went wrong');
    
    setError(null);
    expect(useAppStore.getState().error).toBe(null);
  });

  it('all setters work independently', () => {
    const { setRepoUrl, setAnalysisStatus, setDocumentation, setIsLoading, setError } = useAppStore.getState();
    
    setRepoUrl('test-url');
    setAnalysisStatus('test-status');
    setDocumentation('test-doc');
    setIsLoading(true);
    setError('test-error');
    
    const state = useAppStore.getState();
    expect(state.repoUrl).toBe('test-url');
    expect(state.analysisStatus).toBe('test-status');
    expect(state.documentation).toBe('test-doc');
    expect(state.isLoading).toBe(true);
    expect(state.error).toBe('test-error');
  });
});