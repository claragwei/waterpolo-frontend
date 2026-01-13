import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import MatchesPage from './components/MatchesPage';
import MatchDetailsPage from './components/MatchDetailsPage';
import PlayerInsightsPage from './components/PlayerInsightsPage';
import ReportsPage from './components/ReportsPage';
import LiveStatsPage from './components/LiveStatsPageDual';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/sonner';

// Frame wrapper component for Figma-like artboards
function Frame({ title, children, width = "1440px" }: { title: string; children: React.ReactNode; width?: string }) {
  return (
    <div className="inline-block align-top" style={{ width }}>
      <div className="mb-4 px-4">
        <h2 className="text-gray-900">{title}</h2>
        <div className="h-px bg-gray-200 mt-2"></div>
      </div>
      <div className="bg-white shadow-2xl" style={{ width }}>
        {children}
      </div>
    </div>
  );
}

// Layout wrapper for pages with sidebar
function SidebarLayout({ children, currentPage }: { children: React.ReactNode; currentPage: string }) {
  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar currentPage={currentPage} onNavigate={() => {}} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const noopNavigate = () => {};

  return (
    <div className="bg-gray-100 p-8">
      <Toaster />
      <div className="mb-8">
        <h1 className="text-4xl text-gray-900 mb-2">UC Davis Water Polo Analytics</h1>
        <p className="text-gray-600 text-lg">Men's Team Performance Dashboard - All pages displayed as frames</p>
      </div>

      <div className="space-y-16">
        {/* Landing Page Frame */}
        <Frame title="Landing Page" width="100%">
          <LandingPage onNavigate={noopNavigate} />
        </Frame>

        {/* Login/Register Frame */}
        <Frame title="Login/Register" width="100%">
          <LoginPage onNavigate={noopNavigate} />
        </Frame>

        {/* Dashboard Frame */}
        <Frame title="Dashboard" width="100%">
          <SidebarLayout currentPage="dashboard">
            <Dashboard />
          </SidebarLayout>
        </Frame>

        {/* Matches Frame */}
        <Frame title="Matches" width="100%">
          <SidebarLayout currentPage="matches">
            <MatchesPage onNavigate={noopNavigate} />
          </SidebarLayout>
        </Frame>

        {/* Match Details Frame */}
        <Frame title="Match Details" width="100%">
          <SidebarLayout currentPage="matches">
            <MatchDetailsPage matchId={1} onNavigate={noopNavigate} />
          </SidebarLayout>
        </Frame>

        {/* Player Insights Frame */}
        <Frame title="Player Insights" width="100%">
          <SidebarLayout currentPage="players">
            <PlayerInsightsPage onNavigate={noopNavigate} />
          </SidebarLayout>
        </Frame>

        {/* Reports Frame */}
        <Frame title="Reports" width="100%">
          <SidebarLayout currentPage="reports">
            <ReportsPage />
          </SidebarLayout>
        </Frame>

        {/* Live Stats Frame */}
        <Frame title="Live Stats (Coach)" width="100%">
          <SidebarLayout currentPage="live-stats">
            <LiveStatsPage />
          </SidebarLayout>
        </Frame>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 pb-8">
        <p>© 2025 UC Davis Men's Water Polo - Analytics Platform</p>
      </div>
    </div>
  );
}