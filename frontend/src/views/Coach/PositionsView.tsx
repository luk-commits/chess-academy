import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Collapse,
  FormControlLabel,
  IconButton,
  Pagination,
  Paper,
  Slider,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BiotechIcon from '@mui/icons-material/Biotech';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { positionsService } from '../../services/positionsService';
import { groupsService } from '../../services/groupsService';
import { tasksService } from '../../services/tasksService';
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
  selectedGroupIds,
  onToggleGroup,
  loading,
}: {
  individuals: IndividualGroup[];
  classes: ClassGroup[];
  selectedGroupIds: number[];
  onToggleGroup: (id: number) => void;
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
                  key={ind.groupId}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedGroupIds.includes(ind.groupId)}
                      onChange={() => onToggleGroup(ind.groupId)}
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
                  key={cls.groupId}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedGroupIds.includes(cls.groupId)}
                      onChange={() => onToggleGroup(cls.groupId)}
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
  const [difficultyRange, setDifficultyRange] = useState<number[]>([0, 3500]);
  const [cardTagsExpanded, setCardTagsExpanded] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [individuals, setIndividuals] = useState<IndividualGroup[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
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
        }
      } catch {
        if (!cancelled) {
          setIndividuals([]);
          setClasses([]);
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    }
    void loadGroups();
    return () => { cancelled = true; };
  }, []);

  const togglePosition = (id: number) => {
    setSelectedPositionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateTask = async () => {
    if (selectedPositionIds.length === 0 || selectedGroupIds.length === 0) return;
    setTaskCreating(true);
    try {
      await tasksService.createTask({
        positionIds: selectedPositionIds,
        groupIds: selectedGroupIds,
      });
      setTaskSnackbar({ message: 'Zadanie zostało utworzone!', severity: 'success' });
      setSelectedPositionIds([]);
      setSelectedGroupIds([]);
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

  const handleDifficultyChange = useCallback((_event: Event, value: number | number[]) => {
    setDifficultyRange(value as number[]);
    setPage(1);
  }, []);

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
          difficultyMin: difficultyRange[0],
          difficultyMax: difficultyRange[1],
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
  }, [page, search, tagsParam, difficultyRange]);

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
                  <TextField
                    inputRef={inputRef}
                    defaultValue=""
                    label="Nazwa debiutu"
                    fullWidth
                  />
                  <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                    Szukaj
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mt: 2, px: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Poziom trudności: {difficultyRange[0]} – {difficultyRange[1]}
                </Typography>
                <Slider
                  value={difficultyRange}
                  onChange={handleDifficultyChange}
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
                  valueLabelDisplay="auto"
                />
              </Box>

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
                  selectedGroupIds={selectedGroupIds}
                  onToggleGroup={toggleGroup}
                  loading={loadingGroups}
                />
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Wszystkich pozycji: {total}
                    {selectedPositionIds.length > 0 && (
                      <> &middot; Wybrano: {selectedPositionIds.length}</>
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
                      <Grid key={position.id} size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card
                          elevation={3}
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: selectedPositionIds.includes(position.id) ? 2 : 0,
                            borderColor: 'primary.main',
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                              <Checkbox
                                size="small"
                                checked={selectedPositionIds.includes(position.id)}
                                onChange={() => togglePosition(position.id)}
                              />
                              <Typography
                                noWrap
                                sx={{ fontWeight: 700 }}
                                title={position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'}
                              >
                                {position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                              {validFen ? (
                                <Box
                                  sx={{
                                    width: '100%',
                                    maxWidth: 290,
                                    '& *': {
                                      cursor: 'default !important',
                                    },
                                  }}
                                >
                                  <Chessboard
                                    options={{
                                      id: `position-${position.id}`,
                                      position: fen,
                                      boardOrientation: boardOrientation(fen),
                                      allowDragging: false,
                                      boardStyle: {
                                        width: '100%',
                                        borderRadius: '8px',
                                      },
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Paper variant="outlined" sx={{ p: 2, width: 290, textAlign: 'center' }}>
                                  <Typography variant="body2" color="error.main">
                                    Niepoprawny FEN
                                  </Typography>
                                </Paper>
                              )}
                            </Box>

                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              value={fen}
                              slotProps={{ htmlInput: { readOnly: true } }}
                              sx={{
                                mb: 1,
                                '& .MuiInputBase-input': {
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace',
                                },
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(fen).catch(() => {});
                                setCopiedId(position.id);
                              }}
                            />

                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              {position.themeTags.length > 0 ? (
                                <>
                                  {(cardTagsExpanded[position.id] ? position.themeTags : position.themeTags.slice(0, 2)).map((tag) => (
                                    <Chip key={tag} size="small" label={tag} />
                                  ))}
                                  {position.themeTags.length > 2 && (
                                    <Chip
                                      size="small"
                                      label={cardTagsExpanded[position.id] ? '▲ mniej' : `+${position.themeTags.length - 2}`}
                                      variant="outlined"
                                      onClick={() => setCardTagsExpanded(prev => ({
                                        ...prev,
                                        [position.id]: !prev[position.id],
                                      }))}
                                      sx={{ cursor: 'pointer' }}
                                    />
                                  )}
                                </>
                              ) : (
                                <Chip size="small" label="Brak tagow" variant="outlined" />
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {position.rating !== null && <Chip size="small" label={`Rating: ${position.rating}`} variant="outlined" />}
                              {position.difficulty !== null && (
                                <Chip size="small" label={`Difficulty: ${position.difficulty}`} variant="outlined" />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
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
              gap: 2,
              position: 'sticky',
              top: 88,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            <Paper elevation={8} sx={{ borderRadius: 3, p: 2 }}>
              <Button
                variant="contained"
                fullWidth
                disabled={selectedPositionIds.length === 0 || selectedGroupIds.length === 0 || taskCreating}
                onClick={handleCreateTask}
              >
                {taskCreating ? <CircularProgress size={20} color="inherit" /> : 'Dodaj zadania'}
              </Button>

              {selectedPositionIds.length > 0 && selectedGroupIds.length > 0 && (
                <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
                  Gotowe ({selectedPositionIds.length} pozycji, {selectedGroupIds.length} grup)
                </Alert>
              )}

              {selectedPositionIds.length === 0 && selectedGroupIds.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                  Wybierz przynajmniej jedną pozycję
                </Alert>
              )}

              {selectedPositionIds.length > 0 && selectedGroupIds.length === 0 && (
                <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                  Wybierz przynajmniej jednego zawodnika/klasę
                </Alert>
              )}

              {selectedPositionIds.length === 0 && selectedGroupIds.length === 0 && (
                <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                  Wybierz pozycje oraz zawodnika/klasę
                </Alert>
              )}
            </Paper>

            <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 1.5 }}>
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
                      key={ind.groupId}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedGroupIds.includes(ind.groupId)}
                          onChange={() => toggleGroup(ind.groupId)}
                        />
                      }
                      label={ind.playerName}
                    />
                  ))
                )}
              </Box>
            </Paper>

            <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 1.5 }}>
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
                      key={cls.groupId}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedGroupIds.includes(cls.groupId)}
                          onChange={() => toggleGroup(cls.groupId)}
                        />
                      }
                      label={cls.name}
                    />
                  ))
                )}
              </Box>
            </Paper>
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
