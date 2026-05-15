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
  suspendedPlayerIds: number[];
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
  suspendedPlayerIds,
  onSelectPlayer,
  onOpenSubModal,
}: PlayerGridProps) {
  const isPlayerEjected = (
    playerId: number,
    team: 'ucDavis' | 'opponent',
  ): ActiveEjection | undefined =>
    activeEjections.find((ej) => ej.playerId === playerId && ej.team === team);

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-2 gap-3">
        {/* UC Davis Players */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#022851] text-sm">UC Davis Players</h3>
            {currentPossession === 'ucDavis' && isPossessionActive && (
              <Badge className="bg-[#FFBF00] text-[#022851]">
                <Activity size={12} className="mr-1 inline animate-pulse" />
                Active Possession
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ucDavisPlayerStats.map((player) => {
              const isSelectedUCDavis =
                selectedPlayer === player.playerId && currentPossession === 'ucDavis';
              const ejection = isPlayerEjected(player.playerId, 'ucDavis');
              const isEjected = !!ejection;
              const isSuspended = suspendedPlayerIds.includes(player.playerId);
              const majorFouls = player.majorFouls ?? 0;
              return (
                <div key={player.playerId} className="relative">
                  <Button
                    onClick={() => {
                      if (isSuspended) {
                        toast.error(`${player.playerName} is suspended (brutality)`);
                        return;
                      }
                      if (isEjected) {
                        toast.error(
                          `${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`,
                        );
                        return;
                      }
                      onSelectPlayer(player.playerId, 'ucDavis');
                    }}
                    disabled={isEjected || isSuspended}
                    className={`w-full h-11 flex flex-col items-center justify-center transition-all ${
                      isSuspended
                        ? 'bg-red-900 text-white border-2 border-black opacity-80 cursor-not-allowed'
                        : isEjected
                        ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                        : isSelectedUCDavis
                        ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                        : player.isActive
                        ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="text-sm font-bold leading-none">#{player.jerseyNumber}</div>
                    <div className="text-[8px] opacity-80 leading-tight text-center px-1 truncate w-full">
                      {player.playerName}
                    </div>
                  </Button>
                  {isEjected && (
                    <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                      {ejection.timeRemaining}s
                    </Badge>
                  )}
                  {isSuspended && (
                    <Badge className="absolute -top-1 -right-1 bg-red-900 text-white text-xs px-1">
                      OUT
                    </Badge>
                  )}
                  {!isEjected && player.isActive && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                      IN
                    </Badge>
                  )}
                  {majorFouls > 0 && (
                    <Badge className="absolute -bottom-1 -left-1 bg-indigo-700 text-white text-[10px] px-1">
                      MF {majorFouls}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Opponent Players */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#022851] text-sm">Opponent Players</h3>
            {currentPossession === 'opponent' && isPossessionActive && (
              <Badge className="bg-red-600 text-white">
                <Activity size={12} className="mr-1 inline animate-pulse" />
                Active Possession
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {opponentPlayerStats.map((player) => {
              const isSelectedOpponent =
                selectedPlayer === player.playerId && currentPossession === 'opponent';
              const ejection = isPlayerEjected(player.playerId, 'opponent');
              const isEjected = !!ejection;
              const isSuspended = suspendedPlayerIds.includes(player.playerId);
              const majorFouls = player.majorFouls ?? 0;
              return (
                <div key={player.playerId} className="relative">
                  <Button
                    onClick={() => {
                      if (isSuspended) {
                        toast.error(`${player.playerName} is suspended (brutality)`);
                        return;
                      }
                      if (isEjected) {
                        toast.error(
                          `${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`,
                        );
                        return;
                      }
                      onSelectPlayer(player.playerId, 'opponent');
                    }}
                    disabled={isEjected || isSuspended}
                    className={`w-full h-11 flex flex-col items-center justify-center transition-all ${
                      isSuspended
                        ? 'bg-red-900 text-white border-2 border-black opacity-80 cursor-not-allowed'
                        : isEjected
                        ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                        : isSelectedOpponent
                        ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800 shadow-lg'
                        : player.isActive
                        ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="text-sm font-bold leading-none">#{player.jerseyNumber}</div>
                    <div className="text-[8px] opacity-80 leading-tight text-center px-1 truncate w-full">
                      {player.playerName}
                    </div>
                  </Button>
                  {isEjected && (
                    <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                      {ejection.timeRemaining}s
                    </Badge>
                  )}
                  {isSuspended && (
                    <Badge className="absolute -top-1 -right-1 bg-red-900 text-white text-xs px-1">
                      OUT
                    </Badge>
                  )}
                  {!isEjected && player.isActive && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                      IN
                    </Badge>
                  )}
                  {majorFouls > 0 && (
                    <Badge className="absolute -bottom-1 -left-1 bg-indigo-700 text-white text-[10px] px-1">
                      MF {majorFouls}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend and Substitution Buttons */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
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
            UC Davis Substitution
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenSubModal('opponent')}
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            <ArrowLeftRight className="mr-1" size={14} />
            Opponent Substitution
          </Button>
        </div>
      </div>
    </Card>
  );
}
