import { LayoutDashboard, Trophy, Users, FileText, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'matches', label: 'Matches', icon: Trophy },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'live-stats', label: 'Live Stats', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#022851] text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h2 className="tracking-tight">UC Davis</h2>
        <p className="text-sm text-gray-400 mt-1">Water Polo Analytics</p>
      </div>
      
      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-[#FFBF00] text-[#022851] shadow-lg'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-[#FFBF00] text-[#022851] rounded-full flex items-center justify-center">
            <span>CH</span>
          </div>
          <div>
            <p className="text-sm">Coach Harris</p>
            <p className="text-xs text-gray-400">Head Coach</p>
          </div>
        </div>
      </div>
    </div>
  );
}