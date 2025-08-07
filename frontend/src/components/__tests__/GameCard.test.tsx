import { render, screen } from '@testing-library/react';
import { GameCard } from '../GameCard';
import { mockGame, mockProbabilities, mockGameState } from '../../test/mockData';

describe('GameCard', () => {
  it('renders game information correctly', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Georgia Bulldogs @ Alabama Crimson Tide')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText(/Bryant-Denny Stadium/)).toBeInTheDocument();
  });

  it('displays game state when provided', () => {
    render(<GameCard game={mockGame} gameState={mockGameState} />);
    
    expect(screen.getByText('Alabama Crimson Tide: 14')).toBeInTheDocument();
    expect(screen.getByText('Georgia Bulldogs: 7')).toBeInTheDocument();
    expect(screen.getByText('Q2 - 8:45')).toBeInTheDocument();
    expect(screen.getByText(/Possession: Alabama Crimson Tide/)).toBeInTheDocument();
    expect(screen.getByText(/ALA 35/)).toBeInTheDocument();
    expect(screen.getByText(/2 & 8/)).toBeInTheDocument();
  });

  it('displays probabilities when provided', () => {
    render(<GameCard game={mockGame} probabilities={mockProbabilities} />);
    
    expect(screen.getByText('Win Probability')).toBeInTheDocument();
    expect(screen.getByText('65.0% - 35.0%')).toBeInTheDocument();
    expect(screen.getByText('Spread (-7.5)')).toBeInTheDocument();
    expect(screen.getByText('58.0%')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 82.0%')).toBeInTheDocument();
    expect(screen.getByText('Total O/U 52.5')).toBeInTheDocument();
    expect(screen.getByText(/O: 52.0%.*U: 48.0%/)).toBeInTheDocument();
  });

  it('displays weather information when available', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText(/Weather: Clear, 72°F, Wind: 5 mph/)).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { rerender } = render(<GameCard game={mockGame} />);
    expect(screen.getByText('LIVE')).toHaveClass('text-green');

    const finalGame = { ...mockGame, status: 'FINAL' as const };
    rerender(<GameCard game={finalGame} />);
    expect(screen.getByText('FINAL')).toHaveClass('text-yellow');

    const postponedGame = { ...mockGame, status: 'POSTPONED' as const };
    rerender(<GameCard game={postponedGame} />);
    expect(screen.getByText('POSTPONED')).toHaveClass('text-red');
  });

  it('formats time correctly', () => {
    render(<GameCard game={mockGame} />);
    
    // Check that time is formatted (exact format may vary by locale)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const minimalGame = {
      ...mockGame,
      weather: undefined
    };
    
    render(<GameCard game={minimalGame} />);
    
    expect(screen.getByText('Georgia Bulldogs @ Alabama Crimson Tide')).toBeInTheDocument();
    expect(screen.queryByText(/Weather:/)).not.toBeInTheDocument();
  });
});