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

const PER_PAGE = 12;

export function PositionsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [committedDifficultyRange, setCommittedDifficultyRange] = useState<number[]>([0, 3500]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const selectedPositionsRef = useMemo(() => new Set<number>(), []);
  const [selectedPositionCount, setSelectedPositionCount] = useState(0);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const selectedGroupsRef = useMemo(() => new Set<number>(), []);
  const [selectedGroupCount, setSelectedGroupCount] = useState(0);
  const [sidebarResetKey, setSidebarResetKey] = useState(0);
  const [taskCreating, setTaskCreating] = useState(false);
  const publishDefaultRef = useMemo(() => ({ current: true }), []);
  const [taskSnackbar, setTaskSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { expanded: cardTagsExpanded, toggle: handleToggleTags } = useCardTagsExpanded();

  const { data: groupsData, loading: loadingGroups } = useAsyncResource(
    () => groupsService.fetchCoachGroups(),
    [],
  );

  const individuals = groupsData?.individuals ?? [];
  const classes = groupsData?.classes ?? [];

  // Reset group selection whenever groups data refreshes (success or error)
  useEffect(() => {
    selectedGroupsRef.clear();
    setSelectedGroupCount(0);
    setSidebarResetKey((k) => k + 1);
  }, [groupsData, selectedGroupsRef]);

  const tagsParam = useMemo(() => selectedTags.join(','), [selectedTags]);

  const { data: positionsResponse, loading, error } = useAsyncResource(
    () =>
      positionsService.fetchCoachPositions({
        page,
        perPage: PER_PAGE,
        search,
        tags: tagsParam,
        difficultyMin: committedDifficultyRange[0],
        difficultyMax: committedDifficultyRange[1],
      }),
    [page, search, tagsParam, committedDifficultyRange],
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

  const handleCreateTask = async (opts?: { closeModal?: boolean }) => {
    if (selectedPositionCount === 0 || selectedGroupCount === 0) return;
    setTaskCreating(true);
    try {
      await tasksService.createTask({
        positionIds: Array.from(selectedPositionsRef),
        groupIds: Array.from(selectedGroupsRef),
        publishDefault: publishDefaultRef.current,
      });
      setTaskSnackbar({ message: 'Zadania zostały utworzone!', severity: 'success' });
      selectedPositionsRef.clear();
      setSelectedPositionCount(0);
      setSelectionResetKey(k => k + 1);
      selectedGroupsRef.clear();
      setSelectedGroupCount(0);
      setSidebarResetKey(k => k + 1);
      if (opts?.closeModal) setAssignModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się utworzyć zadania.';
      setTaskSnackbar({ message: msg, severity: 'error' });
    } finally {
      setTaskCreating(false);
    }
  };

  const handleSearchCommit = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  const handleDifficultyCommit = useCallback((range: [number, number]) => {
    setCommittedDifficultyRange(range);
    setPage(1);
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }, []);

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
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
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
                selectedIds={selectedPositionsRef}
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
          individuals={individuals.map(ind => ({ id: ind.groupId, label: ind.playerName }))}
          classes={classes.map(cls => ({ id: cls.groupId, label: cls.name }))}
          loadingGroups={loadingGroups}
          selectedPositionCount={selectedPositionCount}
          selectedGroupCount={selectedGroupCount}
          taskCreating={taskCreating}
          assignModalOpen={assignModalOpen}
          onOpenModal={() => setAssignModalOpen(true)}
          onCloseModal={() => setAssignModalOpen(false)}
          sidebarResetKey={sidebarResetKey}
          onCommitGroup={handleGroupCommit}
          publishDefaultRef={publishDefaultRef}
          onCreateTaskDesktop={() => handleCreateTask()}
          onCreateTaskFromModal={() => handleCreateTask({ closeModal: true })}
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
