import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, MapPin, Trophy, Eye } from 'lucide-react';

interface MatchesPageProps {
  onNavigate: (page: string, matchId?: number) => void;
}

export default function MatchesPage({ onNavigate }: MatchesPageProps) {
  const matches = [
    {
      id: 1,
      date: 'Nov 28, 2025',
      time: '14:00',
      opponent: 'Stanford',
      location: 'Aggie Pool',
      result: 'W 15-12',
      status: 'completed',
      possession: 56,
      shots: 24,
      goals: 15,
    },
    {
      id: 2,
      date: 'Nov 22, 2025',
      time: '15:30',
      opponent: 'UCLA',
      location: 'Spieker Aquatics Center',
      result: 'L 11-13',
      status: 'completed',
      possession: 48,
      shots: 20,
      goals: 11,
    },
    {
      id: 3,
      date: 'Nov 15, 2025',
      time: '13:00',
      opponent: 'Cal Berkeley',
      location: 'Aggie Pool',
      result: 'W 14-10',
      status: 'completed',
      possession: 58,
      shots: 22,
      goals: 14,
    },
    {
      id: 4,
      date: 'Nov 8, 2025',
      time: '16:00',
      opponent: 'USC',
      location: 'Uytengsu Aquatics Center',
      result: 'W 16-11',
      status: 'completed',
      possession: 62,
      shots: 26,
      goals: 16,
    },
    {
      id: 5,
      date: 'Oct 28, 2025',
      time: '14:00',
      opponent: 'Pacific',
      location: 'Aggie Pool',
      result: 'W 18-9',
      status: 'completed',
      possession: 68,
      shots: 28,
      goals: 18,
    },
    {
      id: 6,
      date: 'Dec 5, 2025',
      time: '14:00',
      opponent: 'Pepperdine',
      location: 'Aggie Pool',
      result: 'TBD',
      status: 'upcoming',
      possession: 0,
      shots: 0,
      goals: 0,
    },
  ];

  const getResultColor = (result: string) => {
    if (result.startsWith('W')) return 'text-green-600 bg-green-50';
    if (result.startsWith('D')) return 'text-yellow-600 bg-yellow-50';
    if (result.startsWith('L')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[#022851] mb-2">Matches</h1>
          <p className="text-gray-600">View and analyze all match data</p>
        </div>
        <Button className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]">
          <Calendar className="mr-2" size={16} />
          Schedule Match
        </Button>
      </div>

      {/* Upcoming Matches */}
      <div className="mb-8">
        <h2 className="text-[#022851] mb-4">Upcoming Matches</h2>
        <div className="grid gap-4">
          {matches.filter(m => m.status === 'upcoming').map((match) => (
            <Card key={match.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">{match.date}</p>
                    <p className="text-2xl text-[#022851]">{match.time}</p>
                  </div>
                  <div className="w-px h-16 bg-gray-200"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-[#FFBF00]" size={20} />
                      <h3 className="text-[#022851]">vs {match.opponent}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>{match.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
                    Upcoming
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <h2 className="text-[#022851] mb-4">Recent Matches</h2>
        <div className="grid gap-4">
          {matches.filter(m => m.status === 'completed').map((match) => (
            <Card key={match.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">{match.date}</p>
                    <p className={`text-2xl px-4 py-2 rounded-lg ${getResultColor(match.result)}`}>
                      {match.result}
                    </p>
                  </div>
                  <div className="w-px h-16 bg-gray-200"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-[#FFBF00]" size={20} />
                      <h3 className="text-[#022851]">vs {match.opponent}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>{match.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Possession</p>
                      <p className="text-xl text-[#022851]">{match.possession}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Shots</p>
                      <p className="text-xl text-[#022851]">{match.shots}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Goals</p>
                      <p className="text-xl text-[#FFBF00]">{match.goals}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onNavigate('match-details', match.id)}
                    className="bg-[#022851] hover:bg-[#1a2f4a] text-white"
                  >
                    <Eye className="mr-2" size={16} />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}