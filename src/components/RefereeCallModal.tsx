import { X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import type { PlayerStat, RefereeCall } from '../types';

interface RefereeCallModalProps {
  isOpen: boolean;
  pendingRefereeCall: RefereeCall['type'] | null;
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  onConfirm: (playerName?: string, team?: 'ucDavis' | 'opponent') => void;
  onClose: () => void;
}

export default function RefereeCallModal({
  isOpen,
  pendingRefereeCall,
  ucDavisPlayerStats,
  opponentPlayerStats,
  onConfirm,
  onClose,
}: RefereeCallModalProps) {
  if (!isOpen || !pendingRefereeCall) return null;

  const callLabel = pendingRefereeCall
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#022851] text-xl">{callLabel}</h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X size={20} />
          </Button>
        </div>

        <p className="text-gray-600 mb-4">
          Select a player (optional) or record without a specific player
        </p>

        <Button
          onClick={() => onConfirm()}
          className="w-full mb-4 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Record Call (No Player)
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-[#022851] font-semibold mb-2 text-sm">UC Davis</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ucDavisPlayerStats.map((player) => (
                <Button
                  key={player.playerId}
                  onClick={() => onConfirm(player.playerName, 'ucDavis')}
                  variant="outline"
                  className="w-full text-left justify-start text-xs border-[#FFBF00] hover:bg-[#FFBF00]/10"
                >
                  {player.playerName}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-red-600 font-semibold mb-2 text-sm">Opponent</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {opponentPlayerStats.map((player) => (
                <Button
                  key={player.playerId}
                  onClick={() => onConfirm(player.playerName, 'opponent')}
                  variant="outline"
                  className="w-full text-left justify-start text-xs border-red-600 hover:bg-red-100"
                >
                  {player.playerName}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
