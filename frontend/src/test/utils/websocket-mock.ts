import { vi } from 'vitest';

export interface MockWebSocketInstance {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: () => void;
  send: (data: string) => void;
}

export class WebSocketTestUtils {
  private static instances: MockWebSocketInstance[] = [];

  /**
   * Create a mock WebSocket that can be controlled for testing
   */
  static createMockWebSocket(): MockWebSocketInstance {
    const instance: MockWebSocketInstance = {
      url: 'ws://localhost:8000/ws',
      readyState: 1, // OPEN
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      
      close: vi.fn().mockImplementation(function(this: MockWebSocketInstance) {
        this.readyState = 3; // CLOSED
        if (this.onclose) {
          this.onclose(new CloseEvent('close'));
        }
      }),
      
      send: vi.fn().mockImplementation(function(this: MockWebSocketInstance, data: string) {
        // Can be overridden in tests to simulate different responses
        console.log('WebSocket send:', data);
      })
    };

    WebSocketTestUtils.instances.push(instance);
    return instance;
  }

  /**
   * Setup global WebSocket mock for testing
   */
  static setupGlobalMock() {
    const mockWebSocket = vi.fn().mockImplementation((url: string) => {
      return WebSocketTestUtils.createMockWebSocket();
    });

    // Add static constants
    mockWebSocket.CONNECTING = 0;
    mockWebSocket.OPEN = 1;
    mockWebSocket.CLOSING = 2;
    mockWebSocket.CLOSED = 3;

    global.WebSocket = mockWebSocket as any;
    return mockWebSocket;
  }

  /**
   * Simulate WebSocket connection opening
   */
  static simulateOpen(instance: MockWebSocketInstance) {
    instance.readyState = 1; // OPEN
    if (instance.onopen) {
      instance.onopen(new Event('open'));
    }
  }

  /**
   * Simulate receiving a message
   */
  static simulateMessage(instance: MockWebSocketInstance, data: any) {
    if (instance.onmessage && instance.readyState === 1) {
      const messageData = typeof data === 'string' ? data : JSON.stringify(data);
      instance.onmessage(new MessageEvent('message', { data: messageData }));
    }
  }

  /**
   * Simulate WebSocket closing
   */
  static simulateClose(instance: MockWebSocketInstance, code?: number, reason?: string) {
    instance.readyState = 3; // CLOSED
    if (instance.onclose) {
      instance.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  /**
   * Simulate WebSocket error
   */
  static simulateError(instance: MockWebSocketInstance, error?: string) {
    if (instance.onerror) {
      const errorEvent = new Event('error');
      (errorEvent as any).message = error || 'WebSocket error';
      instance.onerror(errorEvent);
    }
  }

  /**
   * Get the last created WebSocket instance
   */
  static getLastInstance(): MockWebSocketInstance | null {
    return WebSocketTestUtils.instances[WebSocketTestUtils.instances.length - 1] || null;
  }

  /**
   * Get all WebSocket instances created during testing
   */
  static getAllInstances(): MockWebSocketInstance[] {
    return [...WebSocketTestUtils.instances];
  }

  /**
   * Clear all instances (useful for cleanup between tests)
   */
  static clearInstances() {
    WebSocketTestUtils.instances = [];
  }

  /**
   * Wait for WebSocket to be created (useful in async tests)
   */
  static async waitForConnection(timeout = 1000): Promise<MockWebSocketInstance> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const instance = WebSocketTestUtils.getLastInstance();
      if (instance) {
        return instance;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error('WebSocket connection not established within timeout');
  }
}

/**
 * Helper to create common WebSocket test scenarios
 */
export const WebSocketScenarios = {
  /**
   * Simulate successful analysis workflow
   */
  analysisWorkflow: (instance: MockWebSocketInstance, taskId: string) => {
    // Simulate progression of analysis states
    setTimeout(() => {
      WebSocketTestUtils.simulateMessage(instance, {
        task_id: taskId,
        status: 'processing',
        progress: 'Starting analysis...'
      });
    }, 10);
    
    setTimeout(() => {
      WebSocketTestUtils.simulateMessage(instance, {
        task_id: taskId,
        status: 'processing', 
        progress: 'Analyzing repository structure...'
      });
    }, 50);
    
    setTimeout(() => {
      WebSocketTestUtils.simulateMessage(instance, {
        task_id: taskId,
        status: 'completed',
        progress: 'Analysis completed!'
      });
    }, 100);
  },

  /**
   * Simulate analysis error
   */
  analysisError: (instance: MockWebSocketInstance, taskId: string, error: string) => {
    setTimeout(() => {
      WebSocketTestUtils.simulateMessage(instance, {
        task_id: taskId,
        status: 'error',
        error: error
      });
    }, 10);
  }
};