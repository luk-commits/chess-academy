import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../../../src/theme';
import { PositionsView } from '../../../src/views/Coach/PositionsView';
import userEvent from '@testing-library/user-event';
import type { TaskResponse } from '../../../src/types/position';

const mockFetchCoachPositions = vi.hoisted(() => vi.fn());
const mockFetchCoachGroups = vi.hoisted(() => vi.fn());
const mockCreateTask = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/positionsService', () => ({
  positionsService: { fetchCoachPositions: mockFetchCoachPositions },
}));
vi.mock('../../../src/services/groupsService', () => ({
  groupsService: { fetchCoachGroups: mockFetchCoachGroups },
}));
vi.mock('../../../src/services/tasksService', () => ({
  tasksService: { createTask: mockCreateTask },
}));

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const makePositions = (count: number) => {
  const items = [];
  const ids: number[] = [];
  for (let i = 1; i <= count; i++) {
    ids.push(i);
    items.push({ id: i, fen: START_FEN, firstMove: null, opening: `Opening ${i}`, themeTags: ['fork'], rating: 1500, difficulty: 1200 });
  }
  return { items, ids };
};

const defaultPositionsResponse = () => ({
  items: [
    { id: 1, fen: START_FEN, firstMove: null, opening: 'Italian', themeTags: ['fork'], rating: 1500, difficulty: 1200 },
    { id: 2, fen: START_FEN, firstMove: 'e2e4', opening: 'Ruy_Lopez', themeTags: ['pin', 'skewer'], rating: 1800, difficulty: 1500 },
  ],
  page: 1,
  perPage: 12,
  total: 2,
  totalPages: 1,
  search: '',
  selectablePositionIds: [1, 2],
});

const defaultGroupsResponse = () => ({
  individuals: [
    { groupId: 1, playerId: 10, playerName: 'Alice' },
    { groupId: 2, playerId: 11, playerName: 'Bob' },
  ],
  classes: [
    { groupId: 5, name: 'Group A' },
  ],
});

const defaultTaskResponse = (): TaskResponse => ({
  task: { id: 1, title: '', description: '', status: '', stages: [], groupIds: [1] },
});

