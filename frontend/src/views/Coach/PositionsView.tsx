import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { positionsService } from '../../services/positionsService';
import { groupsService } from '../../services/groupsService';
import { tasksService } from '../../services/tasksService';
import { TaskAssignmentSection } from '../../components/tasks/TaskAssignmentSection';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { AppSnackbar } from '../../components/feedback/AppSnackbar';
import { PositionGrid } from '../../components/positions/PositionGrid';
import { PositionsToolbar } from '../../components/positions/PositionsToolbar';
import { PaginationSummary } from '../../components/positions/PaginationSummary';
import { useCardTagsExpanded } from '../../hooks/useCardTagsExpanded';
import { useAsyncResource } from '../../hooks/useAsyncResource';

// Stały rozmiar strony dla katalogu pozycji coacha.
const PER_PAGE = 12;

/**
 * Ekran pozycji coacha.
 *
 * Obsługuje filtry, stronicowanie, zaznaczanie i przypisywanie pozycji do grup.
 */
export function PositionsView() {
  // Lokalny stan widoku dla filtrów i informacji zwrotnej.
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [committedDifficultyRange, setCommittedDifficultyRange] = useState<number[]>([0, 3500]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Zaznaczenie przechowywane w refach, aby uniknąć ponownego renderowania przy każdym przełączeniu.
  const selectedPositionsRef = useMemo(() => new Set<number>(), []);
  const [selectedPositionCount, setSelectedPositionCount] = useState(0);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const selectedIds = useMemo(() => new Set(selectedPositionsRef), [selectedPositionCount]);
  // Ten sam wzorzec dla zaznaczonych grup docelowych (gracze/klasy).
  const selectedGroupsRef = useMemo(() => new Set<number>(), []);
  const [selectedGroupCount, setSelectedGroupCount] = useState(0);
  const [sidebarResetKey, setSidebarResetKey] = useState(0);
  const [taskCreating, setTaskCreating] = useState(false);
  const publishDefaultRef = useMemo(() => ({ current: true }), []);
  const [taskSnackbar, setTaskSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  const { expanded: cardTagsExpanded, toggle: handleToggleTags } = useCardTagsExpanded();

  const { data: groupsData, loading: loadingGroups } = useAsyncResource(
    () => groupsService.fetchCoachGroups(),
    [],
  );

  const individuals = useMemo(
    () => (groupsData?.individuals ?? []).map(ind => ({ id: ind.groupId, label: ind.playerName })),
    [groupsData],
  );
  const classes = useMemo(
    () => (groupsData?.classes ?? []).map(cls => ({ id: cls.groupId, label: cls.name })),
    [groupsData],
  );

  // Reset group selection whenever groups data refreshes (success or error)
  useEffect(() => {
    selectedGroupsRef.clear();
    setSelectedGroupCount(0);
    setSidebarResetKey((k) => k + 1);
  }, [groupsData, selectedGroupsRef]);

  const tagsParam = useMemo(() => selectedTags.join(','), [selectedTags]);

  const { data: positionsResponse, loading, error, reload: reloadPositions } = useAsyncResource(
    () => {
      const fetchParams: Parameters<typeof positionsService.fetchCoachPositions>[0] = {
        page,
        perPage: PER_PAGE,
        search,
        tags: tagsParam,
        difficultyMin: committedDifficultyRange[0],
        difficultyMax: committedDifficultyRange[1],
      };
      if (onlyNew) {
        fetchParams.onlyNew = true;
      }
      return positionsService.fetchCoachPositions(fetchParams);
    },
    [page, search, tagsParam, committedDifficultyRange, onlyNew],
    { defaultErrorMessage: 'Nie udalo sie pobrac pozycji.' },
  );

  const positions = positionsResponse?.items ?? [];
  const selectablePositionIds = positionsResponse?.selectablePositionIds ?? [];
  const totalPages = positionsResponse?.totalPages ?? 1;
  const total = positionsResponse?.total ?? 0;

  const pageRef = useRef(page);
  pageRef.current = page;
  // Backend may clamp page; sync local state if it diverges.
  useEffect(() => {
    if (positionsResponse && positionsResponse.page !== pageRef.current) {
      setPage(positionsResponse.page);
    }
  }, [positionsResponse]);

  const handlePositionToggle = useCallback((id: number) => {
    if (selectedPositionsRef.has(id))
      selectedPositionsRef.delete(id);
    else
      selectedPositionsRef.add(id);
    setSelectedPositionCount(selectedPositionsRef.size);
  }, [selectedPositionsRef]);

  const handleSelectFirst = useCallback((count: number) => {
    selectedPositionsRef.clear();
    for (let i = 0; i < Math.min(count, selectablePositionIds.length); i++) {
      selectedPositionsRef.add(selectablePositionIds[i]);
    }
    setSelectedPositionCount(selectedPositionsRef.size);
  }, [selectedPositionsRef, selectablePositionIds]);

  const handleClearSelection = useCallback(() => {
    selectedPositionsRef.clear();
    setSelectedPositionCount(0);
  }, [selectedPositionsRef]);

  const handleCopyFen = useCallback((id: number, _fen: string) => {
    navigator.clipboard.writeText(_fen).catch(() => {});
    setCopiedId(id);
  }, []);

  const handleGroupCommit = useCallback((groupId: number, checked: boolean) => {
    if (checked) selectedGroupsRef.add(groupId);
    else selectedGroupsRef.delete(groupId);
    setSelectedGroupCount(selectedGroupsRef.size);
  }, [selectedGroupsRef]);

  const clearAllSelections = useCallback(() => {
    selectedPositionsRef.clear();
    setSelectedPositionCount(0);
    setSelectionResetKey(k => k + 1);
    selectedGroupsRef.clear();
    setSelectedGroupCount(0);
    setSidebarResetKey(k => k + 1);
  }, [selectedPositionsRef, selectedGroupsRef]);

  const handleCreateTask = useCallback(async (opts?: { closeModal?: boolean }) => {
    if (selectedPositionCount === 0 || selectedGroupCount === 0) return;
    setTaskCreating(true);
    try {
      await tasksService.createTask({
        positionIds: Array.from(selectedPositionsRef),
        groupIds: Array.from(selectedGroupsRef),
        publishDefault: publishDefaultRef.current,
        ...(search ? { openingName: search } : {}),
      });
      setTaskSnackbar({ message: 'Zadania zostały utworzone!', severity: 'success' });
      clearAllSelections();
      reloadPositions();
      if (opts?.closeModal) setAssignModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się utworzyć zadania.';
      setTaskSnackbar({ message: msg, severity: 'error' });
    } finally {
      setTaskCreating(false);
    }
  }, [selectedPositionCount, selectedGroupCount, selectedPositionsRef, selectedGroupsRef, publishDefaultRef, reloadPositions, clearAllSelections, search]);

  const handleOpenAssignModal = useCallback(() => setAssignModalOpen(true), []);
  const handleCloseAssignModal = useCallback(() => setAssignModalOpen(false), []);
  const handleCreateTaskDesktop = useCallback(() => handleCreateTask(), [handleCreateTask]);
  const handleCreateTaskFromModal = useCallback(() => handleCreateTask({ closeModal: true }), [handleCreateTask]);

  const handleSearchCommit = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
    clearAllSelections();
  }, [clearAllSelections]);

  const handleDifficultyCommit = useCallback((range: [number, number]) => {
    setCommittedDifficultyRange(range);
    setPage(1);
    clearAllSelections();
  }, [clearAllSelections]);

  const handleTagsCommit = useCallback((tags: string[]) => {
    setSelectedTags(tags);
    setPage(1);
    clearAllSelections();
  }, [clearAllSelections]);

  const handleToggleOnlyNew = useCallback(() => {
    setOnlyNew(v => !v);
    setPage(1);
    clearAllSelections();
  }, [clearAllSelections]);

  const emptyMessage = useMemo(() => {
    if (loading) return '';
    if (search !== '' || selectedTags.length > 0) {
      return 'Brak wynikow dla podanych kryteriow.';
    }
    return 'Brak pozycji do wyswietlenia.';
  }, [loading, search, selectedTags]);

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PositionsToolbar
            onSearchCommit={handleSearchCommit}
            onDifficultyCommit={handleDifficultyCommit}
            onTagsCommit={handleTagsCommit}
            onlyNew={onlyNew}
            onToggleOnlyNew={handleToggleOnlyNew}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <LoadingState />
          ) : positions.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <>
              <PaginationSummary
                total={total}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                selectedCount={selectedPositionCount}
                onSelectFirst={handleSelectFirst}
                onClearSelection={handleClearSelection}
              />

              <PositionGrid
                positions={positions}
                selectedIds={selectedIds}
                cardTagsExpanded={cardTagsExpanded}
                onToggle={handlePositionToggle}
                onCopy={handleCopyFen}
                onToggleTags={handleToggleTags}
                keyPrefix={selectionResetKey}
              />

              <AppSnackbar
                open={copiedId !== null}
                message="Skopiowano do schowka"
                onClose={() => setCopiedId(null)}
              />
            </>
          )}
        </Box>

        <TaskAssignmentSection
          individuals={individuals}
          classes={classes}
          loadingGroups={loadingGroups}
          selectedPositionCount={selectedPositionCount}
          selectedGroupCount={selectedGroupCount}
          taskCreating={taskCreating}
          assignModalOpen={assignModalOpen}
          onOpenModal={handleOpenAssignModal}
          onCloseModal={handleCloseAssignModal}
          sidebarResetKey={sidebarResetKey}
          onCommitGroup={handleGroupCommit}
          publishDefaultRef={publishDefaultRef}
          onCreateTaskDesktop={handleCreateTaskDesktop}
          onCreateTaskFromModal={handleCreateTaskFromModal}
        />
      </Box>

      <AppSnackbar
        open={taskSnackbar !== null}
        message={taskSnackbar?.message ?? ''}
        severity={taskSnackbar?.severity ?? 'success'}
        onClose={() => setTaskSnackbar(null)}
      />
    </PageLayout>
  );
}
