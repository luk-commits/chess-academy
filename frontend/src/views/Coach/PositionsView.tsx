import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Collapse,
  FormControlLabel,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BiotechIcon from '@mui/icons-material/Biotech';
import { Chess } from 'chess.js';
import { positionsService } from '../../services/positionsService';
import { groupsService } from '../../services/groupsService';
import { tasksService } from '../../services/tasksService';
import SelfStatedSlider from '../../components/SelfStated/Slider';
import SelfStatedCheckbox from '../../components/SelfStated/Checkbox';
import SelfStatedText from '../../components/SelfStated/Text';
import PositionCard from '../../components/PositionCard';
import type { PositionItem, IndividualGroup, ClassGroup } from '../../types/position';

const PER_PAGE = 12;

const THEME_TAGS = [
  'advancedPawn', 'advantage', 'anastasiaMate', 'arabianMate', 'attackingF2F7',
  'attraction', 'backRankMate', 'balestraMate', 'bishopEndgame', 'blindSwineMate',
  'bodenMate', 'capturingDefender', 'castling', 'clearance', 'collinearMove',
  'cornerMate', 'crushing', 'defensiveMove', 'deflection', 'discoveredAttack',
  'discoveredCheck', 'doubleBishopMate', 'doubleCheck', 'dovetailMate', 'enPassant',
  'endgame', 'epauletteMate', 'equality', 'exposedKing', 'fork',
  'hangingPiece', 'hookMate', 'interference', 'intermezzo', 'killBoxMate',
  'kingsideAttack', 'knightEndgame', 'long', 'master', 'masterVsMaster',
  'mate', 'mateIn1', 'mateIn2', 'mateIn3', 'mateIn4', 'mateIn5',
  'middlegame', 'morphysMate', 'oneMove', 'opening', 'operaMate',
  'pawnEndgame', 'pillsburysMate', 'pin', 'promotion', 'queenEndgame',
  'queenRookEndgame', 'queensideAttack', 'quietMove', 'rookEndgame', 'sacrifice',
  'short', 'skewer', 'smotheredMate', 'superGM', 'swallowstailMate',
  'trappedPiece', 'triangleMate', 'underPromotion', 'veryLong', 'vukovicMate',
  'xRayAttack', 'zugzwang',
];

function isValidFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

function boardOrientation(fen: string): 'white' | 'black' {
  const turn = fen.split(' ')[1];
  return turn === 'b' ? 'black' : 'white';
}

function applyFirstMove(fen: string, uci: string | null): string {
  if (!uci) return fen;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const move: { from: string; to: string; promotion?: string } = { from, to };
    if (uci.length > 4) {
      move.promotion = uci.slice(4);
    }
    const result = chess.move(move);
    if (!result) return fen;
    return chess.fen();
  } catch {
    return fen;
  }
}

