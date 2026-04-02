import { AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import type { ActiveEjection } from '../types';

interface ActiveEjectionsProps {
  activeEjections: ActiveEjection[];
}

export default function ActiveEjections({ activeEjections }: ActiveEjectionsProps) {
  if (activeEjections.length === 0) return null;

  return (
    <Card className="p-4 bg-orange-50 border border-orange-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="text-orange-600" size={20} />
        <h3 className="text-orange-900 font-semibold">Active Ejections</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeEjections.map((ejection) => (
          <div
            key={ejection.playerId + ejection.team}
            className={`p-3 rounded-lg border-2 ${
              ejection.team === 'ucDavis'
                ? 'bg-[#FFBF00]/20 border-[#FFBF00]'
                : 'bg-red-100 border-red-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`font-semibold ${
                    ejection.team === 'ucDavis' ? 'text-[#022851]' : 'text-red-900'
                  }`}
                >
                  {ejection.playerName}
                </div>
                <div className="text-xs text-gray-600">
                  {ejection.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    ejection.team === 'ucDavis' ? 'text-[#022851]' : 'text-red-900'
                  }`}
                >
                  {ejection.timeRemaining}
                </div>
                <div className="text-xs text-gray-600">seconds</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-orange-700 mt-3 italic">
        Ejections end after 20 seconds, when a goal is scored, or when possession changes
      </p>
    </Card>
  );
}
