import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { PossessionEvent, TeamStat } from '../types';
import PossessionTimeline from './PossessionTimeline';

interface TeamSituationsProps {
  teamStats: TeamStat;
  onUpdateTeamStat: (stat: keyof TeamStat) => void;
  possessionTimeline?: PossessionEvent[];
}

export default function TeamSituations({
  teamStats,
  onUpdateTeamStat,
  possessionTimeline,
}: TeamSituationsProps) {
  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] mb-3 text-lg">Team Situations</h3>
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={() => onUpdateTeamStat('FCO')} className="bg-[#022851] hover:bg-[#022851]/90 text-white h-12 text-xs px-1">
          FCO <Badge className="ml-1 bg-[#FFBF00] text-[#022851]">{teamStats.FCO}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('FCD')} className="bg-[#022851] hover:bg-[#022851]/90 text-white h-12 text-xs px-1">
          FCD <Badge className="ml-1 bg-[#FFBF00] text-[#022851]">{teamStats.FCD}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('CAO')} className="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-[#022851] h-12 text-xs px-1">
          CAO <Badge className="ml-1 bg-[#022851] text-white">{teamStats.CAO}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('CAD')} className="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-[#022851] h-12 text-xs px-1">
          CAD <Badge className="ml-1 bg-[#022851] text-white">{teamStats.CAD}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('AG')} className="bg-green-600 hover:bg-green-700 text-white h-12 text-xs px-1">
          AG <Badge className="ml-1 bg-white text-green-700">{teamStats.AG}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('AGD')} className="bg-green-700 hover:bg-green-800 text-white h-12 text-xs px-1">
          AGD <Badge className="ml-1 bg-white text-green-800">{teamStats.AGD}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('sixOnFive')} className="bg-purple-600 hover:bg-purple-700 text-white h-12 text-xs px-1">
          6v5 <Badge className="ml-1 bg-white text-purple-700">{teamStats.sixOnFive}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('fiveOnSix')} className="bg-purple-700 hover:bg-purple-800 text-white h-12 text-xs px-1">
          5v6 <Badge className="ml-1 bg-white text-purple-800">{teamStats.fiveOnSix}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('sevenOnSix')} className="bg-orange-600 hover:bg-orange-700 text-white h-12 text-xs px-1">
          7v6 <Badge className="ml-1 bg-white text-orange-700">{teamStats.sevenOnSix}</Badge>
        </Button>
        <Button onClick={() => onUpdateTeamStat('sixOnSeven')} className="bg-orange-700 hover:bg-orange-800 text-white h-12 text-xs px-1">
          6v7 <Badge className="ml-1 bg-white text-orange-800">{teamStats.sixOnSeven}</Badge>
        </Button>
      </div>
      {possessionTimeline != null && (
        <PossessionTimeline possessionTimeline={possessionTimeline} compact embedded />
      )}
    </Card>
  );
}
