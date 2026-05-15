import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Clock, Trophy, Flag, Download } from 'lucide-react';
import {
  aggregateQuarters,
  combineQuarters,
  refereeAggForQuarter,
  topScorersForQuarter,
  type MatchReportBundle,
} from '../../reports/aggregateMatchReport';
import { downloadMatchReportPdf } from '../../reports/MatchReportPdf';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface ReportDialogsProps {
  bundle: MatchReportBundle | null;
  playersById: Map<number, string>;
  quarter: number;
  onQuarterChange: (q: number) => void;
  showQuarter: boolean;
  setShowQuarter: (v: boolean) => void;
  showHalftime: boolean;
  setShowHalftime: (v: boolean) => void;
}

export function ReportDialogsFromBundle(props: ReportDialogsProps) {
  const { bundle, playersById, quarter, onQuarterChange, showQuarter, setShowQuarter, showHalftime, setShowHalftime } = props;
  const quarters = bundle ? aggregateQuarters(bundle) : null;
  const opp = bundle?.opponent_name ?? 'Opponent';

  const qData =
    quarters && bundle
      ? (() => {
          const q = quarters[Math.min(4, Math.max(1, quarter)) as 1 | 2 | 3 | 4];
          return {
            ucDavisGoals: q.ucGoals,
            opponentGoals: q.oppGoals,
            ucDavisPossessionTime: q.ucPossessionSec,
            opponentPossessionTime: q.oppPossessionSec,
            totalShots: { ucDavis: q.ucShots, opponent: q.oppShots },
            topScorers: topScorersForQuarter(bundle, quarter, playersById),
            refereeCalls: refereeAggForQuarter(bundle, quarter),
          };
        })()
      : null;

  const halftimeData =
    quarters && bundle
      ? (() => {
          const c = combineQuarters(quarters[1], quarters[2]);
          const ref = {
            yellowCards:
              refereeAggForQuarter(bundle, 1).yellowCards + refereeAggForQuarter(bundle, 2).yellowCards,
            ejections:
              refereeAggForQuarter(bundle, 1).ejections + refereeAggForQuarter(bundle, 2).ejections,
            penalties:
              refereeAggForQuarter(bundle, 1).penalties + refereeAggForQuarter(bundle, 2).penalties,
          };
          return { combined: c, ref, q1: quarters[1], q2: quarters[2] };
        })()
      : null;

  const pdfQuarter = () => {
    if (!bundle) return;
    void downloadMatchReportPdf({
      filename: `quarter-${quarter}-match-${bundle.match.id}`,
      title: `Quarter ${quarter} — UC Davis vs ${bundle.opponent_name}`,
      bundle,
      opponentName: bundle.opponent_name,
      playerNames: playersById,
    });
  };

  const pdfHalftime = () => {
    if (!bundle) return;
    void downloadMatchReportPdf({
      filename: `halftime-match-${bundle.match.id}`,
      title: `Halftime — UC Davis vs ${bundle.opponent_name}`,
      bundle,
      opponentName: bundle.opponent_name,
      playerNames: playersById,
    });
  };

  return (
    <>
      <Dialog open={showQuarter} onOpenChange={setShowQuarter}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#022851]">
              Quarter report — UC Davis vs {opp}
              <span className="block text-sm font-normal text-gray-500 mt-2">Data from your database</span>
            </DialogTitle>
          </DialogHeader>
          {!bundle || !qData ? (
            <p className="text-gray-600 text-sm">Pick a match above and wait for data to load.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-sm text-gray-600">Quarter:</span>
                {[1, 2, 3, 4].map((q) => (
                  <Button
                    key={q}
                    type="button"
                    size="sm"
                    variant={quarter === q ? 'default' : 'outline'}
                    className={quarter === q ? 'bg-[#022851]' : ''}
                    onClick={() => onQuarterChange(q)}
                  >
                    Q{q}
                  </Button>
                ))}
              </div>
              <Card className="p-6 bg-gradient-to-br from-[#022851] to-[#034580]">
                <div className="flex justify-between items-center text-white">
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">UC Davis</div>
                    <div className="text-5xl font-bold text-[#FFBF00]">{qData.ucDavisGoals}</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-[#FFBF00] text-[#022851] text-lg px-4 py-2">Q{quarter}</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">{opp}</div>
                    <div className="text-5xl font-bold">{qData.opponentGoals}</div>
                  </div>
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                    <Clock size={18} className="text-[#FFBF00]" />
                    Possession time
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">UC Davis</span>
                      <span className="font-semibold">{formatTime(qData.ucDavisPossessionTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{opp}</span>
                      <span className="font-semibold">{formatTime(qData.opponentPossessionTime)}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                    <Trophy size={18} className="text-[#FFBF00]" />
                    Shots
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">UC Davis</span>
                      <span className="font-semibold">{qData.totalShots.ucDavis}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{opp}</span>
                      <span className="font-semibold">{qData.totalShots.opponent}</span>
                    </div>
                  </div>
                </Card>
              </div>
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3">Top scorers</h3>
                <div className="space-y-2">
                  {qData.topScorers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No plays with player this quarter.</p>
                  ) : (
                    qData.topScorers.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{player.name}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">{player.goals} goals</span>
                          <span className="text-gray-600">{player.shots} shots</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Flag size={18} className="text-[#FFBF00]" />
                  Referee
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{qData.refereeCalls.yellowCards}</div>
                    <div className="text-sm text-gray-600">Yellow</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{qData.refereeCalls.ejections}</div>
                    <div className="text-sm text-gray-600">Ejections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#022851]">{qData.refereeCalls.penalties}</div>
                    <div className="text-sm text-gray-600">Penalties</div>
                  </div>
                </div>
              </Card>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowQuarter(false)}>
                  Close
                </Button>
                <Button className="bg-[#022851] text-white" type="button" onClick={pdfQuarter}>
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showHalftime} onOpenChange={setShowHalftime}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#022851]">
              Halftime — UC Davis vs {opp}
              <span className="block text-sm font-normal text-gray-500 mt-2">Q1+Q2 aggregates</span>
            </DialogTitle>
          </DialogHeader>
          {!bundle || !halftimeData ? (
            <p className="text-gray-600 text-sm">Pick a match above and wait for data to load.</p>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-[#022851] to-[#034580]">
                <div className="flex justify-between items-center text-white">
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">UC Davis</div>
                    <div className="text-5xl font-bold text-[#FFBF00]">{halftimeData.combined.ucGoals}</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-[#FFBF00] text-[#022851] text-lg px-4 py-2">Halftime</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">{opp}</div>
                    <div className="text-5xl font-bold">{halftimeData.combined.oppGoals}</div>
                  </div>
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-2 border-[#FFBF00]">
                  <h3 className="text-[#022851] mb-3">Q1</h3>
                  <p className="text-sm">
                    {halftimeData.q1.ucGoals}–{halftimeData.q1.oppGoals} · Shots {halftimeData.q1.ucShots}–
                    {halftimeData.q1.oppShots}
                  </p>
                </Card>
                <Card className="p-4 border-2 border-[#022851]">
                  <h3 className="text-[#022851] mb-3">Q2</h3>
                  <p className="text-sm">
                    {halftimeData.q2.ucGoals}–{halftimeData.q2.oppGoals} · Shots {halftimeData.q2.ucShots}–
                    {halftimeData.q2.oppShots}
                  </p>
                </Card>
              </div>
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3">Possession</h3>
                <p className="text-sm text-gray-700">
                  UC Davis {formatTime(halftimeData.combined.ucPossessionSec)} — {opp}{' '}
                  {formatTime(halftimeData.combined.oppPossessionSec)}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3">Referee Q1+Q2</h3>
                <p className="text-sm">
                  Yellow {halftimeData.ref.yellowCards} · Ejections {halftimeData.ref.ejections} · Penalties{' '}
                  {halftimeData.ref.penalties}
                </p>
              </Card>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowHalftime(false)}>
                  Close
                </Button>
                <Button className="bg-[#022851] text-white" type="button" onClick={pdfHalftime}>
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
