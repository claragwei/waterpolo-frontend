import { X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { HeatmapData } from '../types';

interface HeatmapModalProps {
  isOpen: boolean;
  pendingAction: {
    type: 'shot' | 'goal' | 'assist';
    playerId: number;
    playerName: string;
    team: 'ucDavis' | 'opponent';
  } | null;
  heatmapData: HeatmapData;
  formation: '4-2' | '3-3';
  onFormationChange: (f: '4-2' | '3-3') => void;
  onPinDrop: (x: number, y: number) => void;
  onClose: () => void;
}

function getPlayerPositions(formation: '4-2' | '3-3') {
  if (formation === '4-2') {
    return [
      { x: 20, y: 25, label: '1' },
      { x: 40, y: 25, label: '2' },
      { x: 60, y: 25, label: '3' },
      { x: 80, y: 25, label: '4' },
      { x: 35, y: 70, label: '5' },
      { x: 65, y: 70, label: '6' },
    ];
  }
  return [
    { x: 25, y: 25, label: '1' },
    { x: 50, y: 25, label: '2' },
    { x: 75, y: 25, label: '3' },
    { x: 25, y: 70, label: '4' },
    { x: 50, y: 70, label: '5' },
    { x: 75, y: 70, label: '6' },
  ];
}

export default function HeatmapModal({
  isOpen,
  pendingAction,
  heatmapData,
  formation,
  onFormationChange,
  onPinDrop,
  onClose,
}: HeatmapModalProps) {
  if (!isOpen || !pendingAction) return null;

  const actionLabel =
    pendingAction.type === 'shot'
      ? 'Shot Taken'
      : pendingAction.type === 'goal'
      ? 'Goal Scored'
      : 'Assist';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#022851] text-2xl">Select Location</h3>
            <p className="text-gray-600">
              {pendingAction.playerName} ({pendingAction.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}) —{' '}
              {actionLabel}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <X size={16} className="mr-1" />
            Cancel
          </Button>
        </div>

        {/* Formation Toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="text-gray-700 font-medium">Formation:</span>
          <div className="flex gap-2">
            <Button
              onClick={() => onFormationChange('4-2')}
              variant={formation === '4-2' ? 'default' : 'outline'}
              className={formation === '4-2' ? 'bg-[#022851] text-white' : 'border-gray-300'}
              size="sm"
            >
              4-2
              <Badge className="ml-2 bg-white text-[#022851]">
                {heatmapData[pendingAction.team].filter((s) => s.formation === '4-2').length}
              </Badge>
            </Button>
            <Button
              onClick={() => onFormationChange('3-3')}
              variant={formation === '3-3' ? 'default' : 'outline'}
              className={formation === '3-3' ? 'bg-[#022851] text-white' : 'border-gray-300'}
              size="sm"
            >
              3-3
              <Badge className="ml-2 bg-white text-[#022851]">
                {heatmapData[pendingAction.team].filter((s) => s.formation === '3-3').length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Water Polo Court */}
        <div className="max-w-3xl mx-auto">
          {/* Opponent Goal */}
          <div className="text-center mb-3">
            <div className="inline-block">
              <div className="w-48 h-12 bg-white/90 border-4 border-white rounded-t-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="border border-gray-300"></div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">Opponent Goal</div>
            </div>
          </div>

          {/* Pool — Interactive Pin Drop */}
          <div
            className="relative border-4 border-yellow-400 border-dashed rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500 cursor-crosshair"
            style={{ height: '600px' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              onPinDrop(x, y);
            }}
          >
            {/* Goal Line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/60 border-b-2 border-white pointer-events-none">
              <span className="absolute right-2 top-0 text-xs text-white font-bold">Goal Line</span>
            </div>

            {/* 2m Line */}
            <div
              className="absolute left-0 right-0 h-1 bg-red-500 pointer-events-none"
              style={{ top: '15%' }}
            >
              <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">2m</span>
            </div>

            {/* 5m Line */}
            <div
              className="absolute left-0 right-0 h-1 bg-yellow-400 pointer-events-none"
              style={{ top: '50%' }}
            >
              <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">5m</span>
            </div>

            {/* 7m Line */}
            <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/60 pointer-events-none">
              <span className="absolute right-2 -top-1 text-xs text-white font-bold">7m</span>
            </div>

            {/* Player Position Markers */}
            {getPlayerPositions(formation).map((pos, idx) => (
              <div
                key={idx}
                className="absolute w-10 h-10 bg-white/80 border-2 border-[#022851] rounded-full flex items-center justify-center pointer-events-none shadow-lg"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-[#022851] text-sm font-bold">{pos.label}</span>
              </div>
            ))}

            {/* Hole Marker */}
            <div
              className="absolute w-16 h-16 bg-orange-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center pointer-events-none"
              style={{ left: '50%', top: '15%', transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-white text-xs font-bold">Hole</span>
            </div>

            {/* Existing Shot Pins */}
            {heatmapData[pendingAction.team]
              .filter((shot) => shot.formation === formation)
              .map((shot, idx) => {
                const pinColor =
                  shot.type === 'goal'
                    ? 'bg-green-500'
                    : shot.type === 'assist'
                    ? 'bg-purple-500'
                    : 'bg-red-500';
                const arrowColor =
                  shot.type === 'goal'
                    ? '#22c55e'
                    : shot.type === 'assist'
                    ? '#a855f7'
                    : '#ef4444';
                return (
                  <div
                    key={idx}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${shot.x}%`,
                      top: `${shot.y}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full ${pinColor} border-2 border-white shadow-lg`}></div>
                    <div
                      className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto"
                      style={{ borderTopColor: arrowColor }}
                    ></div>
                  </div>
                );
              })}
          </div>

          {/* UC Davis Goal */}
          <div className="text-center mt-3">
            <div className="text-xs text-gray-600 mb-1">UC Davis Goal</div>
            <div className="inline-block">
              <div className="w-48 h-12 bg-gradient-to-b from-[#FFBF00] to-[#ffcc33] border-4 border-[#FFBF00] rounded-b-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="border border-[#022851]/20"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-2">
              <p className="text-sm text-blue-800 text-center">
                <strong>Click anywhere on the court to drop a pin and record the shot location</strong>
              </p>
              <p className="text-xs text-blue-700 text-center">
                Each shot is saved with the selected formation. Toggle between formations to view shots
                specific to that setup.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  <span className="text-gray-700">Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full"></div>
                  <span className="text-gray-700">Assist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                  <span className="text-gray-700">Shot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
