import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Container, Paper, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
export function CoachesView() {
    return (_jsx(Box, { sx: { minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }, children: _jsx(Container, { maxWidth: "md", children: _jsxs(Paper, { elevation: 4, sx: { p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }, children: [_jsx(GroupIcon, { sx: { fontSize: 64, color: 'primary.main', mb: 2 } }), _jsx(Typography, { variant: "h4", gutterBottom: true, children: "Trenerzy" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Lista dost\u0119pnych trener\u00F3w szachowych." })] }) }) }));
}
