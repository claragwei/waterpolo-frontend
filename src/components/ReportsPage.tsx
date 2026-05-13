import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Calendar, User, Trophy, Clock, Flag, Loader2, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';
import { ReportDialogsFromBundle } from './reports/ReportDialogsFromBundle';
import { downloadMatchReportPdf } from '../reports/MatchReportPdf';
import type { MatchReportBundle } from '../reports/aggregateMatchReport';

interface ApiMatch {
  id: number;
  opponent_team_id: number;
  match_date: string;
  location?: string | null;
  uc_davis_score: number;
  opponent_score: number;
  status: string;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [showQuarterReport, setShowQuarterReport] = useState(false);
  const [showHalftimeReport, setShowHalftimeReport] = useState(false);
  const [showPlayerReport, setShowPlayerReport] = useState(false);
  const [showSeasonReport, setShowSeasonReport] = useState(false);

  const [dbMatches, setDbMatches] = useState<ApiMatch[]>([]);
  const [teamNames, setTeamNames] = useState<Map<number, string>>(new Map());
  const [reportMatchId, setReportMatchId] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  const [showDbSummary, setShowDbSummary] = useState(false);
  const [dbSummaryLoading, setDbSummaryLoading] = useState(false);
  const [dbSummary, setDbSummary] = useState<{
    match: ApiMatch;
    opponent: string;
    playCount: number;
    goalEvents: number;
  } | null>(null);

  const [reportBundle, setReportBundle] = useState<MatchReportBundle | null>(null);
  const [reportPlayersById, setReportPlayersById] = useState<Map<number, string>>(new Map());
  const [bundleLoading, setBundleLoading] = useState(false);

  const [playerReportId, setPlayerReportId] = useState<string>('');
  const [playerReportData, setPlayerReportData] = useState<{
    averages: Awaited<ReturnType<typeof api.getPlayerAverages>>;
    history: Awaited<ReturnType<typeof api.getPlayerMatchHistory>>;
    name: string;
  } | null>(null);
  const [playerReportLoading, setPlayerReportLoading] = useState(false);

