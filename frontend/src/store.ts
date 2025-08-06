import { create } from 'zustand';

interface AppState {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  analysisStatus: string;
  setAnalysisStatus: (status: string) => void;
  documentation: string;
  setDocumentation: (doc: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  repoUrl: '',
  setRepoUrl: (url) => set({ repoUrl: url }),
  analysisStatus: '',
  setAnalysisStatus: (status) => set({ analysisStatus: status }),
  documentation: '',
  setDocumentation: (doc) => set({ documentation: doc }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error: error }),
}));

export default useAppStore;
