import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { mockGames, mockProbabilities, mockGameState } from '../../test/mockData';

// Mock the useWebSocket hook
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: { connected: true, lastUpdate: '2024-01-15T19:30:00Z' },
    lastMessage: null,
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  })
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/games') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGames)
        });
      }
      
      if (url.includes('/probabilities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProbabilities)
        });
      }
      
      if (url.includes('/state')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGameState)
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders dashboard with games after loading', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Football Analytics Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Live Games')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Games')).toBeInTheDocument();
    expect(screen.getByText('Completed Games')).toBeInTheDocument();
  });

  it('categorizes games correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Football Analytics Dashboard')).toBeInTheDocument();
    });

    // Live games section should contain the live game
    const liveSection = screen.getByText('Live Games').closest('section');
    expect(liveSection).toContainElement(screen.getByText('Georgia Bulldogs @ Alabama Crimson Tide'));

    // Upcoming games section should contain the scheduled game
    const upcomingSection = screen.getByText('Upcoming Games').closest('section');
    expect(upcomingSection).toContainElement(screen.getByText('Michigan Wolverines @ Ohio State Buckeyes'));

    // Completed games section should contain the final game
    const completedSection = screen.getByText('Completed Games').closest('section');
    expect(completedSection).toContainElement(screen.getByText('Oklahoma Sooners @ Texas Longhorns'));
  });

  it('displays connection status', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays empty state when no games available', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/games') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No games available at this time.')).toBeInTheDocument();
    });
  });

  it('handles API errors for individual games gracefully', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/games') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGames)
        });
      }
      
      // Simulate API error for probabilities/state
      if (url.includes('/probabilities') || url.includes('/state')) {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error'
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Football Analytics Dashboard')).toBeInTheDocument();
    });

    // Games should still be displayed even if probabilities/state fail
    expect(screen.getByText('Georgia Bulldogs @ Alabama Crimson Tide')).toBeInTheDocument();
  });
});