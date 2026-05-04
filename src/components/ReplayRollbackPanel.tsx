import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ReplayRollbackPanelProps {
  replayEvents: Array<{
    id: string;
    type: 'goal' | 'exclusion' | 'penalty-foul' | 'timeout' | 'ejection' | 'referee-call';
    gameTime: number;
    quarter: number;
    team?: 'ucDavis' | 'opponent';
    playerName?: string;
    callType?: string;
  }>;
  onApplyRollback: (eventIds: string[]) => void;
}

export default function ReplayRollbackPanel({
  replayEvents,
  onApplyRollback,
}: ReplayRollbackPanelProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const orderedEvents = useMemo(
    () =>
      [...replayEvents].sort((a, b) => {
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        return b.gameTime - a.gameTime;
      }),
    [replayEvents],
  );

  const hasSelections = selectedEventIds.length > 0;

  const formatQuarterClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] mb-2 text-lg">Administrative Corrections</h3>
      <p className="text-xs text-gray-600 mb-3">
        Select specific logged events to correct. This mirrors official score-table correction workflow.
      </p>

      <div className="mb-3 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setSelectedEventIds(orderedEvents.map((ev) => ev.id))}
          disabled={orderedEvents.length === 0}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setSelectedEventIds([])}
          disabled={!hasSelections}
        >
          Clear
        </Button>
      </div>

      <Button
        className="w-full bg-red-700 hover:bg-red-800 text-white"
        disabled={!hasSelections}
        onClick={() => onApplyRollback(selectedEventIds)}
      >
        Apply Corrections ({selectedEventIds.length})
      </Button>

      <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2">
        <div className="mb-1 text-xs font-semibold text-[#022851]">
          Event Queue ({orderedEvents.length})
        </div>
        {orderedEvents.length === 0 ? (
          <div className="text-xs text-gray-500">No logged events yet.</div>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {orderedEvents.map((ev) => {
              const selected = selectedEventIds.includes(ev.id);
              return (
                <label
                  key={ev.id}
                  className={`flex items-start gap-2 rounded border px-2 py-1 text-xs cursor-pointer ${
                    selected ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEventIds((prev) => [...prev, ev.id]);
                      } else {
                        setSelectedEventIds((prev) => prev.filter((id) => id !== ev.id));
                      }
                    }}
                  />
                  <div>
                    <span className="font-semibold text-gray-800">{ev.type}</span>
                    <span className="text-gray-600"> - Q{ev.quarter} {formatQuarterClock(ev.gameTime)}</span>
                    {ev.callType && <span className="text-gray-600"> - {ev.callType}</span>}
                    {ev.team && <span className="text-gray-600"> - {ev.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}</span>}
                    {ev.playerName && <span className="text-gray-600"> - {ev.playerName}</span>}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
