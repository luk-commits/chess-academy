import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { TaskAssignmentSection } from '../../../src/components/tasks/TaskAssignmentSection';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const individuals = [
  { id: 1, label: 'Alice' },
  { id: 2, label: 'Bob' },
];
const classes = [
  { id: 10, label: 'Group A' },
  { id: 11, label: 'Group B' },
];

const defaultProps = {
  individuals,
  classes,
  loadingGroups: false,
  selectedPositionCount: 2,
  selectedGroupCount: 1,
  taskCreating: false,
  assignModalOpen: false,
  onOpenModal: vi.fn(),
  onCloseModal: vi.fn(),
  sidebarResetKey: 0,
  onCommitGroup: vi.fn(),
  publishDefaultRef: { current: true } as React.MutableRefObject<boolean>,
  onCreateTaskDesktop: vi.fn(),
  onCreateTaskFromModal: vi.fn(),
};

describe('TaskAssignmentSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop sidebar', () => {
    it('renders both group lists with titles', () => {
      renderWithTheme(<TaskAssignmentSection {...defaultProps} />);
      expect(screen.getByText('Zawodnicy')).toBeInTheDocument();
      expect(screen.getByText('Klasy')).toBeInTheDocument();
    });

    it('disables Dodaj zadania button when no positions selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={0} selectedGroupCount={1} />,
      );
      const btn = screen.getByText('Dodaj zadania').closest('button')!;
      expect(btn).toBeDisabled();
    });

    it('disables button when no groups selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={2} selectedGroupCount={0} />,
      );
      const btn = screen.getByText('Dodaj zadania').closest('button')!;
      expect(btn).toBeDisabled();
    });

    it('disables button and shows spinner when taskCreating', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} taskCreating={true} />,
      );
      const btn = screen.getByText('Dodaj zadania').closest('button')!;
      expect(btn).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('enables button when both selected and not creating', async () => {
      renderWithTheme(<TaskAssignmentSection {...defaultProps} />);
      const btn = screen.getByText('Dodaj zadania').closest('button')!;
      expect(btn).toBeEnabled();
    });

    it('calls onCreateTaskDesktop on button click', async () => {
      const onCreateTaskDesktop = vi.fn();
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} onCreateTaskDesktop={onCreateTaskDesktop} />,
      );
      await userEvent.click(screen.getByText('Dodaj zadania'));
      expect(onCreateTaskDesktop).toHaveBeenCalled();
    });

  it('Switch changes publishDefaultRef', async () => {
    const ref = { current: true };
    renderWithTheme(
      <TaskAssignmentSection {...defaultProps} publishDefaultRef={ref} />,
    );
    const switchEl = screen.getByRole('switch');
    await userEvent.click(switchEl);
    expect(ref.current).toBe(false);
  });

  it('Switch click does not trigger onCreateTaskDesktop', async () => {
    const onCreateTaskDesktop = vi.fn();
    renderWithTheme(
      <TaskAssignmentSection {...defaultProps} onCreateTaskDesktop={onCreateTaskDesktop} />,
    );
    const switchEl = screen.getByRole('switch');
    await userEvent.click(switchEl);
    expect(onCreateTaskDesktop).not.toHaveBeenCalled();
  });
  });

  describe('Mobile', () => {
    it('mobile button Przypisz zadania is disabled when no positions selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={0} />,
      );
      const btn = screen.getByText('Przypisz zadania').closest('button')!;
      expect(btn).toBeDisabled();
    });

    it('mobile button is enabled when positions selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={2} />,
      );
      const btn = screen.getByText('Przypisz zadania').closest('button')!;
      expect(btn).toBeEnabled();
    });

    it('mobile button click opens modal', async () => {
      const onOpenModal = vi.fn();
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} onOpenModal={onOpenModal} />,
      );
      await userEvent.click(screen.getByText('Przypisz zadania'));
      expect(onOpenModal).toHaveBeenCalled();
    });
  });

  describe('Modal', () => {
    function withinDialog() {
      return screen.getByRole('dialog');
    }

    it('renders dialog when assignModalOpen=true', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} />,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows tabs and switches between them', async () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} />,
      );
      expect(screen.getByRole('tab', { name: /zawodnicy/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /klasy/i })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('tab', { name: /klasy/i }));
    });

    it('shows CircularProgress overlay when taskCreating', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} taskCreating={true} />,
      );
      const spinners = screen.getAllByRole('progressbar');
      expect(spinners.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onCloseModal when Anuluj clicked', async () => {
      const onCloseModal = vi.fn();
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} onCloseModal={onCloseModal} />,
      );
      await userEvent.click(screen.getByText('Anuluj'));
      expect(onCloseModal).toHaveBeenCalled();
    });

    it('modal Dodaj zadania button disabled when no positions', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} selectedPositionCount={0} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadania');
      expect(btns[0].closest('button')).toBeDisabled();
    });

    it('modal Dodaj zadania button disabled when no groups', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} selectedGroupCount={0} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadania');
      expect(btns[0].closest('button')).toBeDisabled();
    });

    it('modal Dodaj zadania button enabled and calls onCreateTaskFromModal', async () => {
      const onCreateTaskFromModal = vi.fn();
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} onCreateTaskFromModal={onCreateTaskFromModal} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadania');
      expect(btns[0].closest('button')).toBeEnabled();
      await userEvent.click(btns[0]);
      expect(onCreateTaskFromModal).toHaveBeenCalled();
    });
  });

  it('sidebarResetKey propagates to GroupSelectorList (resets checkbox state)', async () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <TaskAssignmentSection {...defaultProps} sidebarResetKey={0} />
      </ThemeProvider>,
    );
    const aliceCheckbox = screen.getAllByText('Alice')[0]
      .closest('.MuiFormControlLabel-root')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    await userEvent.click(aliceCheckbox);
    expect(aliceCheckbox).toBeChecked();

    rerender(
      <ThemeProvider theme={theme}>
        <TaskAssignmentSection {...defaultProps} sidebarResetKey={1} />
      </ThemeProvider>,
    );
    const refreshed = screen.getAllByText('Alice')[0]
      .closest('.MuiFormControlLabel-root')!
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(refreshed).not.toBeChecked();
  });
});
