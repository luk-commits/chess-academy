import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, Box, } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../hooks/useAuth';
export function TopBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    if (!user)
        return null;
    const handleMenuOpen = (e) => {
        setAnchorEl(e.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        navigate('/login', { replace: true });
    };
    const navItems = user.role === 'PLAYER'
        ? [
            { label: 'Lekcje', path: '/home/player/lessons' },
            { label: 'Trenerzy', path: '/home/player/coaches' },
        ]
        : [
            { label: 'Lekcje', path: '/home/coach/lessons' },
            { label: 'Zawodnicy', path: '/home/coach/players' },
            { label: 'Pozycje', path: '/home/coach/positions' },
        ];
    const isActive = (path) => location.pathname === path;
    return (_jsx(AppBar, { position: "static", sx: { bgcolor: 'primary.dark' }, children: _jsxs(Toolbar, { children: [_jsxs(Box, { component: "button", onClick: () => navigate('/home'), sx: {
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        mr: 4,
                    }, children: [_jsx(EmojiEventsIcon, { sx: { mr: 1 } }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 700 }, children: "ChessAcademy" })] }), navItems.map((item) => (_jsx(Button, { color: "inherit", onClick: () => navigate(item.path), sx: {
                        textTransform: 'none',
                        mx: 0.5,
                        px: 2,
                        fontWeight: isActive(item.path) ? 700 : 400,
                        borderBottom: isActive(item.path) ? '2px solid white' : '2px solid transparent',
                        borderRadius: 0,
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderBottom: '2px solid rgba(255,255,255,0.7)',
                        },
                    }, children: item.label }, item.path))), _jsx(Box, { sx: { flexGrow: 1 } }), _jsxs(Button, { color: "inherit", onClick: handleMenuOpen, sx: { textTransform: 'none' }, children: [_jsx(AccountCircleIcon, { sx: { mr: 0.5 } }), user.email] }), _jsx(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: _jsx(MenuItem, { onClick: handleLogout, children: "Wyloguj" }) })] }) }));
}
