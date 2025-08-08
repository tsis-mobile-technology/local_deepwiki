// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  ANALYZE: '/api/analyze',
  RESULT: (taskId: string) => `/api/result/${taskId}`,
  ANALYSES: '/api/analyses',
  ASK: '/api/ask',
  SUGGESTIONS: (repoName: string) => `/api/suggestions/${repoName}`,
  ARCHITECTURE: (taskId: string) => `/api/architecture/${taskId}`,
} as const;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  POLLING_INTERVAL: 2000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// HTTP client with error handling
export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = buildApiUrl(endpoint);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  },

  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data: unknown): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};