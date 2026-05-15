import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { User } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_TEAM_ID = Number(import.meta.env.VITE_UCD_TEAM_ID ?? 1);

type BatchRow = Awaited<ReturnType<typeof api.getPlayersBatchSummary>>[number];

function avgPerGame(total: number, games: number): string | number {
  if (!games) return '—';
  return Math.round((total / games) * 100) / 100;
}

export default function PlayerStatsPage() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPlayersBatchSummary(DEFAULT_TEAM_ID);
        if (!cancel) setRows(data);
      } catch (e) {
        if (!cancel) {
          setError(e instanceof Error ? e.message : 'Failed to load players');
          setRows([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-[#F5F7FA] min-h-screen text-gray-600">Loading player stats…</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#F5F7FA] min-h-screen">
        <h1 className="text-[#022851] mb-2">Player Season Stats</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Player Season Stats</h1>
        <p className="text-gray-600">Season totals from logged matches</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-center mt-16">No active players found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((player) => {
            const games = player.games_played;
            const avgGoals = avgPerGame(player.total_goals, games);
            const avgAssists = avgPerGame(player.total_assists, games);
            const avgSteals = avgPerGame(player.total_steals, games);
            const shotPct = games ? `${player.shot_percentage}%` : '—';

            return (
              <Card
                key={player.id}
                className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-[#022851] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-[#FFBF00]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-[#022851] font-semibold text-lg">{player.name}</h3>
                    <p className="text-gray-500 text-sm">{games} games with stats</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{avgGoals}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg goals</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{avgAssists}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg assists</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">{avgSteals}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg steals</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center col-span-2">
                    <div className="text-2xl font-bold text-[#FFBF00]">{shotPct}</div>
                    <div className="text-xs text-gray-500 mt-1">Shot %</div>
                  </div>
                  <div className="bg-[#F5F7FA] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#022851]">#{player.jersey_number}</div>
                    <div className="text-xs text-gray-500 mt-1">Jersey</div>
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
