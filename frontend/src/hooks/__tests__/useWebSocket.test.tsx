import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock WebSocket is already set up in test setup

describe('useWebSocket', () => {
  const mockUrl = 'ws://localhost:8000/ws';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('establishes connection on mount', async () => {
    const { result } = renderHook(() => 
      useWebSocket({ url: mockUrl })
    );

    expect(result.current.connectionStatus.connected).toBe(false);

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });
  });

  it('handles incoming messages correctly', async () => {
    const mockOnMessage = vi.fn();
    const { result } = renderHook(() => 
      useWebSocket({ 
        url: mockUrl,
        onMessage: mockOnMessage
      })
    );

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });

    // Simulate receiving a message
    const mockMessage = {
      type: 'PROBABILITY_UPDATE',
      gameId: 'game-1',
      data: { winProbability: { home: 0.6, away: 0.4 } },
      timestamp: '2024-01-15T19:30:00Z'
    };

    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      if (ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify(mockMessage)
        });
      }
    });

    expect(mockOnMessage).toHaveBeenCalledWith(mockMessage);
    expect(result.current.lastMessage).toEqual(mockMessage);
  });

  it('handles connection errors', async () => {
    const mockOnError = vi.fn();
    const { result } = renderHook(() => 
      useWebSocket({ 
        url: mockUrl,
        onError: mockOnError
      })
    );

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });

    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      if (ws.onerror) {
        const errorEvent = new Event('error');
        ws.onerror(errorEvent);
      }
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(result.current.connectionStatus.error).toBe('Connection error occurred');
  });

  it('sends messages when connected', async () => {
    const { result } = renderHook(() => 
      useWebSocket({ url: mockUrl })
    );

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });

    const mockMessage = { type: 'SUBSCRIBE', gameId: 'game-1' };
    const sendResult = result.current.sendMessage(mockMessage);

    expect(sendResult).toBe(true);
  });

  it('fails to send messages when disconnected', () => {
    const { result } = renderHook(() => 
      useWebSocket({ url: mockUrl })
    );

    const mockMessage = { type: 'SUBSCRIBE', gameId: 'game-1' };
    const sendResult = result.current.sendMessage(mockMessage);

    expect(sendResult).toBe(false);
  });

  it('cleans up connection on unmount', async () => {
    const { result, unmount } = renderHook(() => 
      useWebSocket({ url: mockUrl })
    );

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });

    const ws = (global.WebSocket as any).mock.instances[0];
    const closeSpy = vi.spyOn(ws, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalledWith(1000, 'Manual disconnect');
  });

  it('attempts reconnection on unexpected disconnect', async () => {
    const { result } = renderHook(() => 
      useWebSocket({ 
        url: mockUrl,
        reconnectInterval: 100,
        maxReconnectAttempts: 2
      })
    );

    await waitFor(() => {
      expect(result.current.connectionStatus.connected).toBe(true);
    });

    // Simulate unexpected disconnect
    act(() => {
      const ws = (global.WebSocket as any).mock.instances[0];
      if (ws.onclose) {
        ws.onclose(new CloseEvent('close', { code: 1006, reason: 'Connection lost' }));
      }
    });

    expect(result.current.connectionStatus.connected).toBe(false);
    expect(result.current.connectionStatus.error).toContain('Connection closed');

    // Wait for reconnection attempt
    await waitFor(() => {
      expect((global.WebSocket as any).mock.instances.length).toBeGreaterThan(1);
    }, { timeout: 200 });
  });
});