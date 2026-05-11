import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Navigate } from 'react-router-dom';

describe('Minimal', () => {
  it('renders Navigate', async () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Navigate to="/login" replace />
      </MemoryRouter>,
    );
    expect(true).toBe(true);
  });
});
