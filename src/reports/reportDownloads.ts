import { toast } from 'sonner';
import { downloadMatchReportPdf } from './MatchReportPdf';
import { downloadTeamAnalyticsPdf } from './TeamAnalyticsReportPdf';
import { downloadPlayerSeasonPdf } from './PlayerSeasonReportPdf';
import { buildMockReportBundle, mockGameData, mockPlayerNames } from './mockReportBundle';
import { loadTeamAnalytics } from './loadTeamAnalytics';
import { computePerformanceScore, scoreTier } from './performanceScore';

export async function downloadMockQuarterPdf() {
  const bundle = buildMockReportBundle('quarter');
  const q = mockGameData.currentQuarter;
  await downloadMatchReportPdf({
    filename: `quarter-${q}-stanford-demo`,
    title: `Quarter ${q} — UC Davis vs ${mockGameData.opponentName} (demo)`,
    bundle,
    opponentName: mockGameData.opponentName,
    playerNames: mockPlayerNames(),
  });
  toast.success('Quarter report PDF downloaded');
}

export async function downloadMockHalftimePdf() {
  const bundle = buildMockReportBundle('halftime');
  await downloadMatchReportPdf({
    filename: 'halftime-stanford',
    title: `Halftime — UC Davis vs ${mockGameData.opponentName}`,
    bundle,
    opponentName: mockGameData.opponentName,
    playerNames: mockPlayerNames(),
  });
  toast.success('Halftime report PDF downloaded');
}

export async function downloadTeamAnalyticsReportPdf() {
  const snap = await loadTeamAnalytics();
  await downloadTeamAnalyticsPdf({
    filename: 'team-analytics',
    rapm: snap.rapm,
    regression: snap.regression,
    subs: snap.subs,
    avgRapm: snap.avgRapm,
  });
  toast.success('Team analytics PDF downloaded');
}

export async function downloadPlayerReportPdf(args: {
  playerName: string;
  season: string;
  stats: {
    games_played?: number;
    avg_goals?: number;
    avg_assists?: number;
    avg_steals?: number;
    shot_percentage?: number;
  };
  statRow?: { goals: number; shots: number; assists: number; steals: number };
}) {
  const ppi = args.statRow ? computePerformanceScore(args.statRow) : undefined;
  await downloadPlayerSeasonPdf({
    filename: `player-${args.playerName.replace(/\s+/g, '-').toLowerCase()}`,
    playerName: args.playerName,
    season: args.season,
    stats: args.stats,
    ppi,
    tier: ppi != null ? scoreTier(ppi) : undefined,
  });
  toast.success('Player report PDF downloaded');
}
