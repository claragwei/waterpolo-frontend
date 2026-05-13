import { Button } from './ui/button';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabaseBrowser } from '../lib/supabaseBrowser';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { user, loading } = useAuth();

  const goApp = () => {
    if (loading) return;
    if (supabaseBrowser && !user) onNavigate('login');
    else onNavigate('dashboard');
  };
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive statistical analysis of every match aspect',
    },
    {
      icon: TrendingUp,
      title: 'Performance Tracking',
      description: 'Monitor player and team performance over time',
    },
    {
      icon: Users,
      title: 'Player Insights',
      description: 'Detailed individual player metrics and comparisons',
    },
    {
      icon: Award,
      title: 'Match Reports',
      description: 'Generate professional PDF reports instantly',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#022851] via-[#1a2f4a] to-[#022851]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFBF00] rounded-lg flex items-center justify-center">
              <Award className="text-[#022851]" size={20} />
            </div>
            <h3 className="text-white">UC Davis Water Polo</h3>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => onNavigate('login')}
            >
              Login
            </Button>
            <Button
              className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]"
              onClick={() => onNavigate('login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl text-white mb-6 leading-tight">
              UC Davis Men's Water Polo Analytics Platform
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Advanced performance insights for Aggie water polo. Track player stats, analyze matches, and make data-driven decisions.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851] px-8"
                onClick={goApp}
              >
                Start Analyzing
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-[#FFBF00]/20 rounded-2xl blur-3xl"></div>
            <img
              src="/team/hero.svg"
              alt="Water Polo Analytics"
              className="relative rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl text-white mb-4">Powerful Features for Coaches & Players</h2>
          <p className="text-gray-400 text-lg">Everything you need to analyze and improve performance</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all hover:border-[#FFBF00]/50"
              >
                <div className="w-12 h-12 bg-[#FFBF00]/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-[#FFBF00]" size={24} />
                </div>
                <h3 className="text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400 text-sm">
          <p>© 2025 UC Davis Men's Water Polo Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}