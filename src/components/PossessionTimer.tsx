import { Play, Pause } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface PossessionTimerProps {
  possessionTimeUCDavis: number;
  possessionTimeOpponent: number;
  currentPossession: 'ucDavis' | 'opponent' | null;
  isPossessionActive: boolean;
  isGameActive: boolean;
  isPaused: boolean;
  isInBreak: boolean;
  onSetPossession: (team: 'ucDavis' | 'opponent' | null) => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PossessionTimer({
  possessionTimeUCDavis,
  possessionTimeOpponent,
  currentPossession,
  isPossessionActive,
  isGameActive,
  isPaused,
  isInBreak,
  onSetPossession,
}: PossessionTimerProps) {
  const isClockRunning = isGameActive && !isPaused && !isInBreak;

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] text-sm mb-3">Possession Timer</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* UC Davis */}
        <Card
          className={`p-3 border-none ${
            currentPossession === 'ucDavis' && isPossessionActive && isClockRunning
              ? 'bg-gradient-to-br from-[#FFBF00] to-[#ffcc33] ring-4 ring-[#FFBF00]/50'
              : 'bg-gradient-to-br from-[#FFBF00]/70 to-[#ffcc33]/70'
          }`}
        >
          <div className="text-xs text-[#022851]/70 mb-1">UC Davis</div>
          <div className="text-2xl text-[#022851]">{formatTime(possessionTimeUCDavis)}</div>
          <Button
            onClick={() => {
              if (!isGameActive) {
                toast.error('Please start the game first');
                return;
              }
              if (!isClockRunning) {
                toast.info(isInBreak ? 'Possession is disabled during quarter breaks' : 'Resume the game clock to run possession');
                return;
              }
              if (currentPossession === 'ucDavis' && isPossessionActive) {
                onSetPossession(null);
                toast.info('UC Davis possession stopped');
              } else {
                onSetPossession('ucDavis');
                toast.success('UC Davis possession started');
              }
            }}
            disabled={!isGameActive}
            size="sm"
            className={`mt-2 w-full ${
              currentPossession === 'ucDavis' && isPossessionActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#022851] hover:bg-[#022851]/90 text-white'
            }`}
          >
            {currentPossession === 'ucDavis' && isPossessionActive ? (
              <>
                <Pause size={16} className="mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Start
              </>
            )}
          </Button>
        </Card>

        {/* Opponent */}
        <Card
          className={`p-3 border-none text-white ${
            currentPossession === 'opponent' && isPossessionActive && isClockRunning
              ? 'bg-gradient-to-br from-red-600 to-red-700 ring-4 ring-red-500/50'
              : 'bg-gradient-to-br from-red-600/70 to-red-700/70'
          }`}
        >
          <div className="text-xs opacity-70 mb-1">Opponent</div>
          <div className="text-2xl">{formatTime(possessionTimeOpponent)}</div>
          <Button
            onClick={() => {
              if (!isGameActive) {
                toast.error('Please start the game first');
                return;
              }
              if (!isClockRunning) {
                toast.info(isInBreak ? 'Possession is disabled during quarter breaks' : 'Resume the game clock to run possession');
                return;
              }
              if (currentPossession === 'opponent' && isPossessionActive) {
                onSetPossession(null);
                toast.info('Opponent possession stopped');
              } else {
                onSetPossession('opponent');
                toast.info('Opponent possession started');
              }
            }}
            disabled={!isGameActive}
            size="sm"
            className={`mt-2 w-full ${
              currentPossession === 'opponent' && isPossessionActive
                ? 'bg-gray-900 hover:bg-gray-800'
                : 'bg-white hover:bg-gray-100 text-red-600'
            }`}
          >
            {currentPossession === 'opponent' && isPossessionActive ? (
              <>
                <Pause size={16} className="mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Start
              </>
            )}
          </Button>
        </Card>
      </div>
    </Card>
  );
}
