import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
export function BrandHeader() {
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }, children: [_jsx(Box, { sx: {
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 8px 24px rgba(26, 35, 126, 0.25)',
                }, children: _jsx(EmojiEventsIcon, { fontSize: "large" }) }), _jsx(Typography, { variant: "h4", component: "h1", color: "primary.dark", children: "ChessAcademy" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Profesjonalna platforma trenerska" })] }));
}
