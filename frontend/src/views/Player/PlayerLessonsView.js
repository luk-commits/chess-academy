import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Container, Paper, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
export function PlayerLessonsView() {
    return (_jsx(Box, { sx: { minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }, children: _jsx(Container, { maxWidth: "md", children: _jsxs(Paper, { elevation: 4, sx: { p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }, children: [_jsx(SchoolIcon, { sx: { fontSize: 64, color: 'primary.main', mb: 2 } }), _jsx(Typography, { variant: "h4", gutterBottom: true, children: "Lekcje" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Twoje lekcje szachowe \u2013 przegl\u0105daj materia\u0142y i zadania." })] }) }) }));
}
