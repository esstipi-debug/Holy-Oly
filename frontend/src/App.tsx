import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PhoneLayout from './layouts/PhoneLayout';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import DevNav from './components/DevNav';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import AtletaHome from './pages/AtletaHome';
import SessionSummaryPreview from './pages/SessionSummaryPreview';
import WarmupGenerator from './pages/WarmupGenerator';
import ActiveSession from './pages/ActiveSession';
import VictoryScreen from './pages/VictoryScreen';
import PerformanceDeepDive from './pages/PerformanceDeepDive';
import OlyIndex from './pages/OlyIndex';
import SessionSchedule from './pages/SessionSchedule';
import PulseHub from './pages/PulseHub';
import KnowledgePills from './pages/KnowledgePills';
import SocialCard from './pages/SocialCard';
import Profile from './pages/Profile';
import CommandCenter from './pages/CommandCenter';
import AthleteDeepDive from './pages/AthleteDeepDive';
import AssignMacrocycle from './pages/AssignMacrocycle';
import InjuryShield from './pages/InjuryShield';
import ThemeGallery from './pages/ThemeGallery';
import CoachTools from './pages/CoachTools';
import FreePremium from './pages/FreePremium';
import VoltaDashboard from './pages/volta/VoltaDashboard';
import VoltaSession from './pages/volta/VoltaSession';
import VoltaVictory from './pages/volta/VoltaVictory';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'coach' || user.role === 'admin' ? '/coach' : '/home'} replace />;
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    <PhoneLayout>{children}</PhoneLayout>
    {import.meta.env.DEV && <DevNav />}
  </div>
);

const Athlete = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={['athlete']}><Shell>{children}</Shell></ProtectedRoute>
);
const Coach = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={['coach', 'admin']}><Shell>{children}</Shell></ProtectedRoute>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Shell><Login /></Shell>} />

        <Route path="/onboarding" element={<Athlete><Onboarding /></Athlete>} />
        <Route path="/home" element={<Athlete><AtletaHome /></Athlete>} />
        <Route path="/summary" element={<Athlete><SessionSummaryPreview /></Athlete>} />
        <Route path="/warmup" element={<Athlete><WarmupGenerator /></Athlete>} />
        <Route path="/session" element={<Athlete><ActiveSession /></Athlete>} />
        <Route path="/victory" element={<Athlete><VictoryScreen /></Athlete>} />
        <Route path="/performance" element={<Athlete><PerformanceDeepDive /></Athlete>} />
        <Route path="/oly-index" element={<Athlete><OlyIndex /></Athlete>} />
        <Route path="/schedule" element={<Athlete><SessionSchedule /></Athlete>} />
        <Route path="/pulse" element={<Athlete><PulseHub /></Athlete>} />
        <Route path="/pills" element={<Athlete><KnowledgePills /></Athlete>} />
        <Route path="/social" element={<Athlete><SocialCard /></Athlete>} />
        <Route path="/profile" element={<Athlete><Profile /></Athlete>} />

        <Route path="/coach" element={<Coach><CommandCenter /></Coach>} />
        <Route path="/coach/athlete" element={<Coach><AthleteDeepDive /></Coach>} />
        <Route path="/coach/athlete/:id" element={<Coach><AthleteDeepDive /></Coach>} />
        <Route path="/coach/assign" element={<Coach><AssignMacrocycle /></Coach>} />
        <Route path="/coach/tools" element={<Coach><CoachTools /></Coach>} />

        <Route path="/injury" element={<Athlete><InjuryShield /></Athlete>} />
        <Route path="/themes" element={<Athlete><ThemeGallery /></Athlete>} />
        <Route path="/premium" element={<Athlete><FreePremium /></Athlete>} />
        <Route path="/volta" element={<Athlete><VoltaDashboard /></Athlete>} />
        <Route path="/volta/session" element={<Athlete><VoltaSession /></Athlete>} />
        <Route path="/volta/victory" element={<Athlete><VoltaVictory /></Athlete>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
