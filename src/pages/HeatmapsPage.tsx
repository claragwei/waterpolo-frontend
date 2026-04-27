import { useState } from 'react';
import { Card } from '../components/ui/card';
import HeatmapCanvas from '../components/HeatmapCanvas';
import { useHeatmapViewModel } from '../hooks/useHeatmapViewModel';
import { Flame } from 'lucide-react';

type ViewMode = 'all' | 'goals';

function formatMatchLabel(match_date: string, opponent_name: string): string {
  const date = new Date(match_date);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${formatted} — vs. ${opponent_name}`;
}

export default function HeatmapsPage() {
  const { shotPoints, goalPoints, matches, loading, error, setSelectedMatch } =
    useHeatmapViewModel();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  function handleMatchChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const matchId = value === 'all' ? null : Number(value);
    setSelectedMatchId(matchId);
    setSelectedMatch(matchId);
  }

  const activePoints = viewMode === 'all' ? shotPoints : goalPoints;
  const eventCount = viewMode === 'all' ? shotPoints.length : goalPoints.length;
  const eventLabel = viewMode === 'all' ? 'shots' : 'goals';
  const title = viewMode === 'all' ? 'All Shots' : 'Goals Only';
  const subtitle = viewMode === 'all'
    ? 'All shots and goals combined'
    : 'Goals only — where UC Davis converts';

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Shot Heatmaps</h1>
        <p className="text-gray-600">
          Visualize shot and goal locations across the pool
        </p>
      </div>

      {/* Filter + toggle bar */}
      <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="match-filter" className="text-sm text-gray-700 whitespace-nowrap">
            Filter by game:
          </label>
          <select
            id="match-filter"
            value={selectedMatchId ?? 'all'}
            onChange={handleMatchChange}
            className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#022851]"
          >
            <option value="all">Full Season</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {formatMatchLabel(m.match_date, m.opponent_name)}
              </option>
            ))}
          </select>

          {/* Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-[#022851] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Shots
            </button>
            <button
              onClick={() => setViewMode('goals')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'goals'
                  ? 'bg-[#022851] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Goals Only
            </button>
          </div>
        </div>
      </Card>

      {/* Error banner */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      {/* Full-width heatmap */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={20} className="text-[#FFBF00]" />
          <h2 className="text-[#022851]">{title}</h2>
          <span className="ml-auto text-sm text-gray-500">
            {loading ? '…' : `${eventCount} ${eventLabel}`}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

        {loading ? (
          <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
            Loading heatmap data…
          </div>
        ) : (
          <HeatmapCanvas points={activePoints} />
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">Density:</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-xs text-gray-500">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-xs text-gray-500">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
