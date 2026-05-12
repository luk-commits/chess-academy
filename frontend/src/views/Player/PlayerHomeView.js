import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Container, Paper, Typography } from '@mui/material';
import { BrandHeader } from '../../components/BrandHeader';
import { useAuth } from '../../hooks/useAuth';
export function PlayerHomeView() {
    const { user } = useAuth();
    if (!user)
        return null;
    return (_jsx(Box, { sx: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a237e 0%, #534bae 50%, #c2a878 100%)',
            py: 4,
            px: 2,
        }, children: _jsx(Container, { maxWidth: "md", children: _jsxs(Paper, { elevation: 12, sx: {
                    p: { xs: 3, sm: 5 },
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.97)',
                }, children: [_jsx(BrandHeader, {}), _jsxs(Box, { sx: { mt: 4 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Witaj zawodniku!" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Panel zawodnika \u2013 wkr\u00F3tce dost\u0119pne lekcje i lista trener\u00F3w." })] })] }) }) }));
}
