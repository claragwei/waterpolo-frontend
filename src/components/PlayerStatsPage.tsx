import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { User } from 'lucide-react';

export default function PlayerStatsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [statsMap, setStatsMap] = useState<Record<number, any>>({});

  useEffect(() => {
    fetch('http://localhost:8000/api/players?team_id=1')
      .then(res => res.json())
      .then(async (data) => {
        setPlayers(data);
        const stats: Record<number, any> = {};
        await Promise.all(data.map(async (p: any) => {
          try {
            const res = await fetch(`http://localhost:8000/api/players/${p.id}/averages`);
            stats[p.id] = await res.json();
          } catch {
            stats[p.id] = null;
          }
        }));
        setStatsMap(stats);
      })
      .catch(err => console.error('Failed to fetch players:', err));
  }, [selectedSeason]);

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#022851] mb-2">Player Season Stats</h1>
          <p className="text-gray-600">UC Davis Water Polo — individual performance by season</p>
        </div>
        <select
          className="border border-gray-300 rounded-md p-2 text-sm bg-white shadow-sm"
          value={selectedSeason}
          onChange={e => setSelectedSeason(e.target.value)}
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      {/* Player Cards */}
      {players.length === 0 ? (
        <p className="text-gray-500 text-center mt-16">Loading players...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {players.map(player => {
            const s = statsMap[player.id];
            const goals = s?.total_goals ?? '—';
            const avgGoals = s?.avg_goals != null ? Number(s.avg_goals).toFixed(2) : '—';
            const assists = s?.total_assists ?? '—';
            const steals = s?.total_steals ?? '—';
            const shots = s?.total_shots ?? 0;
            const accuracy = shots > 0 && s?.total_goals != null
              ? `${Math.round((s.total_goals / shots) * 100)}%`
              : '—';
            const games = s?.games_played ?? '—';

            return (
              <Card key={player.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Player Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-[#022851] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-[#FFBF00]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-[#022851] font-semibold text-lg">{player.name}</h3>
                    <p className="text-gray-500 text-sm">{games} games played • {selectedSeason}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{goals}</div>
                    <div className="text-xs text-gray-500 mt-1">Goals</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{avgGoals}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg Goals/Game</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{assists}</div>
                    <div className="text-xs text-gray-500 mt-1">Assists</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{steals}</div>
                    <div className="text-xs text-gray-500 mt-1">Steals</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#FFBF00]">{accuracy}</div>
                    <div className="text-xs text-gray-500 mt-1">Shot Accuracy</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{shots}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Shots</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}