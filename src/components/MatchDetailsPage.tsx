import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface MatchDetailsPageProps {
  matchId: number;
  onNavigate: (page: string) => void;
}

export default function MatchDetailsPage({ matchId, onNavigate }: MatchDetailsPageProps) {
  const matchData = {
    id: matchId,
    date: 'November 28, 2025',
    opponent: 'Stanford',
    result: 'W 15-12',
    location: 'Aggie Pool',
  };

  const teamComparison = [
    { metric: 'Possession', ourTeam: 56, opponent: 44 },
    { metric: 'Shots', ourTeam: 24, opponent: 18 },
    { metric: 'On Target', ourTeam: 19, opponent: 14 },
    { metric: 'Saves', ourTeam: 11, opponent: 8 },
    { metric: 'Steals', ourTeam: 9, opponent: 6 },
  ];

  const radarData = [
    { subject: 'Possession', A: 56, B: 44, fullMark: 100 },
    { subject: 'Shots', A: 24, B: 18, fullMark: 30 },
    { subject: 'Accuracy', A: 79, B: 72, fullMark: 100 },
    { subject: 'Steals', A: 9, B: 6, fullMark: 15 },
    { subject: 'Saves', A: 11, B: 8, fullMark: 15 },
  ];

  const topPlayers = [
    { name: 'Jake Morrison', position: 'Center', goals: 5, assists: 2, rating: 9.2, photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400' },
    { name: 'Marcus Silva', position: 'Attacker', goals: 4, assists: 3, rating: 8.8, photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400' },
    { name: 'Ryan Chen', position: 'Goalkeeper', goals: 0, assists: 1, rating: 8.9, photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400' },
  ];

  const keyStats = [
    { label: 'Ball Possession', value: '56%', color: 'bg-yellow-500' },
    { label: 'Shot Accuracy', value: '79%', color: 'bg-blue-700' },
    { label: 'Goals Scored', value: '15', color: 'bg-purple-500' },
    { label: 'Total Saves', value: '11', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 text-gray-600 hover:text-[#022851]"
          onClick={() => onNavigate('matches')}
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Matches
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#022851] mb-2">Match Details</h1>
            <p className="text-gray-600">{matchData.date} • {matchData.location}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-gray-300">
              <Share2 className="mr-2" size={16} />
              Share
            </Button>
            <Button className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]">
              <Download className="mr-2" size={16} />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Match Result */}
      <Card className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-center gap-12">
          <div className="text-center">
            <h2 className="text-[#022851] mb-2">UC Davis</h2>
            <div className="w-20 h-20 bg-[#FFBF00] rounded-full flex items-center justify-center text-[#022851] text-3xl mb-2">
              15
            </div>
          </div>
          <div className="text-6xl text-gray-300">VS</div>
          <div className="text-center">
            <h2 className="text-[#022851] mb-2">{matchData.opponent}</h2>
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-white text-3xl mb-2">
              12
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyStats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <div className="w-6 h-6 bg-white/30 rounded"></div>
            </div>
            <h3 className="text-3xl text-[#022851] mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Team Comparison */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Team Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" />
              <YAxis dataKey="metric" type="category" stroke="#6B7280" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ourTeam" fill="#FFBF00" name="UC Davis" radius={[0, 8, 8, 0]} />
              <Bar dataKey="opponent" fill="#022851" name="Opponent" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Radar */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
              <PolarRadiusAxis stroke="#6B7280" />
              <Radar name="UC Davis" dataKey="A" stroke="#FFBF00" fill="#FFBF00" fillOpacity={0.3} />
              <Radar name="Opponent" dataKey="B" stroke="#022851" fill="#022851" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Players */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-6">Top Performing Players</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPlayers.map((player, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
              <img
                src={player.photo}
                alt={player.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-[#FFBF00]"
              />
              <h4 className="text-[#022851] mb-1">{player.name}</h4>
              <p className="text-gray-600 text-sm mb-4">{player.position}</p>
              <div className="flex justify-center gap-4 mb-4">
                <div>
                  <p className="text-2xl text-[#022851]">{player.goals}</p>
                  <p className="text-xs text-gray-600">Goals</p>
                </div>
                <div className="w-px bg-gray-300"></div>
                <div>
                  <p className="text-2xl text-[#022851]">{player.assists}</p>
                  <p className="text-xs text-gray-600">Assists</p>
                </div>
              </div>
              <div className="bg-[#FFBF00] text-[#022851] px-4 py-2 rounded-lg inline-block">
                Rating: {player.rating}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
