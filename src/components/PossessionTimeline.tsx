import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { PossessionEvent } from '../types';

interface PossessionTimelineProps {
  possessionTimeline: PossessionEvent[];
  compact?: boolean;
  embedded?: boolean;
}

export default function PossessionTimeline({
  possessionTimeline,
  compact = false,
  embedded = false,
}: PossessionTimelineProps) {
  const list = (
    <div className={`space-y-2 overflow-y-auto ${compact ? 'max-h-[140px]' : 'max-h-[300px]'}`}>
        {possessionTimeline.length === 0 ? (
          <p className={`text-gray-500 text-center ${compact ? 'py-3 text-xs' : 'py-8 text-sm'}`}>No possessions recorded yet</p>
        ) : (
          possessionTimeline.map((event, index) => (
            <div
              key={event.id}
              className={`flex items-center gap-2 rounded ${compact ? 'p-1.5' : 'p-2'} ${
                event.team === 'ucDavis'
                  ? 'bg-[#FFBF00]/20 border-l-4 border-[#FFBF00]'
                  : 'bg-red-100 border-l-4 border-red-600'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      event.team === 'ucDavis' ? 'bg-[#FFBF00] text-[#022851]' : 'bg-red-600 text-white'
                    }
                  >
                    {event.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}
                  </Badge>
                  <span className="text-sm text-gray-700">{event.event}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Duration: {event.duration}s</div>
              </div>
              <div className="text-xs text-gray-400">#{index + 1}</div>
            </div>
          ))
        )}
      </div>
  );

  if (embedded) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-[#022851] mb-2">Possession timeline</h4>
        {list}
      </div>
    );
  }

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] mb-3 text-lg">Possession Timeline</h3>
      {list}
    </Card>
  );
}
