import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HeatmapsPage from './pages/HeatmapsPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import MatchesPage from './components/MatchesPage';
import MatchDetailsPage from './components/MatchDetailsPage';
import PlayerInsightsPage from './components/PlayerInsightsPage';
import ReportsPage from './components/ReportsPage';
import LiveStatsPage from './components/LiveStatsPageDual';
import SettingsPage from './components/SettingsPage';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/sonner';

function pathToSidebarId(pathname: string): string {
  if (pathname.startsWith('/matches/')) return 'matches';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/matches')) return 'matches';
  if (pathname.startsWith('/players')) return 'players';
  if (pathname.startsWith('/live-stats')) return 'live-stats';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/heatmaps')) return 'heatmaps';
  if (pathname.startsWith('/settings')) return 'settings';
  return '';
}

function useAppNavigate() {
  const navigate = useNavigate();
  return (page: string, matchId?: number) => {
    switch (page) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'matches':
        navigate('/matches');
        break;
      case 'match-details':
        if (matchId != null) navigate(`/matches/${matchId}`);
        break;
      case 'players':
        navigate('/players');
        break;
      case 'live-stats':
        navigate('/live-stats');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'heatmaps':
        navigate('/heatmaps');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/dashboard');
    }
  };
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = pathToSidebarId(location.pathname);

  const go = (id: string) => {
    const path =
      id === 'live-stats'
        ? '/live-stats'
        : id === 'dashboard'
          ? '/dashboard'
          : `/${id}`;
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar currentPage={currentPage} onNavigate={go} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function MatchDetailsRoute() {
  const { matchId } = useParams();
  const id = Number(matchId);
  const onNavigate = useAppNavigate();
  if (!Number.isFinite(id)) return <Navigate to="/matches" replace />;
  return <MatchDetailsPage matchId={id} onNavigate={onNavigate} />;
}

function AppRoutes() {
  const onNavigate = useAppNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={onNavigate} />} />
      <Route path="/login" element={<LoginPage onNavigate={onNavigate} />} />

      <Route
        path="/dashboard"
        element={
          <SidebarLayout>
            <Dashboard />
          </SidebarLayout>
        }
      />
      <Route
        path="/matches"
        element={
          <SidebarLayout>
            <MatchesPage onNavigate={onNavigate} />
          </SidebarLayout>
        }
      />
      <Route
        path="/matches/:matchId"
        element={
          <SidebarLayout>
            <MatchDetailsRoute />
          </SidebarLayout>
        }
      />
      <Route
        path="/players"
        element={
          <SidebarLayout>
            <PlayerInsightsPage onNavigate={onNavigate} />
          </SidebarLayout>
        }
      />
      <Route
        path="/live-stats"
        element={
          <SidebarLayout>
            <LiveStatsPage />
          </SidebarLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <SidebarLayout>
            <ReportsPage />
          </SidebarLayout>
        }
      />
      <Route
        path="/heatmaps"
        element={
          <SidebarLayout>
            <HeatmapsPage />
          </SidebarLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <SidebarLayout>
            <SettingsPage />
          </SidebarLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <AppRoutes />
    </BrowserRouter>
  );
}
