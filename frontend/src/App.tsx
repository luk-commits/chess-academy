import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { HomeView } from './views/HomeView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/home" element={<HomeView />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
