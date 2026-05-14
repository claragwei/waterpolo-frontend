import { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';

interface MatchDetailsPageProps {
  matchId: number;
  onNavigate: (page: string) => void;
}

const AVATAR_FALLBACK = '/team/avatar-placeholder.svg';

export default function MatchDetailsPage({ matchId, onNavigate }: MatchDetailsPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Awaited<ReturnType<typeof api.getMatch>> | null>(null);
  const [teams, setTeams] = useState<Awaited<ReturnType<typeof api.getTeams>>>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getMatchStats>>>([]);
  const [plays, setPlays] = useState<Awaited<ReturnType<typeof api.getMatchPlays>>>([]);
  const [playersById, setPlayersById] = useState<
    Record<number, { name: string; position: string | null; photo_url?: string | null }>
  >({});

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const m = await api.getMatch(matchId);
        const [teamRows, statRows, playRows] = await Promise.all([
          api.getTeams(),
          api.getMatchStats(matchId),
          api.getMatchPlays(matchId),
        ]);
        const roster = await api.getPlayers({ team_id: m.uc_davis_team_id, is_active: true }).catch(() => []);
        const pmap: Record<number, { name: string; position: string | null; photo_url?: string | null }> = {};
        for (const p of roster) {
          pmap[p.id] = { name: p.name, position: p.position, photo_url: p.photo_url };
        }
        setMatch(m);
        setTeams(teamRows);
        setStats(statRows);
        setPlays(playRows);
        setPlayersById(pmap);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load match');
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  const ucTeam = useMemo(
    () => teams.find((t) => t.id === match?.uc_davis_team_id),
    [teams, match?.uc_davis_team_id],
  );
  const oppTeam = useMemo(
    () => teams.find((t) => t.id === match?.opponent_team_id),
    [teams, match?.opponent_team_id],
  );

  const shotEvents = useMemo(() => {
    if (!match) return { uc: 0, opp: 0 };
    let uc = 0;
    let opp = 0;
    for (const p of plays) {
      const et = (p.event_type ?? '').toLowerCase();
      if (et !== 'shot' && et !== 'goal') continue;
      if (p.team_id === match.uc_davis_team_id) uc += 1;
      else if (p.team_id === match.opponent_team_id) opp += 1;
    }
    return { uc, opp };
  }, [plays, match]);

  const teamTotals = useMemo(() => {
    let goals = 0;
    let shots = 0;
    let assists = 0;
    let steals = 0;
    let blocks = 0;
    for (const s of stats) {
      goals += s.goals;
      shots += s.shots;
      assists += s.assists;
      steals += s.steals;
      blocks += s.blocks;
    }
    return { goals, shots, assists, steals, blocks };
  }, [stats]);

  const teamComparison = useMemo(() => {
    if (!match) return [];
    const ourShots = teamTotals.shots > 0 ? teamTotals.shots : shotEvents.uc;
    const oppShots = shotEvents.opp || Math.max(match.opponent_score * 2, 1);
    return [
      { metric: 'Goals', ourTeam: match.uc_davis_score, opponent: match.opponent_score },
      { metric: 'Shots (est.)', ourTeam: ourShots, opponent: oppShots },
      { metric: 'Steals', ourTeam: teamTotals.steals, opponent: 0 },
      { metric: 'Blocks', ourTeam: teamTotals.blocks, opponent: 0 },
    ];
  }, [match, teamTotals, shotEvents]);

  const radarData = useMemo(() => {
    if (!match) return [];
    const maxG = Math.max(match.uc_davis_score, match.opponent_score, 1);
    const maxS = Math.max(teamComparison[1]?.ourTeam ?? 1, teamComparison[1]?.opponent ?? 1, 1);
    return [
      {
        subject: 'Goals',
        A: Math.round((match.uc_davis_score / maxG) * 100),
        B: Math.round((match.opponent_score / maxG) * 100),
        fullMark: 100,
      },
      {
        subject: 'Shots',
        A: Math.round(((teamComparison[1]?.ourTeam ?? 0) / maxS) * 100),
        B: Math.round(((teamComparison[1]?.opponent ?? 0) / maxS) * 100),
        fullMark: 100,
      },
      {
        subject: 'Steals',
        A: Math.min(100, teamTotals.steals * 10),
        B: 20,
        fullMark: 100,
      },
      {
        subject: 'Blocks',
        A: Math.min(100, teamTotals.blocks * 10),
        B: 15,
        fullMark: 100,
      },
    ];
  }, [match, teamComparison, teamTotals]);

  const topPlayers = useMemo(() => {
    const rows = [...stats]
      .map((s) => {
        const meta = playersById[s.player_id];
        const shotPct = s.shots > 0 ? Math.round((s.goals / s.shots) * 1000) / 10 : 0;
        const rating = Math.round((s.goals * 2 + s.assists + s.steals * 0.5) * 10) / 10;
        return {
          id: s.player_id,
          name: meta?.name ?? `Player #${s.player_id}`,
          position: meta?.position ?? '—',
          goals: s.goals,
          assists: s.assists,
          rating,
          shotPct,
          photo: meta?.photo_url?.trim() ? meta.photo_url! : AVATAR_FALLBACK,
        };
      })
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 6);
    return rows;
  }, [stats, playersById]);

  const keyStats = useMemo(() => {
    if (!match) return [];
    const acc =
      teamTotals.shots > 0 ? Math.round((teamTotals.goals / teamTotals.shots) * 1000) / 10 : 0;
    return [
      { label: 'Shot accuracy (team)', value: `${acc}%`, color: 'bg-blue-700' },
      { label: 'Goals scored', value: String(match.uc_davis_score), color: 'bg-purple-500' },
      { label: 'Assists (team)', value: String(teamTotals.assists), color: 'bg-yellow-500' },
      { label: 'Steals (team)', value: String(teamTotals.steals), color: 'bg-orange-500' },
    ];
  }, [match, teamTotals]);

  const matchDateLabel = useMemo(() => {
    if (!match) return '';
    try {
      return new Date(match.match_date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return match.match_date;
    }
  }, [match]);

  if (loading) {
    return <div className="p-8 bg-[#F5F7FA] min-h-screen text-gray-600">Loading match…</div>;
  }

  if (error || !match) {
    return (
      <div className="p-8 bg-[#F5F7FA] min-h-screen">
        <p className="text-red-600">{error ?? 'Match not found'}</p>
        <Button variant="ghost" className="mt-4" onClick={() => onNavigate('matches')}>
          Back to matches
        </Button>
      </div>
    );
  }

  const resultLabel = `${match.uc_davis_score}–${match.opponent_score}`;

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 text-gray-600 hover:text-[#022851]"
          onClick={() => onNavigate('matches')}
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Matches
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#022851] mb-2">Match Details</h1>
            <p className="text-gray-600">
              {matchDateLabel}
              {match.location ? ` • ${match.location}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-gray-300" type="button">
              <Share2 className="mr-2" size={16} />
              Share
            </Button>
            <Button
              className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]"
              type="button"
              onClick={() => onNavigate('reports')}
            >
              <Download className="mr-2" size={16} />
              Reports
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-center gap-12">
          <div className="text-center">
            <h2 className="text-[#022851] mb-2">{ucTeam?.short_name ?? 'UC Davis'}</h2>
            <div className="w-20 h-20 bg-[#FFBF00] rounded-full flex items-center justify-center text-[#022851] text-3xl mb-2">
              {match.uc_davis_score}
            </div>
          </div>
          <div className="text-6xl text-gray-300">VS</div>
          <div className="text-center">
            <h2 className="text-[#022851] mb-2">{oppTeam?.name ?? 'Opponent'}</h2>
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-white text-3xl mb-2">
              {match.opponent_score}
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4 capitalize">Status: {match.status}</p>
        <p className="text-center text-sm text-gray-600 mt-1">Score line: {resultLabel}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyStats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <div className="w-6 h-6 bg-white/30 rounded"></div>
            </div>
            <h3 className="text-3xl text-[#022851] mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Team comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" />
              <YAxis dataKey="metric" type="category" stroke="#6B7280" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ourTeam" fill="#FFBF00" name={ucTeam?.short_name ?? 'UC Davis'} radius={[0, 8, 8, 0]} />
              <Bar dataKey="opponent" fill="#022851" name={oppTeam?.short_name ?? 'Opp'} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Performance overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
              <PolarRadiusAxis stroke="#6B7280" />
              <Radar name="UC Davis" dataKey="A" stroke="#FFBF00" fill="#FFBF00" fillOpacity={0.3} />
              <Radar name="Opponent" dataKey="B" stroke="#022851" fill="#022851" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-6">Top players (by goals)</h3>
        {topPlayers.length === 0 ? (
          <p className="text-gray-500 text-sm">No player stats recorded for this match yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPlayers.map((player) => (
              <div key={player.id} className="bg-gray-50 rounded-xl p-6 text-center">
                <img
                  src={player.photo}
                  alt=""
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-[#FFBF00]"
                />
                <h4 className="text-[#022851] mb-1">{player.name}</h4>
                <p className="text-gray-600 text-sm mb-4">{player.position}</p>
                <div className="flex justify-center gap-4 mb-4">
                  <div>
                    <p className="text-2xl text-[#022851]">{player.goals}</p>
                    <p className="text-xs text-gray-600">Goals</p>
                  </div>
                  <div className="w-px bg-gray-300"></div>
                  <div>
                    <p className="text-2xl text-[#022851]">{player.assists}</p>
                    <p className="text-xs text-gray-600">Assists</p>
                  </div>
                </div>
                <div className="bg-[#FFBF00] text-[#022851] px-4 py-2 rounded-lg inline-block text-sm">
                  Index {player.rating} • Shot {player.shotPct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
