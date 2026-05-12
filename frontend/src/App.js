import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { HomeView } from './views/HomeView';
import { PlayerLessonsView } from './views/Player/PlayerLessonsView';
import { CoachesView } from './views/Player/CoachesView';
import { CoachLessonsView } from './views/Coach/CoachLessonsView';
import { PlayersView } from './views/Coach/PlayersView';
import { PositionsView } from './views/Coach/PositionsView';
import { RequireAuth } from './components/RequireAuth';
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/register", element: _jsx(RegisterView, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginView, {}) }), _jsxs(Route, { path: "/home", element: _jsx(RequireAuth, { children: _jsx(HomeView, {}) }), children: [_jsx(Route, { path: "player/lessons", element: _jsx(PlayerLessonsView, {}) }), _jsx(Route, { path: "coach/lessons", element: _jsx(CoachLessonsView, {}) }), _jsx(Route, { path: "player/coaches", element: _jsx(CoachesView, {}) }), _jsx(Route, { path: "coach/players", element: _jsx(PlayersView, {}) }), _jsx(Route, { path: "coach/positions", element: _jsx(PositionsView, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }));
}
