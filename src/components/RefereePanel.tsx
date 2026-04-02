import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { RefereeCall } from '../types';

interface RefereePanelProps {
  refereeName: string;
  refereeCallCounts: Record<string, number>;
  refereeCalls: RefereeCall[];
  onRefereeNameChange: (name: string) => void;
  onRefereeCall: (type: RefereeCall['type']) => void;
}

export default function RefereePanel({
  refereeName,
  refereeCallCounts,
  refereeCalls,
  onRefereeNameChange,
  onRefereeCall,
}: RefereePanelProps) {
  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] mb-3 text-lg">Referee</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Referee Name"
          value={refereeName}
          onChange={(e) => onRefereeNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#022851]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={() => onRefereeCall('yellow-card')}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-12 text-xs flex items-center justify-center gap-1"
        >
          Yellow Card <Badge className="bg-gray-900 text-yellow-400">{refereeCallCounts['yellow-card']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('red-card')}
          className="bg-red-600 hover:bg-red-700 text-white h-12 text-xs flex items-center justify-center gap-1"
        >
          Red Card <Badge className="bg-white text-red-600">{refereeCallCounts['red-card']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('ejection')}
          className="bg-orange-600 hover:bg-orange-700 text-white h-12 text-xs flex items-center justify-center gap-1"
        >
          Ejection <Badge className="bg-white text-orange-600">{refereeCallCounts['ejection']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('offensive-foul')}
          className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-xs flex items-center justify-center gap-1"
        >
          Off. Foul <Badge className="bg-white text-blue-600">{refereeCallCounts['offensive-foul']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('defensive-foul')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-xs flex items-center justify-center gap-1"
        >
          Def. Foul <Badge className="bg-white text-indigo-600">{refereeCallCounts['defensive-foul']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('brutality')}
          className="bg-red-900 hover:bg-red-950 text-white h-12 text-xs flex items-center justify-center gap-1"
        >
          Brutality <Badge className="bg-white text-red-900">{refereeCallCounts['brutality']}</Badge>
        </Button>
        <Button
          onClick={() => onRefereeCall('timeout')}
          className="bg-gray-600 hover:bg-gray-700 text-white h-12 text-xs col-span-2 flex items-center justify-center gap-1"
        >
          Timeout <Badge className="bg-white text-gray-600">{refereeCallCounts['timeout']}</Badge>
        </Button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {refereeCalls.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">No referee calls yet</p>
        ) : (
          refereeCalls
            .slice()
            .reverse()
            .map((call) => (
              <div key={call.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-[#022851] text-white text-xs">
                    {call.timestamp} Q{call.quarter}
                  </Badge>
                  <span className="text-[#022851] font-semibold">
                    {call.type
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </span>
                </div>
                {call.playerName && (
                  <div className="text-gray-700">
                    {call.playerName}{' '}
                    {call.team && `(${call.team === 'ucDavis' ? 'UC Davis' : 'Opponent'})`}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </Card>
  );
}
