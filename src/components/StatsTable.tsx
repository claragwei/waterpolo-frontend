import { Card } from './ui/card';
import type { PlayerStat } from '../types';

interface StatsTableProps {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
}

export default function StatsTable({ ucDavisPlayerStats, opponentPlayerStats }: StatsTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-4">UC Davis Players</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-[#022851]">Player</th>
                <th className="text-center py-2 text-[#022851]">G</th>
                <th className="text-center py-2 text-[#022851]">A</th>
                <th className="text-center py-2 text-[#022851]">S</th>
              </tr>
            </thead>
            <tbody>
              {ucDavisPlayerStats.map((player) => (
                <tr key={player.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 text-gray-900">{player.playerName.split(' ')[0]}</td>
                  <td className="text-center py-2 text-gray-700">{player.goals}</td>
                  <td className="text-center py-2 text-gray-700">{player.assists}</td>
                  <td className="text-center py-2 text-gray-700">{player.steals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-4">Opponent Players</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-[#022851]">Player</th>
                <th className="text-center py-2 text-[#022851]">G</th>
                <th className="text-center py-2 text-[#022851]">A</th>
                <th className="text-center py-2 text-[#022851]">S</th>
              </tr>
            </thead>
            <tbody>
              {opponentPlayerStats.map((player) => (
                <tr key={player.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 text-gray-900">{player.playerName}</td>
                  <td className="text-center py-2 text-gray-700">{player.goals}</td>
                  <td className="text-center py-2 text-gray-700">{player.assists}</td>
                  <td className="text-center py-2 text-gray-700">{player.steals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
