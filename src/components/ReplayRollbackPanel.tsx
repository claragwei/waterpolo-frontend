import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export interface ReplayWindowFilters {
  goals: boolean;
  exclusions: boolean;
  penalties: boolean;
  timeouts: boolean;
}

interface ReplayRollbackPanelProps {
  maxGameTime: number;
  replayEvents: Array<{
    id: string;
    type: 'goal' | 'exclusion' | 'penalty-foul' | 'timeout';
    gameTime: number;
    quarter: number;
    team?: 'ucDavis' | 'opponent';
    playerName?: string;
  }>;
  onApplyRollback: (startTime: number, endTime: number, filters: ReplayWindowFilters) => void;
}

export default function ReplayRollbackPanel({
  maxGameTime,
  replayEvents,
  onApplyRollback,
}: ReplayRollbackPanelProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(maxGameTime);
  const [filters, setFilters] = useState<ReplayWindowFilters>({
    goals: true,
    exclusions: true,
    penalties: true,
    timeouts: true,
  });

  const hasAtLeastOneFilter = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters],
  );
  const minT = Math.min(startTime, endTime);
  const maxT = Math.max(startTime, endTime);

  const previewEvents = useMemo(() => {
    return replayEvents.filter((ev) => {
      const inWindow = ev.gameTime >= minT && ev.gameTime <= maxT;
      const selectedType =
        (filters.goals && ev.type === 'goal') ||
        (filters.exclusions && ev.type === 'exclusion') ||
        (filters.penalties && ev.type === 'penalty-foul') ||
        (filters.timeouts && ev.type === 'timeout');
      return inWindow && selectedType;
    });
  }, [filters, maxT, minT, replayEvents]);

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] mb-2 text-lg">Replay / Rollback</h3>
      <p className="text-xs text-gray-600 mb-3">
        Remove selected events within a game-time window for replay corrections.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-xs text-gray-700">
          Start (sec)
          <input
            type="number"
            min={0}
            max={maxGameTime}
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="text-xs text-gray-700">
          End (sec)
          <input
            type="number"
            min={0}
            max={maxGameTime}
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.goals}
            onChange={(e) => setFilters((prev) => ({ ...prev, goals: e.target.checked }))}
          />
          Goals
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.exclusions}
            onChange={(e) => setFilters((prev) => ({ ...prev, exclusions: e.target.checked }))}
          />
          20s Exclusions
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.penalties}
            onChange={(e) => setFilters((prev) => ({ ...prev, penalties: e.target.checked }))}
          />
          Penalty Fouls
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.timeouts}
            onChange={(e) => setFilters((prev) => ({ ...prev, timeouts: e.target.checked }))}
          />
          Timeouts
        </label>
      </div>

      <Button
        className="w-full bg-red-700 hover:bg-red-800 text-white"
        disabled={!hasAtLeastOneFilter || endTime < startTime}
        onClick={() => onApplyRollback(startTime, endTime, filters)}
      >
        Apply Replay Rollback
      </Button>

      <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2">
        <div className="mb-1 text-xs font-semibold text-[#022851]">
          Preview ({previewEvents.length} event{previewEvents.length === 1 ? '' : 's'} to remove)
        </div>
        {previewEvents.length === 0 ? (
          <div className="text-xs text-gray-500">No matching events for current filters/time window.</div>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {previewEvents.map((ev) => (
              <div key={ev.id} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs">
                <span className="font-semibold text-gray-800">{ev.type}</span>
                <span className="text-gray-600"> @ {ev.gameTime}s (Q{ev.quarter})</span>
                {ev.team && <span className="text-gray-600"> - {ev.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}</span>}
                {ev.playerName && <span className="text-gray-600"> - {ev.playerName}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
