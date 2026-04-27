import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Plus,
  Minus,
  XCircle,
  ArrowRight,
  Activity,
  Clock,
  Undo,
  Redo,
  Users,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface GameHeaderProps {
  isGameActive: boolean;
  isPaused: boolean;
  isInBreak: boolean;
  gameTime: number;
  breakTimeRemaining: number;
  quarterDurationSeconds: number;
  shotClockSeconds: number | null;
  currentQuarter: number;
  canUndo: boolean;
  canRedo: boolean;
  ucDavisScore: number;
  opponentScore: number;
  opponentTeamName: string;
  onUndo: () => void;
  onRedo: () => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onSaveGame: () => void;
  onEndGame: () => void;
  onResetGame: () => void;
  onEditPlayers: () => void;
  onQuarterChange: (q: number) => void;
  onSkipBreak: () => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function GameHeader({
  isGameActive,
  isPaused,
  isInBreak,
  gameTime,
  breakTimeRemaining,
  quarterDurationSeconds,
  shotClockSeconds,
  currentQuarter,
  canUndo,
  canRedo,
  ucDavisScore,
  opponentScore,
  opponentTeamName,
  onUndo,
  onRedo,
  onStartGame,
  onPauseGame,
  onSaveGame,
  onEndGame,
  onResetGame,
  onEditPlayers,
  onQuarterChange,
  onSkipBreak,
}: GameHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[#022851] mb-2">Live Stats Input</h1>
          <p className="text-gray-600">Track real-time game statistics for UC Davis Water Polo</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 mr-2 border-r pr-4">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="outline"
              size="sm"
              className="border-gray-300"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} className="mr-1" />
              Undo
            </Button>
            <Button
              onClick={onRedo}
              disabled={!canRedo}
              variant="outline"
              size="sm"
              className="border-gray-300"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} className="mr-1" />
              Redo
            </Button>
          </div>

          {!isGameActive ? (
            <>
              <Button
                onClick={onEditPlayers}
                variant="outline"
                className="border-[#022851] text-[#022851] hover:bg-[#022851]/10"
              >
                <Users size={16} className="mr-2" />
                Edit Players
              </Button>
              <Button
                onClick={onStartGame}
                className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
              >
                <Play size={16} className="mr-2" />
                Start Game
              </Button>
            </>
          ) : (
            <>
              {isInBreak ? (
                <Button
                  onClick={onSkipBreak}
                  className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
                >
                  <ArrowRight size={16} className="mr-2" />
                  Skip Break &amp; Start Q{currentQuarter + 1}
                </Button>
              ) : (
                <Button
                  onClick={onPauseGame}
                  className="bg-[#022851] text-white hover:bg-[#022851]/90"
                >
                  {isPaused ? (
                    <Play size={16} className="mr-2" />
                  ) : (
                    <Pause size={16} className="mr-2" />
                  )}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
              <Button
                onClick={onSaveGame}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Save size={16} className="mr-2" />
                Save
              </Button>
              <Button
                onClick={() => {
                  if (
                    window.confirm(
                      `End game? Final score: UC Davis ${ucDavisScore} — ${opponentScore} ${opponentTeamName}`,
                    )
                  ) {
                    onEndGame();
                  }
                }}
                className="bg-red-700 text-white hover:bg-red-800"
              >
                <XCircle size={16} className="mr-2" />
                End Game
              </Button>
              <Button
                onClick={onResetGame}
                variant="outline"
                className="border-gray-400 text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Game Info Bar */}
      <Card className="p-4 bg-gradient-to-r from-[#022851] to-[#033a70] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span className="text-2xl">
                {isInBreak
                  ? formatTime(breakTimeRemaining)
                  : formatTime(Math.max(0, quarterDurationSeconds - gameTime))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Shot Clock</span>
              <Badge className="bg-black text-white min-w-[48px] justify-center">
                {shotClockSeconds === null ? '--' : shotClockSeconds}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={20} />
              {isInBreak ? (
                <span className="text-xl">
                  {currentQuarter === 2
                    ? 'Halftime'
                    : `Break (Q${currentQuarter} → Q${currentQuarter + 1})`}
                </span>
              ) : (
                <span className="text-xl">Quarter {currentQuarter}</span>
              )}
            </div>
            <Badge
              className={`${
                isInBreak
                  ? 'bg-orange-500'
                  : isGameActive
                  ? isPaused
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                  : 'bg-gray-500'
              } text-white`}
            >
              {isInBreak ? 'BREAK' : isGameActive ? (isPaused ? 'PAUSED' : 'LIVE') : 'NOT STARTED'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => onQuarterChange(Math.max(1, currentQuarter - 1))}
            >
              <Minus size={14} />
            </Button>
            <span>Quarter</span>
            <Button
              size="sm"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => onQuarterChange(Math.min(4, currentQuarter + 1))}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
