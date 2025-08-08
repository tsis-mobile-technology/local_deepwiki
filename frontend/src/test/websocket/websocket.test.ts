import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketTestUtils, WebSocketScenarios } from '../utils/websocket-mock';

describe('WebSocket Testing Infrastructure', () => {
  beforeEach(() => {
    WebSocketTestUtils.setupGlobalMock();
    WebSocketTestUtils.clearInstances();
  });

  afterEach(() => {
    WebSocketTestUtils.clearInstances();
  });

  it('creates WebSocket instances correctly', () => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    expect(ws).toBeDefined();
    expect(ws.readyState).toBe(1); // OPEN
    expect(ws.url).toBe('ws://localhost:8000/ws');
  });

  it('handles WebSocket connection opening', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      
      instance.onopen = (event) => {
        expect(event.type).toBe('open');
        expect(instance.readyState).toBe(1); // OPEN
        resolve();
      };
      
      WebSocketTestUtils.simulateOpen(instance);
    });
  });

  it('handles WebSocket message reception', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      const testData = { task_id: 'test-123', status: 'processing' };
      
      instance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        expect(data).toEqual(testData);
        resolve();
      };
      
      WebSocketTestUtils.simulateMessage(instance, testData);
    });
  });

  it('handles WebSocket connection closing', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      
      instance.onclose = (event) => {
        expect(event.type).toBe('close');
        expect(instance.readyState).toBe(3); // CLOSED
        resolve();
      };
      
      WebSocketTestUtils.simulateClose(instance, 1000, 'Normal closure');
    });
  });

  it('handles WebSocket errors', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      
      instance.onerror = (event) => {
        expect(event.type).toBe('error');
        expect((event as any).message).toBe('Connection failed');
        resolve();
      };
      
      WebSocketTestUtils.simulateError(instance, 'Connection failed');
    });
  });

  it('tracks multiple WebSocket instances', () => {
    new WebSocket('ws://localhost:8000/ws/1');
    new WebSocket('ws://localhost:8000/ws/2');
    new WebSocket('ws://localhost:8000/ws/3');
    
    const instances = WebSocketTestUtils.getAllInstances();
    expect(instances).toHaveLength(3);
    
    const lastInstance = WebSocketTestUtils.getLastInstance();
    expect(lastInstance).toBeDefined();
    expect(lastInstance?.url).toBe('ws://localhost:8000/ws');
  });

  it('simulates analysis workflow scenario', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      const taskId = 'test-analysis-123';
      let messageCount = 0;
      const expectedMessages = [
        { status: 'processing', progress: 'Starting analysis...' },
        { status: 'processing', progress: 'Analyzing repository structure...' },
        { status: 'completed', progress: 'Analysis completed!' }
      ];
      
      instance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        expect(data.task_id).toBe(taskId);
        expect(data.status).toBe(expectedMessages[messageCount].status);
        expect(data.progress).toBe(expectedMessages[messageCount].progress);
        
        messageCount++;
        if (messageCount === expectedMessages.length) {
          resolve();
        }
      };
      
      WebSocketScenarios.analysisWorkflow(instance, taskId);
    });
  });

  it('simulates analysis error scenario', () => {
    return new Promise<void>((resolve) => {
      const instance = WebSocketTestUtils.createMockWebSocket();
      const taskId = 'test-error-123';
      const errorMessage = 'Repository not found';
      
      instance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        expect(data.task_id).toBe(taskId);
        expect(data.status).toBe('error');
        expect(data.error).toBe(errorMessage);
        resolve();
      };
      
      WebSocketScenarios.analysisError(instance, taskId, errorMessage);
    });
  });

  it('waits for WebSocket connection asynchronously', async () => {
    // Simulate delayed WebSocket creation
    setTimeout(() => {
      new WebSocket('ws://localhost:8000/ws');
    }, 50);
    
    const instance = await WebSocketTestUtils.waitForConnection(1000);
    expect(instance).toBeDefined();
    expect(instance.readyState).toBe(1);
  });

  it('handles WebSocket send operations', () => {
    const instance = WebSocketTestUtils.createMockWebSocket();
    const testMessage = JSON.stringify({ action: 'subscribe', task_id: 'test-123' });
    
    instance.send(testMessage);
    
    expect(instance.send).toHaveBeenCalledWith(testMessage);
  });

  it('handles WebSocket close operations', () => {
    const instance = WebSocketTestUtils.createMockWebSocket();
    
    instance.close();
    
    expect(instance.close).toHaveBeenCalled();
    expect(instance.readyState).toBe(3); // CLOSED
  });
});