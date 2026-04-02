import { Activity, ArrowLeftRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import type { PlayerStat, ActiveEjection } from '../types';

interface PlayerGridProps {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  selectedPlayer: number | null;
  currentPossession: 'ucDavis' | 'opponent' | null;
  isPossessionActive: boolean;
  activeEjections: ActiveEjection[];
  onSelectPlayer: (playerId: number, team: 'ucDavis' | 'opponent') => void;
  onOpenSubModal: (team: 'ucDavis' | 'opponent') => void;
}

export default function PlayerGrid({
  ucDavisPlayerStats,
  opponentPlayerStats,
  selectedPlayer,
  currentPossession,
  isPossessionActive,
  activeEjections,
  onSelectPlayer,
  onOpenSubModal,
}: PlayerGridProps) {
  const isPlayerEjected = (
    playerId: number,
    team: 'ucDavis' | 'opponent',
  ): ActiveEjection | undefined =>
    activeEjections.find((ej) => ej.playerId === playerId && ej.team === team);

  return (
    <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="space-y-6">
        {/* UC Davis Players */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#022851]">Select Player - UC Davis</h3>
            {currentPossession === 'ucDavis' && isPossessionActive && (
              <Badge className="bg-[#FFBF00] text-[#022851]">
                <Activity size={12} className="mr-1 inline animate-pulse" />
                Active Possession
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {ucDavisPlayerStats.map((player) => {
              const isSelectedUCDavis =
                selectedPlayer === player.playerId && currentPossession === 'ucDavis';
              const ejection = isPlayerEjected(player.playerId, 'ucDavis');
              const isEjected = !!ejection;
              return (
                <div key={player.playerId} className="relative">
                  <Button
                    onClick={() => {
                      if (isEjected) {
                        toast.error(
                          `${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`,
                        );
                        return;
                      }
                      onSelectPlayer(player.playerId, 'ucDavis');
                      toast.success(`Tracking ${player.playerName}`);
                    }}
                    disabled={isEjected}
                    className={`w-full h-20 flex flex-col items-center justify-center transition-all ${
                      isEjected
                        ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                        : isSelectedUCDavis
                        ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                        : player.isActive
                        ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="text-3xl font-bold mb-1">#{player.jerseyNumber}</div>
                    <div className="text-[10px] opacity-80 leading-tight text-center px-1">
                      {player.playerName}
                    </div>
                  </Button>
                  {isEjected && (
                    <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                      {ejection.timeRemaining}s
                    </Badge>
                  )}
                  {!isEjected && player.isActive && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                      IN
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Opponent Players */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#022851]">Select Player - Opponents</h3>
            {currentPossession === 'opponent' && isPossessionActive && (
              <Badge className="bg-red-600 text-white">
                <Activity size={12} className="mr-1 inline animate-pulse" />
                Active Possession
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {opponentPlayerStats.map((player) => {
              const isSelectedOpponent =
                selectedPlayer === player.playerId && currentPossession === 'opponent';
              const ejection = isPlayerEjected(player.playerId, 'opponent');
              const isEjected = !!ejection;
              return (
                <div key={player.playerId} className="relative">
                  <Button
                    onClick={() => {
                      if (isEjected) {
                        toast.error(
                          `${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`,
                        );
                        return;
                      }
                      onSelectPlayer(player.playerId, 'opponent');
                      toast.success(`Tracking ${player.playerName}`);
                    }}
                    disabled={isEjected}
                    className={`w-full h-20 flex flex-col items-center justify-center transition-all ${
                      isEjected
                        ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                        : isSelectedOpponent
                        ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800 shadow-lg'
                        : player.isActive
                        ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="text-3xl font-bold mb-1">#{player.jerseyNumber}</div>
                    <div className="text-[10px] opacity-80 leading-tight text-center px-1">
                      {player.playerName}
                    </div>
                  </Button>
                  {isEjected && (
                    <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                      {ejection.timeRemaining}s
                    </Badge>
                  )}
                  {!isEjected && player.isActive && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                      IN
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend and Substitution Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>In Pool</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>On Bench</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onOpenSubModal('ucDavis')}
            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]"
          >
            <ArrowLeftRight className="mr-1" size={14} />
            Swap UC Davis
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenSubModal('opponent')}
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            <ArrowLeftRight className="mr-1" size={14} />
            Swap Opponent
          </Button>
        </div>
      </div>
    </Card>
  );
}
