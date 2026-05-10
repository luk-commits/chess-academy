import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './views/LoginView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
