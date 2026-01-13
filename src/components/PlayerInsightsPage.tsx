import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Award, TrendingUp, Activity, Target, Search, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PlayerInsightsPageProps {
  onNavigate: (page: string) => void;
}

// Water polo player data
const allPlayers = [
  {
    id: 1,
    name: 'Jake Morrison',
    position: 'Center',
    number: 7,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 28,
      assists: 12,
      steals: 15,
      shotAccuracy: 72,
      ejections: 8,
      saves: 0,
      matchesPlayed: 15,
    },
  },
  {
    id: 2,
    name: 'Ryan Chen',
    position: 'Goalkeeper',
    number: 1,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 0,
      assists: 2,
      steals: 4,
      shotAccuracy: 0,
      ejections: 1,
      saves: 87,
      matchesPlayed: 15,
    },
  },
  {
    id: 3,
    name: 'Marcus Silva',
    position: 'Attacker',
    number: 9,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 35,
      assists: 18,
      steals: 12,
      shotAccuracy: 68,
      ejections: 5,
      saves: 0,
      matchesPlayed: 15,
    },
  },
  {
    id: 4,
    name: 'David Lopez',
    position: 'Defender',
    number: 4,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 8,
      assists: 10,
      steals: 22,
      shotAccuracy: 55,
      ejections: 12,
      saves: 0,
      matchesPlayed: 15,
    },
  },
  {
    id: 5,
    name: 'Alex Johnson',
    position: 'Utility',
    number: 11,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 22,
      assists: 15,
      steals: 18,
      shotAccuracy: 64,
      ejections: 7,
      saves: 0,
      matchesPlayed: 15,
    },
  },
  {
    id: 6,
    name: 'Chris Taylor',
    position: 'Attacker',
    number: 10,
    team: 'UC Davis Aggies',
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
    stats: {
      goals: 31,
      assists: 14,
      steals: 9,
      shotAccuracy: 70,
      ejections: 6,
      saves: 0,
      matchesPlayed: 15,
    },
  },
];

type SortField = 'goals' | 'assists' | 'steals' | 'shotAccuracy' | 'saves';

export default function PlayerInsightsPage({ onNavigate }: PlayerInsightsPageProps) {
  const [selectedPlayer, setSelectedPlayer] = useState(allPlayers[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('goals');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter players by search query
  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort players based on selected field and order
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aValue = a.stats[sortField];
    const bValue = b.stats[sortField];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  // Find player by name and show average stats
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && filteredPlayers.length > 0) {
      setSelectedPlayer(filteredPlayers[0]);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const performanceData = [
    { match: 'Match 1', rating: 7.5, goals: 2 },
    { match: 'Match 2', rating: 8.2, goals: 3 },
    { match: 'Match 3', rating: 7.8, goals: 1 },
    { match: 'Match 4', rating: 9.1, goals: 4 },
    { match: 'Match 5', rating: 8.5, goals: 3 },
    { match: 'Match 6', rating: 8.8, goals: 2 },
  ];

  const statsComparison = [
    { metric: 'Goals', value: selectedPlayer.stats.goals, max: 40 },
    { metric: 'Assists', value: selectedPlayer.stats.assists, max: 25 },
    { metric: 'Steals', value: selectedPlayer.stats.steals, max: 25 },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Player Insights</h1>
        <p className="text-gray-600">Detailed performance analysis for UC Davis water polo players</p>
      </div>

      {/* Player Search and Sort Controls */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search player by name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortField === 'goals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('goals')}
              className={sortField === 'goals' ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#C69214]' : ''}
            >
              <ArrowUpDown size={16} className="mr-1" />
              Goals
            </Button>
            <Button
              variant={sortField === 'assists' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('assists')}
              className={sortField === 'assists' ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#C69214]' : ''}
            >
              <ArrowUpDown size={16} className="mr-1" />
              Assists
            </Button>
            <Button
              variant={sortField === 'steals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('steals')}
              className={sortField === 'steals' ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#C69214]' : ''}
            >
              <ArrowUpDown size={16} className="mr-1" />
              Steals
            </Button>
            <Button
              variant={sortField === 'saves' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('saves')}
              className={sortField === 'saves' ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#C69214]' : ''}
            >
              <ArrowUpDown size={16} className="mr-1" />
              Saves
            </Button>
          </div>
        </div>
      </Card>

      {/* Player Leaderboard */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-[#022851] mb-6">
          Player Rankings - Sorted by {sortField.charAt(0).toUpperCase() + sortField.slice(1)} ({sortOrder === 'desc' ? 'Highest First' : 'Lowest First'})
        </h3>
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                selectedPlayer.id === player.id
                  ? 'bg-yellow-50 border-2 border-[#FFBF00]'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#022851] text-white rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#FFBF00]"
                />
                <div>
                  <p className="text-[#022851]">{player.name}</p>
                  <p className="text-gray-600 text-sm">{player.position} • #{player.number}</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Goals</p>
                  <p className="text-[#022851]">{player.stats.goals}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Assists</p>
                  <p className="text-[#022851]">{player.stats.assists}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Steals</p>
                  <p className="text-[#022851]">{player.stats.steals}</p>
                </div>
                {player.stats.saves > 0 && (
                  <div className="text-center">
                    <p className="text-gray-500">Saves</p>
                    <p className="text-[#022851]">{player.stats.saves}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Player Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <img
              src={selectedPlayer.photo}
              alt={selectedPlayer.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-[#FFBF00]"
            />
            <h2 className="text-[#022851] mb-1">{selectedPlayer.name}</h2>
            <p className="text-gray-600 mb-4">{selectedPlayer.position}</p>
            <div className="flex justify-center gap-4 mb-6">
              <div className="bg-[#022851] text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl">
                {selectedPlayer.number}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Team</span>
                <span className="text-[#022851]">{selectedPlayer.team}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Matches Played</span>
                <span className="text-[#022851]">{selectedPlayer.stats.matchesPlayed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Goals/Game</span>
                <span className="text-[#022851]">
                  {(selectedPlayer.stats.goals / selectedPlayer.stats.matchesPlayed).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Stats */}
        <Card className="lg:col-span-2 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Key Statistics</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Goals</p>
                  <p className="text-3xl text-[#022851]">{selectedPlayer.stats.goals}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Assists</p>
                  <p className="text-3xl text-[#022851]">{selectedPlayer.stats.assists}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Steals</p>
                  <p className="text-3xl text-[#022851]">{selectedPlayer.stats.steals}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    {selectedPlayer.position === 'Goalkeeper' ? 'Saves' : 'Shot Accuracy'}
                  </p>
                  <p className="text-3xl text-[#022851]">
                    {selectedPlayer.position === 'Goalkeeper' 
                      ? selectedPlayer.stats.saves 
                      : `${selectedPlayer.stats.shotAccuracy}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="match" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rating" stroke="#FFBF00" strokeWidth={2} name="Rating" />
              <Line type="monotone" dataKey="goals" stroke="#022851" strokeWidth={2} name="Goals" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Stats Comparison */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Season Statistics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statsComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="metric" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#FFBF00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
