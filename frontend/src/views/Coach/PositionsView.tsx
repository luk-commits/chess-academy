import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { positionsService } from '../../services/positionsService';
import { groupsService } from '../../services/groupsService';
import { tasksService } from '../../services/tasksService';
import { TaskAssignmentSection } from '../../components/tasks/TaskAssignmentSection';
import type { PositionItem, IndividualGroup, ClassGroup } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { CopyFeedbackSnackbar } from '../../components/feedback/CopyFeedbackSnackbar';
import { AlertSnackbar } from '../../components/feedback/AlertSnackbar';
import { PositionGrid } from '../../components/positions/PositionGrid';
import { PositionsToolbar } from '../../components/positions/PositionsToolbar';
import { PaginationSummary } from '../../components/positions/PaginationSummary';
import { useCardTagsExpanded } from '../../hooks/useCardTagsExpanded';

const PER_PAGE = 12;

export function PositionsView() {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [committedDifficultyRange, setCommittedDifficultyRange] = useState<number[]>([0, 3500]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPositionsRef = useMemo(() => new Set<number>(), []);
  const [selectedPositionCount, setSelectedPositionCount] = useState(0);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const selectedGroupsRef = useMemo(() => new Set<number>(), []);
  const [selectedGroupCount, setSelectedGroupCount] = useState(0);
  const [sidebarResetKey, setSidebarResetKey] = useState(0);
  const [individuals, setIndividuals] = useState<IndividualGroup[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
  const publishDefaultRef = useMemo(() => ({ current: true }), []);
  const [taskSnackbar, setTaskSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { expanded: cardTagsExpanded, toggle: handleToggleTags } = useCardTagsExpanded();

  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      setLoadingGroups(true);
      try {
        const data = await groupsService.fetchCoachGroups();
        if (!cancelled) {
          setIndividuals(data.individuals);
          setClasses(data.classes);
          selectedGroupsRef.clear();
          setSelectedGroupCount(0);
          setSidebarResetKey(k => k + 1);
        }
      } catch {
        if (!cancelled) {
          setIndividuals([]);
          setClasses([]);
          selectedGroupsRef.clear();
          setSelectedGroupCount(0);
          setSidebarResetKey(k => k + 1);
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    }
    void loadGroups();
    return () => { cancelled = true; };
  }, [selectedGroupsRef]);

  const handlePositionToggle = useCallback((id: number) => {
    if (selectedPositionsRef.has(id))
      selectedPositionsRef.delete(id);
    else
      selectedPositionsRef.add(id);
    setSelectedPositionCount(selectedPositionsRef.size);
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

  const tagsParam = useMemo(() => selectedTags.join(','), [selectedTags]);

  useEffect(() => {
    let cancelled = false;

    async function loadPositions() {
      setLoading(true);
      setError(null);

      try {
        const response = await positionsService.fetchCoachPositions({
          page,
          perPage: PER_PAGE,
          search,
          tags: tagsParam,
          difficultyMin: committedDifficultyRange[0],
          difficultyMax: committedDifficultyRange[1],
        });

        if (cancelled) return;

        setPositions(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac pozycji.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPositions();

    return () => { cancelled = true; };
  }, [page, search, tagsParam, committedDifficultyRange]);

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

              <CopyFeedbackSnackbar
                open={copiedId !== null}
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

      <AlertSnackbar
        open={taskSnackbar !== null}
        message={taskSnackbar?.message ?? ''}
        severity={taskSnackbar?.severity ?? 'success'}
        onClose={() => setTaskSnackbar(null)}
      />
    </PageLayout>
  );
}
