import { ArrowLeftRight, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { PlayerStat } from '../types';

interface SubstitutionModalProps {
  isOpen: boolean;
  subTeam: 'ucDavis' | 'opponent' | null;
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  opponentTeamName: string;
  firstSelectedPlayer: number | null;
  secondSelectedPlayer: number | null;
  onFirstPlayerSelect: (id: number | null) => void;
  onSecondPlayerSelect: (id: number | null) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function SubstitutionModal({
  isOpen,
  subTeam,
  ucDavisPlayerStats,
  opponentPlayerStats,
  opponentTeamName,
  firstSelectedPlayer,
  secondSelectedPlayer,
  onFirstPlayerSelect,
  onSecondPlayerSelect,
  onConfirm,
  onClose,
}: SubstitutionModalProps) {
  if (!isOpen || !subTeam) return null;

  const playerStats = subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats;

  const handlePlayerClick = (playerId: number) => {
    const isFirst = firstSelectedPlayer === playerId;
    const isSecond = secondSelectedPlayer === playerId;
    if (isFirst) {
      onFirstPlayerSelect(null);
    } else if (isSecond) {
      onSecondPlayerSelect(null);
    } else if (!firstSelectedPlayer) {
      onFirstPlayerSelect(playerId);
    } else if (!secondSelectedPlayer) {
      onSecondPlayerSelect(playerId);
    } else {
      onFirstPlayerSelect(playerId);
      onSecondPlayerSelect(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl ${subTeam === 'ucDavis' ? 'text-[#022851]' : 'text-gray-800'}`}>
            <ArrowLeftRight className="inline mr-2" size={24} />
            Player Substitution - {subTeam === 'ucDavis' ? 'UC Davis' : opponentTeamName}
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X size={20} />
          </Button>
        </div>

        <p className="text-gray-600 mb-6">Select any two players to swap their positions</p>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h4 className="font-semibold text-gray-800">All Players</h4>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>In Pool</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>On Bench</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {playerStats.map((player) => {
              const isFirstSelected = firstSelectedPlayer === player.playerId;
              const isSecondSelected = secondSelectedPlayer === player.playerId;
              const isSelected = isFirstSelected || isSecondSelected;

              return (
                <Button
                  key={player.playerId}
                  onClick={() => handlePlayerClick(player.playerId)}
                  variant="outline"
                  className={`w-full text-left justify-start transition-all ${
                    isSelected
                      ? isFirstSelected
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-purple-100 border-purple-500 text-purple-900'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${player.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="font-semibold text-sm">#{player.jerseyNumber}</span>
                      <span>{player.playerName}</span>
                      <span className="text-xs text-gray-500">
                        {player.isActive ? '(In Pool)' : '(On Bench)'}
                      </span>
                    </div>
                    {isSelected && (
                      <Badge className={isFirstSelected ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                        {isFirstSelected ? '1st' : '2nd'}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {firstSelectedPlayer && secondSelectedPlayer && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Swap Preview:</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Badge className="bg-blue-500 text-white mb-1">Player 1</Badge>
                <p className="font-semibold">
                  {playerStats.find((p) => p.playerId === firstSelectedPlayer)?.playerName}
                </p>
                <p className="text-xs text-gray-500">
                  {playerStats.find((p) => p.playerId === firstSelectedPlayer)?.isActive
                    ? 'In Pool'
                    : 'On Bench'}
                </p>
              </div>
              <ArrowLeftRight className="text-gray-400" size={24} />
              <div className="text-center">
                <Badge className="bg-purple-500 text-white mb-1">Player 2</Badge>
                <p className="font-semibold">
                  {playerStats.find((p) => p.playerId === secondSelectedPlayer)?.playerName}
                </p>
                <p className="text-xs text-gray-500">
                  {playerStats.find((p) => p.playerId === secondSelectedPlayer)?.isActive
                    ? 'In Pool'
                    : 'On Bench'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!firstSelectedPlayer || !secondSelectedPlayer}
            className={`flex-1 ${
              subTeam === 'ucDavis'
                ? 'bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]'
                : 'bg-gray-700 hover:bg-gray-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowLeftRight className="mr-2" size={16} />
            Confirm Swap
          </Button>
        </div>
      </Card>
    </div>
  );
}
