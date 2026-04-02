import { Save, X, Users } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { PlayerStat } from '../types';

interface PlayerEditModalProps {
  isOpen: boolean;
  editingUcDavisPlayers: PlayerStat[];
  editingOpponentPlayers: PlayerStat[];
  opponentTeamName: string;
  onUcDavisPlayersChange: (players: PlayerStat[]) => void;
  onOpponentPlayersChange: (players: PlayerStat[]) => void;
  onOpponentTeamNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function PlayerEditModal({
  isOpen,
  editingUcDavisPlayers,
  editingOpponentPlayers,
  opponentTeamName,
  onUcDavisPlayersChange,
  onOpponentPlayersChange,
  onOpponentTeamNameChange,
  onSave,
  onClose,
}: PlayerEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#022851] text-2xl">Edit Players</h3>
            <p className="text-gray-600">Set up player names and numbers for the match</p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <X size={16} className="mr-1" />
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UC Davis Players */}
          <div>
            <h4 className="text-[#022851] mb-4 font-semibold flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FFBF00] rounded"></div>
              UC Davis Players
            </h4>
            <div className="space-y-3">
              {editingUcDavisPlayers.map((player, index) => (
                <div key={player.playerId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-20">
                    <input
                      type="number"
                      value={player.jerseyNumber}
                      onChange={(e) => {
                        const newPlayers = [...editingUcDavisPlayers];
                        newPlayers[index] = { ...newPlayers[index], jerseyNumber: parseInt(e.target.value) || 1 };
                        onUcDavisPlayersChange(newPlayers);
                      }}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                      placeholder="#"
                      min="1"
                      max="99"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={player.playerName}
                      onChange={(e) => {
                        const newPlayers = [...editingUcDavisPlayers];
                        newPlayers[index] = { ...newPlayers[index], playerName: e.target.value };
                        onUcDavisPlayersChange(newPlayers);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                      placeholder="Player Name"
                    />
                  </div>
                  <Badge className="bg-[#022851] text-white">ID: {player.playerId}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Opponent Players */}
          <div>
            <div className="mb-4">
              <h4 className="text-[#022851] font-semibold flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                Opponent Team
              </h4>
              <input
                type="text"
                value={opponentTeamName}
                onChange={(e) => onOpponentTeamNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 mb-3"
                placeholder="Opponent Team Name"
              />
            </div>
            <div className="space-y-3">
              {editingOpponentPlayers.map((player, index) => (
                <div key={player.playerId} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-20">
                    <input
                      type="number"
                      value={player.jerseyNumber}
                      onChange={(e) => {
                        const newPlayers = [...editingOpponentPlayers];
                        newPlayers[index] = { ...newPlayers[index], jerseyNumber: parseInt(e.target.value) || 1 };
                        onOpponentPlayersChange(newPlayers);
                      }}
                      className="w-full px-2 py-2 border border-red-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="#"
                      min="1"
                      max="99"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={player.playerName}
                      onChange={(e) => {
                        const newPlayers = [...editingOpponentPlayers];
                        newPlayers[index] = { ...newPlayers[index], playerName: e.target.value };
                        onOpponentPlayersChange(newPlayers);
                      }}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder={`${opponentTeamName} Player ${index + 1}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
          >
            <Save size={16} className="mr-2" />
            Save Players
          </Button>
        </div>
      </Card>
    </div>
  );
}
