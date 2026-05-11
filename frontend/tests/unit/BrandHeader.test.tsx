import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrandHeader } from '../../src/components/BrandHeader';

describe('BrandHeader', () => {
  it('renders the ChessAcademy heading', () => {
    render(<BrandHeader />);
    expect(screen.getByRole('heading', { name: /chessacademy/i })).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<BrandHeader />);
    expect(screen.getByText('Profesjonalna platforma trenerska')).toBeInTheDocument();
  });

  it('renders a trophy icon', () => {
    render(<BrandHeader />);
    expect(document.querySelector('[data-testid="EmojiEventsIcon"]')).toBeInTheDocument();
  });
});
