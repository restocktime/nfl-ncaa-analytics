import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('displays connected status correctly', () => {
    const status = {
      connected: true,
      lastUpdate: '2024-01-15T19:30:00Z'
    };

    render(<ConnectionStatus status={status} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Last update:/)).toBeInTheDocument();
    
    const indicator = document.querySelector('.status-indicator');
    expect(indicator).toHaveClass('status-connected');
  });

  it('displays disconnected status correctly', () => {
    const status = {
      connected: false,
      error: 'Connection timeout'
    };

    render(<ConnectionStatus status={status} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('(Connection timeout)')).toBeInTheDocument();
    
    const indicator = document.querySelector('.status-indicator');
    expect(indicator).toHaveClass('status-disconnected');
  });

  it('displays status without error message', () => {
    const status = {
      connected: false
    };

    render(<ConnectionStatus status={status} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('formats last update time correctly', () => {
    const status = {
      connected: true,
      lastUpdate: '2024-01-15T19:30:00Z'
    };

    render(<ConnectionStatus status={status} />);
    
    // Check that time is formatted (exact format may vary by locale)
    expect(screen.getByText(/Last update: \d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});