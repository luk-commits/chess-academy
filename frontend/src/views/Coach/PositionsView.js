import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Collapse, IconButton, Pagination, Paper, Slider, Snackbar, TextField, Typography, } from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BiotechIcon from '@mui/icons-material/Biotech';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { positionsService } from '../../services/positionsService';
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
function isValidFen(fen) {
    try {
        const chess = new Chess();
        chess.load(fen);
        return true;
    }
    catch {
        return false;
    }
}
function boardOrientation(fen) {
    const turn = fen.split(' ')[1];
    return turn === 'b' ? 'black' : 'white';
}
function applyFirstMove(fen, uci) {
    if (!uci)
        return fen;
    try {
        const chess = new Chess(fen);
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const move = { from, to };
        if (uci.length > 4) {
            move.promotion = uci.slice(4);
        }
        const result = chess.move(move);
        if (!result)
            return fen;
        return chess.fen();
    }
    catch {
        return fen;
    }
}
export function PositionsView() {
    const [positions, setPositions] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const [difficultyRange, setDifficultyRange] = useState([0, 3500]);
    const [cardTagsExpanded, setCardTagsExpanded] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const handleSearch = () => {
        setSearch(inputRef.current?.value.trim() ?? '');
        setPage(1);
    };
    const handleTagToggle = useCallback((tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
        setPage(1);
    }, []);
    const tagsParam = useMemo(() => selectedTags.join(','), [selectedTags]);
    const handleDifficultyChange = useCallback((_event, value) => {
        setDifficultyRange(value);
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
            }
            catch (err) {
                if (cancelled) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac pozycji.');
            }
            finally {
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
        if (loading)
            return '';
        if (search !== '' || selectedTags.length > 0) {
            return 'Brak wynikow dla podanych kryteriow.';
        }
        return 'Brak pozycji do wyswietlenia.';
    }, [loading, search, selectedTags]);
    return (_jsx(Box, { sx: { minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }, children: _jsxs(Container, { maxWidth: "lg", children: [_jsxs(Paper, { elevation: 4, sx: { p: { xs: 2, sm: 3 }, borderRadius: 4, mb: 3 }, children: [_jsxs(Box, { sx: {
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                alignItems: { xs: 'flex-start', sm: 'center' },
                            }, children: [_jsx(Box, { sx: { display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }, children: _jsx(BiotechIcon, { sx: { fontSize: 36, color: 'primary.main' } }) }), _jsxs(Box, { component: "form", onSubmit: (e) => { e.preventDefault(); handleSearch(); }, sx: { display: 'flex', gap: 1, width: '100%' }, children: [_jsx(TextField, { inputRef: inputRef, defaultValue: "", label: "Nazwa debiutu", fullWidth: true }), _jsx(Button, { type: "submit", variant: "contained", sx: { whiteSpace: 'nowrap' }, children: "Szukaj" })] })] }), _jsxs(Box, { sx: { mt: 2, px: 1 }, children: [_jsxs(Typography, { variant: "subtitle2", color: "text.secondary", gutterBottom: true, children: ["Poziom trudno\u015Bci: ", difficultyRange[0], " \u2013 ", difficultyRange[1]] }), _jsx(Slider, { value: difficultyRange, onChange: handleDifficultyChange, min: 0, max: 3500, step: 100, marks: [
                                        { value: 0, label: '0' },
                                        { value: 500, label: '500' },
                                        { value: 1000, label: '1000' },
                                        { value: 1500, label: '1500' },
                                        { value: 2000, label: '2000' },
                                        { value: 2500, label: '2500' },
                                        { value: 3000, label: '3000' },
                                        { value: 3500, label: '3500' },
                                    ], valueLabelDisplay: "auto" })] }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }, onClick: () => setTagsExpanded(prev => !prev), children: [_jsxs(Typography, { variant: "subtitle2", color: "text.secondary", children: ["Tagi tematyczne (", selectedTags.length, " wybrano)"] }), _jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); setTagsExpanded(prev => !prev); }, children: tagsExpanded ? _jsx(ExpandLessIcon, {}) : _jsx(ExpandMoreIcon, {}) })] }), _jsx(Collapse, { in: tagsExpanded, children: _jsx(Box, { sx: { display: 'flex', gap: 0.5, flexWrap: 'wrap' }, children: THEME_TAGS.map(tag => (_jsx(Chip, { size: "small", label: tag, color: selectedTags.includes(tag) ? 'primary' : 'default', variant: selectedTags.includes(tag) ? 'filled' : 'outlined', onClick: () => handleTagToggle(tag), sx: { cursor: 'pointer' } }, tag))) }) })] })] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), loading ? (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', py: 8 }, children: _jsx(CircularProgress, {}) })) : positions.length === 0 ? (_jsx(Paper, { elevation: 1, sx: { p: 4, borderRadius: 3, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: emptyMessage }) })) : (_jsxs(_Fragment, { children: [_jsxs(Box, { sx: { mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Wszystkich pozycji: ", total] }), _jsx(Pagination, { color: "primary", shape: "rounded", count: totalPages, page: page, onChange: (_event, value) => setPage(value) })] }), _jsx(Grid, { container: true, spacing: 2, children: positions.map((position) => {
                                const fen = applyFirstMove(position.fen, position.firstMove);
                                const validFen = isValidFen(fen);
                                return (_jsx(Grid, { size: { xs: 12, md: 6, lg: 4 }, children: _jsx(Card, { elevation: 3, sx: { height: '100%', borderRadius: 3 }, children: _jsxs(CardContent, { children: [_jsx(Box, { sx: { textAlign: 'center', mb: 1 }, children: _jsx(Typography, { noWrap: true, sx: { fontWeight: 700 }, title: position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie', children: position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie' }) }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'center', mb: 1.5 }, children: validFen ? (_jsx(Box, { sx: {
                                                            width: '100%',
                                                            maxWidth: 290,
                                                            '& *': {
                                                                cursor: 'default !important',
                                                            },
                                                        }, children: _jsx(Chessboard, { options: {
                                                                id: `position-${position.id}`,
                                                                position: fen,
                                                                boardOrientation: boardOrientation(fen),
                                                                allowDragging: false,
                                                                boardStyle: {
                                                                    width: '100%',
                                                                    borderRadius: '8px',
                                                                },
                                                            } }) })) : (_jsx(Paper, { variant: "outlined", sx: { p: 2, width: 290, textAlign: 'center' }, children: _jsx(Typography, { variant: "body2", color: "error.main", children: "Niepoprawny FEN" }) })) }), _jsx(TextField, { fullWidth: true, size: "small", variant: "outlined", value: fen, slotProps: { htmlInput: { readOnly: true } }, sx: {
                                                        mb: 1,
                                                        '& .MuiInputBase-input': {
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem',
                                                            fontFamily: 'monospace',
                                                        },
                                                    }, onClick: () => {
                                                        navigator.clipboard.writeText(fen).catch(() => { });
                                                        setCopiedId(position.id);
                                                    } }), _jsx(Box, { sx: { display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }, children: position.themeTags.length > 0 ? (_jsxs(_Fragment, { children: [(cardTagsExpanded[position.id] ? position.themeTags : position.themeTags.slice(0, 2)).map((tag) => (_jsx(Chip, { size: "small", label: tag }, tag))), position.themeTags.length > 2 && (_jsx(Chip, { size: "small", label: cardTagsExpanded[position.id] ? '▲ mniej' : `+${position.themeTags.length - 2}`, variant: "outlined", onClick: () => setCardTagsExpanded(prev => ({
                                                                    ...prev,
                                                                    [position.id]: !prev[position.id],
                                                                })), sx: { cursor: 'pointer' } }))] })) : (_jsx(Chip, { size: "small", label: "Brak tagow", variant: "outlined" })) }), _jsxs(Box, { sx: { display: 'flex', gap: 1, flexWrap: 'wrap' }, children: [position.rating !== null && _jsx(Chip, { size: "small", label: `Rating: ${position.rating}`, variant: "outlined" }), position.difficulty !== null && (_jsx(Chip, { size: "small", label: `Difficulty: ${position.difficulty}`, variant: "outlined" }))] })] }) }) }, position.id));
                            }) }), _jsx(Snackbar, { open: copiedId !== null, autoHideDuration: 1500, onClose: () => setCopiedId(null), message: "Skopiowano do schowka", anchorOrigin: { vertical: 'bottom', horizontal: 'center' } })] }))] }) }));
}
