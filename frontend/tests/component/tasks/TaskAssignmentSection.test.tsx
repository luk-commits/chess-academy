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
  groupResetKey: 0,
  onCommitGroup: vi.fn(),
  selectedGroupIds: new Set<number>([1]),
  publishDefaultRef: { current: true } as React.MutableRefObject<boolean>,
  onCreateTaskDesktop: vi.fn(),
  onCreateTaskFromModal: vi.fn(),
};

describe('TaskAssignmentSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Floating button', () => {
    it('Przypisz zadania is disabled when no positions selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={0} />,
      );
      const btn = screen.getByText('Przypisz zadania').closest('button')!;
      expect(btn).toBeDisabled();
    });

    it('Przypisz zadania is enabled when positions selected', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} selectedPositionCount={2} />,
      );
      const btn = screen.getByText('Przypisz zadania').closest('button')!;
      expect(btn).toBeEnabled();
    });

    it('Przypisz zadania click opens modal', async () => {
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

    it('modal Dodaj zadanie button disabled when no positions', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} selectedPositionCount={0} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadanie');
      expect(btns[0].closest('button')).toBeDisabled();
    });

    it('modal Dodaj zadanie button disabled when no groups', () => {
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} selectedGroupCount={0} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadanie');
      expect(btns[0].closest('button')).toBeDisabled();
    });

    it('modal Dodaj zadanie button enabled and calls onCreateTaskFromModal', async () => {
      const onCreateTaskFromModal = vi.fn();
      renderWithTheme(
        <TaskAssignmentSection {...defaultProps} assignModalOpen={true} onCreateTaskFromModal={onCreateTaskFromModal} />,
      );
      const dialog = withinDialog();
      const btns = within(dialog).getAllByText('Dodaj zadanie');
      expect(btns[0].closest('button')).toBeEnabled();
      await userEvent.click(btns[0]);
      expect(onCreateTaskFromModal).toHaveBeenCalled();
    });
  });
});