function renderView() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/home/coach/positions']}>
        <PositionsView />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchCoachPositions.mockResolvedValue(defaultPositionsResponse());
  mockFetchCoachGroups.mockResolvedValue(defaultGroupsResponse());
  mockCreateTask.mockResolvedValue(defaultTaskResponse());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PositionsView feature', { timeout: 15000 }, () => {
  it('shows loading spinner then positions', async () => {
    renderView();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1);
    await screen.findByText('Italian');
    expect(screen.queryByText('Brak pozycji do wyswietlenia.')).not.toBeInTheDocument();
  });

  it('shows error alert on fetch failure', async () => {
    mockFetchCoachPositions.mockRejectedValue(new Error('Network error'));
    renderView();
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some(a => a.textContent?.includes('Network error'))).toBe(true);
    });
  });

  it('shows empty state when no positions returned', async () => {
    mockFetchCoachPositions.mockResolvedValue({ ...defaultPositionsResponse(), items: [], total: 0, totalPages: 0 });
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Brak pozycji do wyswietlenia.')).toBeInTheDocument();
    });
  });

  it('search commit resets page to 1', async () => {
    renderView();
    await screen.findByText('Italian');
    mockFetchCoachPositions.mockClear();
    mockFetchCoachPositions.mockResolvedValue(defaultPositionsResponse());
    const input = screen.getByLabelText(/nazwa debiutu/i);
    await userEvent.type(input, 'italian');
    await userEvent.click(screen.getByRole('button', { name: /szukaj/i }));
    await waitFor(() => {
      const lastCall = mockFetchCoachPositions.mock.calls.at(-1)?.[0];
      expect(lastCall).toBeDefined();
      expect(lastCall.page).toBe(1);
      expect(lastCall.search).toBe('italian');
    });
  });

  it('pagination calls fetch with page 2', async () => {
    mockFetchCoachPositions.mockResolvedValue({ ...defaultPositionsResponse(), total: 25, totalPages: 3 });
    renderView();
    await waitFor(() => {
      expect(screen.getByText(/wszystkich pozycji: 25/i)).toBeInTheDocument();
    });
    mockFetchCoachPositions.mockClear();
    mockFetchCoachPositions.mockResolvedValue({ ...defaultPositionsResponse(), page: 2, total: 25, totalPages: 3 });
    const page2 = screen.getByRole('button', { name: /page 2/i });
    await userEvent.click(page2);
    await waitFor(() => {
      expect(mockFetchCoachPositions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('toggle selection adds/removes position', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    await waitFor(() => {
      expect(screen.getByText(/wybrano:\s*1/i)).toBeInTheDocument();
    });
    await userEvent.click(card);
    await waitFor(() => {
      expect(screen.getByText(/wybrano:\s*0/i)).toBeInTheDocument();
    });
  });

  it('copy FEN calls clipboard and shows snackbar', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const fenField = screen.getAllByDisplayValue(START_FEN)[0];
    await userEvent.click(fenField);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(START_FEN);
    await waitFor(() => {
      expect(screen.getByText('Skopiowano do schowka')).toBeInTheDocument();
    });
  });

  it('renders groups after fetch', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Group A')).toBeInTheDocument();
    });
  });

  it('shows empty group lists on fetch error', async () => {
    mockFetchCoachGroups.mockRejectedValue(new Error('Group error'));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Brak zawodników.')).toBeInTheDocument();
      expect(screen.getByText('Brak klas.')).toBeInTheDocument();
    });
  });

  it('create task happy path clears selections', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    await waitFor(() => {
      expect(screen.getByText(/wybrano:\s*1/i)).toBeInTheDocument();
    });
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    await userEvent.click(screen.getByText('Dodaj zadania'));
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        positionIds: [1],
        groupIds: [1],
        publishDefault: true,
      });
    });
    await waitFor(() => {
      expect(screen.getByText('Zadania zostały utworzone!')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/wybrano:\s*0/i)).toBeInTheDocument();
    });
  });

  it('create task with publishDefault=false', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);

    const switchEl = screen.getByRole('switch');
    await userEvent.click(switchEl);
    await userEvent.click(screen.getByText('Dodaj zadania'));
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        positionIds: [1],
        groupIds: [1],
        publishDefault: false,
      });
    });
  });

  it('create task error shows error snackbar and keeps selections', async () => {
    mockCreateTask.mockRejectedValue(new Error('Backend down'));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    await userEvent.click(screen.getByText('Dodaj zadania'));
    await waitFor(() => {
      expect(screen.getByText('Backend down')).toBeInTheDocument();
    });
    expect(screen.getByText(/wybrano:\s*1/i)).toBeInTheDocument();
  });

  it('create button disabled with 0 positions', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    const btn = screen.getByText('Dodaj zadania').closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('create button disabled with 0 groups', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    const btn = screen.getByText('Dodaj zadania').closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('shows spinner on task creating', async () => {
    let resolvePromise!: (v: unknown) => void;
    mockCreateTask.mockReturnValue(new Promise(resolve => { resolvePromise = resolve; }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const card = screen.getByText('Italian').closest('.MuiCard-root')!;
    await userEvent.click(card);
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    await userEvent.click(screen.getByText('Dodaj zadania'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await act(async () => { resolvePromise(defaultTaskResponse()); });
  });

  it('select first 50 uses global selectablePositionIds beyond visible page', async () => {
    const { items, ids } = makePositions(60);
    mockFetchCoachPositions.mockResolvedValue({
      ...defaultPositionsResponse(),
      items: items.slice(0, 12),
      total: 60,
      totalPages: 5,
      selectablePositionIds: ids.slice(0, 50),
    });
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Opening 1')).toBeInTheDocument();
    });
    const btn50 = screen.getByRole('button', { name: '50' });
    await userEvent.click(btn50);
    await waitFor(() => {
      expect(screen.getByText(/wybrano:\s*50/i)).toBeInTheDocument();
    });
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    await userEvent.click(screen.getByText('Dodaj zadania'));
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        positionIds: ids.slice(0, 50),
        groupIds: [1],
        publishDefault: true,
      });
    });
  });

  it('mobile Przypisz zadania button disabled when no positions', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
    const btn = screen.getByText('Przypisz zadania').closest('button')!;
    expect(btn).toBeDisabled();
  });
});
