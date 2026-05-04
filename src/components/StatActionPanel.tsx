import {
  Target,
  XCircle,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  ArrowRight,
  Activity,
  FileText,
  Plus,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { PlayerStat } from '../types';

interface StatActionPanelProps {
  selectedPlayer: number;
  currentPossession: 'ucDavis' | 'opponent';
  activePlayerStats: PlayerStat[];
  gameTime: number;
  currentQuarter: number;
  currentNote: string;
  onCurrentNoteChange: (note: string) => void;
  onShotClick: (playerId: number) => void;
  onGoalClick: (playerId: number) => void;
  onAssistClick: (playerId: number) => void;
  onTurnover: (playerId: number) => void;
  onSteal: (playerId: number) => void;
  onUpdateStat: (playerId: number, stat: keyof PlayerStat, increment?: number) => void;
  onAddNote: () => void;
  // true = offense only, false = defense only, undefined = show both
  isOnOffense?: boolean;
  onClose?: () => void;
}

export default function StatActionPanel({
  selectedPlayer,
  currentPossession,
  activePlayerStats,
  gameTime,
  currentQuarter,
  currentNote,
  onCurrentNoteChange,
  onShotClick,
  onGoalClick,
  onAssistClick,
  onTurnover,
  onSteal,
  onUpdateStat,
  onAddNote,
  isOnOffense,
  onClose,
}: StatActionPanelProps) {
  const player = activePlayerStats.find((p) => p.playerId === selectedPlayer);
  if (!player) return null;

  return (
    <>
      {/* Current Player Stats Display */}
      <Card
        className={`p-4 border-none ${
          currentPossession === 'ucDavis'
            ? 'bg-gradient-to-r from-[#FFBF00] to-[#ffcc33]'
            : 'bg-gradient-to-r from-red-600 to-red-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3
              className={`text-xl ${
                currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'
              }`}
            >
              {player.playerName}
            </h3>
          </div>
          <div className="flex gap-4">
            {(['shots', 'goals', 'assists', 'steals'] as const).map((stat) => (
              <div key={stat} className="text-center">
                <div
                  className={`text-2xl ${
                    currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'
                  }`}
                >
                  {player[stat]}
                </div>
                <div
                  className={`text-sm ${
                    currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'
                  }`}
                >
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </div>
              </div>
            ))}
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              className="ml-2"
            >
              Close
            </Button>
          )}
        </div>
      </Card>

      {/* Scoring Actions — only shown when player is on offense (or possession timer is off) */}
      {isOnOffense !== false && <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-3 text-sm flex items-center gap-2">
          <Target size={16} />
          Scoring &amp; Shooting
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            onClick={() => onShotClick(selectedPlayer)}
            className="bg-blue-500 hover:bg-blue-600 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Target size={18} className="mb-1" />
            Shot Taken
          </Button>
          <Button
            onClick={() => onGoalClick(selectedPlayer)}
            className="bg-green-600 hover:bg-green-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Target size={18} className="mb-1" />
            Goal Scored
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'penalties')}
            className="bg-orange-500 hover:bg-orange-600 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <AlertTriangle size={18} className="mb-1" />
            Penalty Shot
          </Button>
          <Button
            onClick={() => onAssistClick(selectedPlayer)}
            className="bg-purple-500 hover:bg-purple-600 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <ArrowRight size={18} className="mb-1" />
            Assist
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'rebounds')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <TrendingUp size={18} className="mb-1" />
            Rebound
          </Button>
          <Button
            onClick={() => onTurnover(selectedPlayer)}
            className="bg-red-600 hover:bg-red-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <XCircle size={18} className="mb-1" />
            Turnover
          </Button>
        </div>
      </Card>}

      {/* Defensive Actions — only shown when player is on defense (or possession timer is off) */}
      {isOnOffense !== true && <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-3 text-sm flex items-center gap-2">
          <Shield size={16} />
          Defensive Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            onClick={() => onSteal(selectedPlayer)}
            className="bg-teal-600 hover:bg-teal-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Zap size={18} className="mb-1" />
            Steal
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'blocks')}
            className="bg-gray-700 hover:bg-gray-800 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Shield size={18} className="mb-1" />
            Block
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'draws')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <AlertTriangle size={18} className="mb-1" />
            Draw Exclusion
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'exclusions')}
            className="bg-red-700 hover:bg-red-800 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <XCircle size={18} className="mb-1" />
            Exclusion
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'tippedPasses')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Activity size={18} className="mb-1" />
            Tipped Pass
          </Button>
          <Button
            onClick={() => onUpdateStat(selectedPlayer, 'hustle')}
            className="bg-pink-600 hover:bg-pink-700 text-white h-16 text-xs sm:text-sm flex flex-col items-center justify-center"
          >
            <Zap size={18} className="mb-1" />
            Hustle Play
          </Button>
        </div>
      </Card>}

      {/* Player Notes Section */}
      <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#022851]" />
            <h3 className="text-[#022851] text-sm">Player Notes — {player.playerName}</h3>
          </div>
          <Badge
            className={
              currentPossession === 'ucDavis' ? 'bg-[#FFBF00] text-[#022851]' : 'bg-red-600 text-white'
            }
          >
            Q{currentQuarter} -{' '}
            {String(Math.floor(gameTime / 60)).padStart(2, '0')}:
            {String(gameTime % 60).padStart(2, '0')}
          </Badge>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={currentNote}
            onChange={(e) => onCurrentNoteChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') onAddNote();
            }}
            placeholder="Add a note about this player's performance..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
          />
          <Button
            onClick={onAddNote}
            className="bg-[#022851] text-white hover:bg-[#022851]/90"
          >
            <Plus size={16} className="mr-1" />
            Add Note
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {player.notes && player.notes.length > 0 ? (
            player.notes
              .slice()
              .reverse()
              .map((note, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">{note}</p>
                </div>
              ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No notes yet. Add observations about this player's performance during the game.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