  const [seasonData, setSeasonData] = useState<Awaited<ReturnType<typeof api.getSeasonSummary>> | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const loadDbMatches = useCallback(async () => {
    try {
      const [rows, teams] = await Promise.all([
        api.getMatches({ limit: 80 }),
        api.getTeams(),
      ]);
      const m = new Map<number, string>();
      for (const t of teams) m.set(t.id, t.name);
      setTeamNames(m);
      const list = (rows as ApiMatch[]).filter(
        (x) => x.status === 'completed' || x.status === 'in_progress',
      );
      setDbMatches(list);
      setReportMatchId((prev) => prev || (list.length ? String(list[0].id) : ''));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void loadDbMatches();
  }, [loadDbMatches]);

  useEffect(() => {
    let cancel = false;
    const id = Number(reportMatchId);
    if (!Number.isFinite(id)) {
      setReportBundle(null);
      return;
    }
    setBundleLoading(true);
    void (async () => {
      try {
        const [raw, players] = await Promise.all([
          api.getMatchReportBundle(id),
          api.getPlayers(),
        ]);
        if (cancel) return;
        const pmap = new Map<number, string>();
        for (const p of players) pmap.set(p.id, p.name);
        setReportPlayersById(pmap);
        setReportBundle(raw as unknown as MatchReportBundle);
      } catch (e) {
        if (!cancel) {
          console.error(e);
          setReportBundle(null);
        }
      } finally {
        if (!cancel) setBundleLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [reportMatchId]);

  const buildDbSummary = async (overrideMatchId?: number) => {
    const id = Number(overrideMatchId ?? reportMatchId);
    if (!Number.isFinite(id)) {
      toast.error('Choose a match');
      return;
    }
    setDbSummaryLoading(true);
    try {
      const [match, plays] = await Promise.all([api.getMatch(id), api.getMatchPlays(id)]);
      const m = match as ApiMatch;
      const opponent = teamNames.get(m.opponent_team_id) ?? `Team #${m.opponent_team_id}`;
      const goalEvents = plays.filter((p) => p.event_type === 'goal').length;
      setDbSummary({ match: m, opponent, playCount: plays.length, goalEvents });
      setShowDbSummary(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load match');
    } finally {
      setDbSummaryLoading(false);
    }
  };

  const loadPlayerReport = async () => {
    const pid = Number(playerReportId);
    if (!Number.isFinite(pid)) {
      toast.error('Select a player');
      return;
    }
    setPlayerReportLoading(true);
    try {
      const [averages, history, players] = await Promise.all([
        api.getPlayerAverages(pid),
        api.getPlayerMatchHistory(pid, 30),
        api.getPlayers(),
      ]);
      const name = players.find((p) => p.id === pid)?.name ?? `Player #${pid}`;
      setPlayerReportData({ averages, history, name });
      setShowPlayerReport(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load player');
    } finally {
      setPlayerReportLoading(false);
    }
  };

  const loadSeasonReport = async () => {
    setSeasonLoading(true);
    try {
      const s = await api.getSeasonSummary(1);
      setSeasonData(s);
      setShowSeasonReport(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load season');
    } finally {
      setSeasonLoading(false);
    }
  };

  const postgamePdf = () => {
    if (!reportBundle) {
      toast.error('Load match data first (pick a match above)');
      return;
    }
    void downloadMatchReportPdf({
      filename: `postgame-match-${reportBundle.match.id}`,
      title: `Postgame — UC Davis vs ${reportBundle.opponent_name}`,
      bundle: reportBundle,
      opponentName: reportBundle.opponent_name,
      playerNames: reportPlayersById,
    });
  };

  const reportTemplates = [
    {
      id: 1,
      name: 'Match / Postgame PDF',
      description: 'Full match totals and player box scores from the database',
      icon: Trophy,
      action: () => postgamePdf(),
    },
    {
      id: 2,
      name: 'Player analytics',
      description: 'Career averages and recent games for one player',
      icon: User,
      action: () => void loadPlayerReport(),
    },
    {
      id: 3,
      name: 'Season summary',
      description: 'Active roster and completed home match count',
      icon: Calendar,
      action: () => void loadSeasonReport(),
    },
    {
      id: 4,
      name: 'Team analytics (PDF)',
      description: 'Same as postgame PDF for the selected match',
      icon: FileText,
      action: () => postgamePdf(),
    },
    {
      id: 5,
      name: 'Quarter Report',
      description: 'Per-quarter goals, shots, possession, referee (from plays)',
      icon: Clock,
      action: () => setShowQuarterReport(true),
      highlight: true,
    },
    {
      id: 6,
      name: 'Halftime Report',
      description: 'First-half (Q1+Q2) aggregates',
      icon: Flag,
      action: () => setShowHalftimeReport(true),
      highlight: true,
    },
  ];

  const [ucdPlayerOptions, setUcdPlayerOptions] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const rows = await api.getPlayers({ team_id: 1, is_active: true });
        setUcdPlayerOptions(rows.map((p) => ({ id: p.id, name: p.name })));
        setPlayerReportId((prev) => prev || (rows[0] ? String(rows[0].id) : ''));
      } catch {
        setUcdPlayerOptions([]);
      }
    })();
  }, []);

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <ReportDialogsFromBundle
        bundle={reportBundle}
        playersById={reportPlayersById}
        quarter={selectedQuarter}
        onQuarterChange={setSelectedQuarter}
        showQuarter={showQuarterReport}
        setShowQuarter={setShowQuarterReport}
        showHalftime={showHalftimeReport}
        setShowHalftime={setShowHalftimeReport}
      />

      <Dialog open={showPlayerReport} onOpenChange={setShowPlayerReport}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#022851]">Player report — {playerReportData?.name}</DialogTitle>
          </DialogHeader>
          {playerReportData ? (
            <div className="space-y-3 text-sm">
              <p>
                Games: {playerReportData.averages.games_played} · Shot %:{' '}
                {playerReportData.averages.shot_percentage}%
              </p>
              <p>
                Avg goals {playerReportData.averages.avg_goals} · Avg shots {playerReportData.averages.avg_shots} ·
                Avg assists {playerReportData.averages.avg_assists}
              </p>
              <h4 className="font-semibold text-[#022851] mt-4">Recent games</h4>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {playerReportData.history.map((h) => (
                  <li key={h.match_id} className="flex justify-between border-b border-gray-100 py-1">
                    <span>{new Date(h.match_date).toLocaleDateString()} vs {h.opponent_name}</span>
                    <span>
                      {h.goals}G / {h.shots}S
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="bg-[#022851] text-white w-full mt-2" type="button" onClick={() => window.print()}>
                Print report
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showSeasonReport} onOpenChange={setShowSeasonReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#022851]">Season summary</DialogTitle>
          </DialogHeader>
          {seasonData ? (
            <div className="text-sm space-y-2">
              <p className="font-semibold">{seasonData.team.name}</p>
              <p>Completed home matches: {seasonData.completed_home_matches}</p>
              <p>Active players: {seasonData.active_players.length}</p>
              <Button className="bg-[#022851] text-white mt-2" type="button" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Reports</h1>
        <p className="text-gray-600">PDFs and views are built from your FastAPI / Postgres data</p>
        {bundleLoading ? (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Syncing report bundle…
          </p>
        ) : null}
      </div>

      <Dialog open={showDbSummary} onOpenChange={setShowDbSummary}>
        <DialogContent className="max-w-lg" id="db-match-summary-print">
          <DialogHeader>
            <DialogTitle className="text-[#022851]">Match summary</DialogTitle>
          </DialogHeader>
          {dbSummary ? (
            <div className="space-y-4 text-sm">
              <p className="text-lg font-semibold text-[#022851]">UC Davis vs {dbSummary.opponent}</p>
              <p className="text-gray-600">
                {new Date(dbSummary.match.match_date).toLocaleString()} · {dbSummary.match.location ?? '—'}
              </p>
              <p>
                <span className="text-gray-600">Status:</span>{' '}
                <Badge variant="outline" className="capitalize">
                  {dbSummary.match.status}
                </Badge>
              </p>
              <Card className="p-4 bg-[#022851] text-white">
                <p className="text-center text-sm opacity-90">Score</p>
                <p className="text-center text-4xl font-bold text-[#FFBF00]">
                  {dbSummary.match.uc_davis_score} – {dbSummary.match.opponent_score}
                </p>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <p className="text-gray-500 text-xs">Play-by-play rows</p>
                  <p className="text-xl font-semibold text-[#022851]">{dbSummary.playCount}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-gray-500 text-xs">Goal events</p>
                  <p className="text-xl font-semibold text-[#022851]">{dbSummary.goalEvents}</p>
                </Card>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={() => navigate(`/matches/${dbSummary.match.id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Match page
                </Button>
                <Button className="bg-[#022851] text-white" type="button" onClick={() => window.print()}>
                  Print
                </Button>
                <Button
                  className="bg-[#FFBF00] text-[#022851]"
                  type="button"
                  onClick={() => {
                    if (!reportBundle || reportBundle.match.id !== dbSummary.match.id) {
                      toast.error('Wait for report data to finish loading for this match');
                      return;
                    }
                    void downloadMatchReportPdf({
                      filename: `match-${dbSummary.match.id}-summary`,
                      title: `Match summary — UC Davis vs ${dbSummary.opponent}`,
                      bundle: reportBundle,
                      opponentName: dbSummary.opponent,
                      playerNames: reportPlayersById,
                    });
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-[#022851] mb-2">Data source (all reports below)</h2>
        <p className="text-gray-600 text-sm mb-4">
          Choose a match — templates and PDFs use the same loaded bundle (plays, stats, possessions).
        </p>
        {dbMatches.length === 0 ? (
          <p className="text-gray-500 text-sm">No matches yet — log a game on Live Stats.</p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="report-match">Match</Label>
              <select
                id="report-match"
                className="w-full border rounded-md h-10 px-3 text-sm bg-white"
                value={reportMatchId}
                onChange={(e) => setReportMatchId(e.target.value)}
              >
                {dbMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} vs {teamNames.get(m.opponent_team_id) ?? 'Opponent'} —{' '}
                    {new Date(m.match_date).toLocaleDateString()} ({m.status})
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]"
              disabled={dbSummaryLoading}
              onClick={() => void buildDbSummary()}
            >
              {dbSummaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Quick summary
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-[#022851] mb-2">Player for analytics report</h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>UC Davis player</Label>
            <select
              className="w-full border rounded-md h-10 px-3 text-sm bg-white"
              value={playerReportId}
              onChange={(e) => setPlayerReportId(e.target.value)}
            >
              {ucdPlayerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            className="bg-[#022851] text-white"
            disabled={playerReportLoading}
            onClick={() => void loadPlayerReport()}
          >
            {playerReportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Open player report
          </Button>
        </div>
      </Card>

      <Card className="p-8 bg-gradient-to-br from-[#022851] to-[#034580] text-white rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-2">Season overview</h2>
            <p className="text-gray-300 mb-6">Roster snapshot from the API</p>
            <Button
              className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]"
              type="button"
              disabled={seasonLoading}
              onClick={() => void loadSeasonReport()}
            >
              {seasonLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Open season summary
            </Button>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-[#FFBF00]/20 rounded-full flex items-center justify-center">
              <FileText className="text-[#FFBF00]" size={64} />
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-[#022851] mb-4">Report templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-[#FFBF00]" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#022851] mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    <Button
                      size="sm"
                      className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]"
                      type="button"
                      onClick={template.action}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
