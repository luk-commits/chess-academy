import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { PlayerHomeView } from './Player/PlayerHomeView';
import { CoachHomeView } from './Coach/CoachHomeView';
export function HomeView() {
    const { user } = useAuth();
    const location = useLocation();
    if (!user)
        return null;
    if (location.pathname === '/home') {
        return (_jsxs(_Fragment, { children: [_jsx(TopBar, {}), user.role === 'PLAYER' ? _jsx(PlayerHomeView, {}) : _jsx(CoachHomeView, {})] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(TopBar, {}), _jsx(Outlet, {})] }));
}
