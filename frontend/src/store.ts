import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalysisResult {
  
  architecture: any;
  
  documentation: any;
  repo_name: string;
  id: string;
  status: string;
  updated_at: string;
  commit_hash: string;
}

interface StoreState {
  currentView: 'home' | 'loading' | 'docs';
  loading: boolean;
  error: string | null;
  progress: string;
  taskId: string | null;
  documentation: any;
  architecture: any;
  repoName: string;
  history: AnalysisResult[];
  pollingInterval: NodeJS.Timeout | null;
  submitRepoUrl: (repoUrl: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchResult: (taskId: string) => Promise<void>;
  resetState: () => void;
  cleanup: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentView: 'home',
      loading: false,
      error: null,
      progress: '',
      taskId: null,
      documentation: null,
      architecture: null,
      repoName: '',
      history: [],
      pollingInterval: null,
      submitRepoUrl: async (repoUrl: string) => {
        set({ loading: true, error: null, currentView: 'loading', progress: 'Submitting repository for analysis...' });
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_url: repoUrl })
          });
          if (!response.ok) throw new Error('Failed to start analysis');
          const data = await response.json();
          const { task_id } = data;
          set({ taskId: task_id });
          get().fetchResult(task_id);
        } catch (err) {
          console.error('Error starting analysis:', err);
          set({ error: 'Failed to start analysis.', loading: false, currentView: 'home' });
        }
      },
      fetchHistory: async () => {
        try {
          const response = await fetch('/api/analyses');
          if (!response.ok) throw new Error('Failed to fetch history');
          const data = await response.json();
          set({ history: data });
        } catch (err) {
          console.error('Failed to fetch history:', err);
        }
      },
      fetchResult: async (taskId: string) => {
        const { cleanup } = get();
        cleanup(); // Clean up any existing intervals
        
        set({ loading: true, currentView: 'loading', progress: 'Fetching analysis results...' });
        
        const pollResult = async () => {
          try {
            const response = await fetch(`/api/result/${taskId}`);
            if (!response.ok) throw new Error('Failed to fetch results');
            const data = await response.json();
            const { status, result, repo_name } = data;
            
            if (status === 'completed' && result) {
              cleanup();
              set({ 
                documentation: result.result, 
                architecture: result.architecture, 
                repoName: repo_name, 
                loading: false, 
                currentView: 'docs',
                pollingInterval: null
              });
              get().fetchHistory();
            } else if (status === 'failed') {
              cleanup();
              set({ error: 'Analysis failed.', loading: false, currentView: 'home', pollingInterval: null });
            } else {
              // Still processing
              set({ progress: `Status: ${status}` });
            }
          } catch (err) {
            cleanup();
            console.error('Error fetching results:', err);
            set({ error: 'Failed to fetch results.', loading: false, currentView: 'home', pollingInterval: null });
          }
        };
        
        // Start polling
        const interval = setInterval(pollResult, 2000);
        set({ pollingInterval: interval });
        
        // Initial poll
        pollResult();
      },
      resetState: () => {
        const { cleanup } = get();
        cleanup();
        set({ 
          currentView: 'home', 
          loading: false, 
          error: null, 
          progress: '', 
          taskId: null, 
          documentation: null, 
          architecture: null, 
          repoName: '',
          pollingInterval: null
        });
      },
      cleanup: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      },
    }),
    {
      name: 'deepwiki-storage',
    }
  )
);
