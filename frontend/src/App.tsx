import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { HomeView } from './views/HomeView';
import { PlayerLessonsView } from './views/Player/PlayerLessonsView';
import { CoachesView } from './views/Player/CoachesView';
import { PlayerTasksView } from './views/Player/PlayerTasksView';
import { PlayerTaskDetailsView } from './views/Player/PlayerTaskDetailsView';
import { CoachLessonsView } from './views/Coach/CoachLessonsView';
import { PlayersView } from './views/Coach/PlayersView';
import { PositionsView } from './views/Coach/PositionsView';
import { RequireAuth } from './components/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/home" element={<RequireAuth><HomeView /></RequireAuth>}>
        <Route path="player/lessons" element={<PlayerLessonsView />} />
        <Route path="coach/lessons" element={<CoachLessonsView />} />
        <Route path="player/coaches" element={<CoachesView />} />
        <Route path="player/tasks" element={<PlayerTasksView />} />
        <Route path="player/tasks/:taskId" element={<PlayerTaskDetailsView />} />
        <Route path="player/tasks/:taskId/stages/:stageId" element={<PlayerTaskDetailsView />} />
        <Route path="coach/players" element={<PlayersView />} />
        <Route path="coach/positions" element={<PositionsView />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