function MobileTabs({
  individuals,
  classes,
  onCommitGroup,
  resetKey,
  loading,
}: {
  individuals: IndividualGroup[];
  classes: ClassGroup[];
  onCommitGroup: (groupId: number, checked: boolean) => void;
  resetKey: number;
  loading: boolean;
}) {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: { lg: 'none' }, mb: 2 }}>
      <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main' }}>
          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 0,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 700, py: 1.5, minHeight: 0 },
              '& .Mui-selected': { color: '#fff !important', bgcolor: 'rgba(255,255,255,0.15)' },
              '& .MuiTabs-indicator': { bgcolor: '#4caf50', height: 3 },
            }}
          >
            <Tab label={`Zawodnicy (${individuals.length})`} />
            <Tab label={`Klasy (${classes.length})`} />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, maxHeight: 220, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : tab === 0 ? (
            individuals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Brak zawodników.</Typography>
            ) : (
              individuals.map(ind => (
                <FormControlLabel
                  key={`${ind.groupId}-${resetKey}`}
                  control={
                    <SelfStatedCheckbox
                      size="small"
                      defaultChecked={false}
                      onCommit={(checked) => onCommitGroup(ind.groupId, checked)}
                    />
                  }
                  label={ind.playerName}
                />
              ))
            )
          ) : (
            classes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Brak klas.</Typography>
            ) : (
              classes.map(cls => (
                <FormControlLabel
                  key={`${cls.groupId}-${resetKey}`}
                  control={
                    <SelfStatedCheckbox
                      size="small"
                      defaultChecked={false}
                      onCommit={(checked) => onCommitGroup(cls.groupId, checked)}
                    />
                  }
                  label={cls.name}
                />
              ))
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export function PositionsView() {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [committedDifficultyRange, setCommittedDifficultyRange] = useState<number[]>([0, 3500]);
  const [cardTagsExpanded, setCardTagsExpanded] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPositionsRef = useRef(new Set<number>());
  const [selectedPositionCount, setSelectedPositionCount] = useState(0);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const selectedGroupsRef = useRef(new Set<number>());
  const [selectedGroupCount, setSelectedGroupCount] = useState(0);
  const [sidebarResetKey, setSidebarResetKey] = useState(0);
  const [individuals, setIndividuals] = useState<IndividualGroup[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
  const publishDefaultRef = useRef(true);
  const [taskSnackbar, setTaskSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      setLoadingGroups(true);
      try {
        const data = await groupsService.fetchCoachGroups();
        if (!cancelled) {
          setIndividuals(data.individuals);
          setClasses(data.classes);
          selectedGroupsRef.current.clear();
          setSelectedGroupCount(0);
          setSidebarResetKey(k => k + 1);
        }
      } catch {
        if (!cancelled) {
          setIndividuals([]);
          setClasses([]);
          selectedGroupsRef.current.clear();
          setSelectedGroupCount(0);
          setSidebarResetKey(k => k + 1);
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    }
    void loadGroups();
    return () => { cancelled = true; };
  }, []);

  const handlePositionToggle = useCallback((id: number) => {
    if (selectedPositionsRef.current.has(id))
      selectedPositionsRef.current.delete(id);
    else
      selectedPositionsRef.current.add(id);
    setSelectedPositionCount(selectedPositionsRef.current.size);
  }, []);

  const handleCopyFen = useCallback((id: number, fen: string) => {
    navigator.clipboard.writeText(fen).catch(() => {});
    setCopiedId(id);
  }, []);

  const handleToggleTags = useCallback((id: number) => {
    setCardTagsExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleGroupCommit = useCallback((groupId: number, checked: boolean) => {
    if (checked) selectedGroupsRef.current.add(groupId);
    else selectedGroupsRef.current.delete(groupId);
    setSelectedGroupCount(selectedGroupsRef.current.size);
  }, []);

  const handleCreateTask = async () => {
    if (selectedPositionCount === 0 || selectedGroupCount === 0) return;
    setTaskCreating(true);
    try {
      await tasksService.createTask({
        positionIds: Array.from(selectedPositionsRef.current),
        groupIds: Array.from(selectedGroupsRef.current),
        publishDefault: publishDefaultRef.current,
      });
      setTaskSnackbar({ message: 'Zadanie zostało utworzone!', severity: 'success' });
      selectedPositionsRef.current.clear();
      setSelectedPositionCount(0);
      setSelectionResetKey(k => k + 1);
      selectedGroupsRef.current.clear();
      setSelectedGroupCount(0);
      setSidebarResetKey(k => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się utworzyć zadania.';
      setTaskSnackbar({ message: msg, severity: 'error' });
    } finally {
      setTaskCreating(false);
    }
  };

  const handleSearch = () => {
    setSearch(inputRef.current?.value.trim() ?? '');
    setPage(1);
  };

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

        if (cancelled) {
          return;
        }

        setPositions(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac pozycji.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPositions();

    return () => {
      cancelled = true;
    };
  }, [page, search, tagsParam, committedDifficultyRange]);

  const emptyMessage = useMemo(() => {
    if (loading) return '';
    if (search !== '' || selectedTags.length > 0) {
      return 'Brak wynikow dla podanych kryteriow.';
    }
    return 'Brak pozycji do wyswietlenia.';
  }, [loading, search, selectedTags]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  alignItems: { xs: 'flex-start', sm: 'center' },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
                  <BiotechIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                </Box>

                <Box
                  component="form"
                  onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSearch(); }}
                  sx={{ display: 'flex', gap: 1, width: '100%' }}
                >
                  <SelfStatedText
                    inputRef={inputRef}
                    defaultValue=""
                    label="Nazwa debiutu"
                    fullWidth
                    onCommit={(val) => {
                      setSearch(val.trim());
                      setPage(1);
                    }}
                  />
                  <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                    Szukaj
                  </Button>
                </Box>
              </Box>

              <SelfStatedSlider
                label="Poziom trudności"
                defaultVal={[0, 3500]}
                min={0}
                max={3500}
                step={100}
                marks={[
                  { value: 0, label: '0' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1000' },
                  { value: 1500, label: '1500' },
                  { value: 2000, label: '2000' },
                  { value: 2500, label: '2500' },
                  { value: 3000, label: '3000' },
                  { value: 3500, label: '3500' },
                ]}
                onCommit={(val) => {
                  setCommittedDifficultyRange(val);
                  setPage(1);
                }}
              />

              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }}
                  onClick={() => setTagsExpanded(prev => !prev)}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Tagi tematyczne ({selectedTags.length} wybrano)
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTagsExpanded(prev => !prev); }}
                  >
                    {tagsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={tagsExpanded}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {THEME_TAGS.map(tag => (
                      <Chip
                        key={tag}
                        size="small"
                        label={tag}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        onClick={() => handleTagToggle(tag)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Collapse>
              </Box>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : positions.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </Paper>
            ) : (
              <>
                <MobileTabs
                  individuals={individuals}
                  classes={classes}
                  onCommitGroup={handleGroupCommit}
                  resetKey={sidebarResetKey}
                  loading={loadingGroups}
                />
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      disabled={selectedPositionCount === 0 || selectedGroupCount === 0 || taskCreating}
                      onClick={handleCreateTask}
                    >
                <Box component="span" sx={{ flex: 1, textAlign: 'right', pr: 1 }}>
                  {taskCreating ? <CircularProgress size={20} color="inherit" /> : 'Dodaj zadania'}
                </Box>
                    </Button>
                    <FormControlLabel
                      control={
                        <SelfStatedCheckbox
                          size="small"
                          defaultChecked={true}
                          onCommit={(c) => { publishDefaultRef.current = c; }}
                        />
                      }
                      label="Opublikuj"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Wszystkich pozycji: {total}
                    {selectedPositionCount > 0 && (
                      <> &middot; Wybrano: {selectedPositionCount}</>
                    )}
                  </Typography>
                  <Pagination
                    color="primary"
                    shape="rounded"
                    count={totalPages}
                    page={page}
                    onChange={(_event, value) => setPage(value)}
                  />
                </Box>

                <Grid container spacing={2}>
                  {positions.map((position) => {
                    const fen = applyFirstMove(position.fen, position.firstMove);
                    const validFen = isValidFen(fen);
                    return (
                      <Grid key={`${selectionResetKey}-${position.id}`} size={{ xs: 12, md: 6, lg: 4 }}>
                        <PositionCard
                          position={position}
                          fen={fen}
                          validFen={validFen}
                          boardOrientation={boardOrientation(fen)}
                          isSelected={selectedPositionsRef.current.has(position.id)}
                          tagsExpanded={!!cardTagsExpanded[position.id]}
                          onToggle={handlePositionToggle}
                          onCopy={handleCopyFen}
                          onToggleTags={handleToggleTags}
                        />
                      </Grid>
                    );
                  })}
                </Grid>

                <Snackbar
                  open={copiedId !== null}
                  autoHideDuration={1500}
                  onClose={() => setCopiedId(null)}
                  message="Skopiowano do schowka"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />
              </>
            )}
          </Box>

          <Box
            sx={{
              width: 260,
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              position: 'sticky',
              top: 88,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 1.5, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Zawodnicy</Typography>
              </Box>
              <Box sx={{ p: 2, maxHeight: 200, overflowY: 'auto' }}>
                {loadingGroups ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : individuals.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Brak zawodników.</Typography>
                ) : (
                  individuals.map(ind => (
                    <FormControlLabel
                      key={`${ind.groupId}-${sidebarResetKey}`}
                      control={
                        <SelfStatedCheckbox
                          size="small"
                          defaultChecked={false}
                          onCommit={(checked) => handleGroupCommit(ind.groupId, checked)}
                        />
                      }
                      label={ind.playerName}
                    />
                  ))
                )}
              </Box>
            </Paper>

            <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden', mt: 2 }}>
              <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 1.5, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Klasy</Typography>
              </Box>
              <Box sx={{ p: 2, maxHeight: 200, overflowY: 'auto' }}>
                {loadingGroups ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : classes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Brak klas.</Typography>
                ) : (
                  classes.map(cls => (
                    <FormControlLabel
                      key={`${cls.groupId}-${sidebarResetKey}`}
                      control={
                        <SelfStatedCheckbox
                          size="small"
                          defaultChecked={false}
                          onCommit={(checked) => handleGroupCommit(cls.groupId, checked)}
                        />
                      }
                      label={cls.name}
                    />
                  ))
                )}
              </Box>
            </Paper>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                disabled={selectedPositionCount === 0 || selectedGroupCount === 0 || taskCreating}
                onClick={handleCreateTask}
                sx={{ justifyContent: 'flex-start', gap: 1, px: 2 }}
              >
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  {taskCreating ? <CircularProgress size={20} color="inherit" /> : 'Dodaj zadania'}
                </Box>
                <Tooltip title="Opublikuj">
                  <Switch
                    defaultChecked
                    color="secondary"
                    onChange={(_, checked) => { publishDefaultRef.current = checked; }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                </Tooltip>
              </Button>
            </Box>

            {selectedPositionCount > 0 && selectedGroupCount > 0 && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                Gotowe ({selectedPositionCount} pozycji, {selectedGroupCount} grup)
              </Alert>
            )}

            {selectedPositionCount === 0 && selectedGroupCount > 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Wybierz pozycję
              </Alert>
            )}

            {selectedPositionCount > 0 && selectedGroupCount === 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Wybierz zawodnika/klasę
              </Alert>
            )}

            {selectedPositionCount === 0 && selectedGroupCount === 0 && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Wybierz pozycje oraz zawodnika/klasę
              </Alert>
            )}
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={taskSnackbar !== null}
        autoHideDuration={4000}
        onClose={() => setTaskSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {taskSnackbar ? (
          <Alert severity={taskSnackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {taskSnackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
