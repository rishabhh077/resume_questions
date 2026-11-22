import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import Generate from './pages/Generate';
import SessionView from './pages/SessionView';
import MockInterview from './pages/MockInterview';
import Saved from './pages/Saved';
import History from './pages/History';
import MockReport from './pages/MockReport';
import Settings from './pages/Settings';
import { Toasts } from './components/ui';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<UploadResume />} />
          <Route path="generate" element={<Generate />} />
          <Route path="sessions/:id" element={<SessionView />} />
          <Route path="mock" element={<MockInterview />} />
          <Route path="mock/:id" element={<MockReport />} />
          <Route path="saved" element={<Saved />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
