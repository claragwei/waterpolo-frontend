import { Button } from './ui/button';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
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
                onClick={() => onNavigate('dashboard')}
              >
                Start Analyzing
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => onNavigate('dashboard')}
              >
                View Demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-[#FFBF00]/20 rounded-2xl blur-3xl"></div>
            <img
              src="https://images.unsplash.com/photo-1709789945357-de0712eb4d72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHBvbG8lMjBtYXRjaCUyMGFjdGlvbnxlbnwxfHx8fDE3NjQ5NzQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-[#FFBF00] to-[#C69214] rounded-2xl p-12 text-center">
          <h2 className="text-3xl text-[#022851] mb-4">Ready to Elevate Your Game?</h2>
          <p className="text-[#022851]/90 text-lg mb-8">
            Join the UC Davis coaching staff using advanced analytics for data-driven insights
          </p>
          <Button
            size="lg"
            className="bg-white text-[#022851] hover:bg-gray-100 px-8"
            onClick={() => onNavigate('dashboard')}
          >
            Get Started Now
          </Button>
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