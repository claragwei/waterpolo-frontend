import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, MapPin, Trophy, Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { api } from '../services/api';
import { toast } from 'sonner';

interface MatchesPageProps {
  onNavigate: (page: string, matchId?: number) => void;
}

interface ApiMatch {
  id: number;
  uc_davis_team_id: number;
  opponent_team_id: number;
  match_date: string;
  location?: string | null;
  uc_davis_score: number;
  opponent_score: number;
  status: string;
  current_quarter: number;
  game_time?: string | null;
  referee_name?: string | null;
  created_at?: string;
}

function formatMatchDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

function resultLabel(uc: number, opp: number): string {
  if (uc > opp) return `W ${uc}–${opp}`;
  if (uc < opp) return `L ${uc}–${opp}`;
  return `T ${uc}–${opp}`;
}

export default function MatchesPage({ onNavigate }: MatchesPageProps) {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [teamNames, setTeamNames] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oppName, setOppName] = useState('');
  const [oppShort, setOppShort] = useState('');
  const [whenLocal, setWhenLocal] = useState(''); // datetime-local
  const [location, setLocation] = useState('UC Davis Aquatic Center');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRows, teams] = await Promise.all([
        api.getMatches({ limit: 100 }),
        api.getTeams(),
      ]);
      setMatches(matchRows as ApiMatch[]);
      const m = new Map<number, string>();
      for (const t of teams) {
        m.set(t.id, t.name);
      }
      setTeamNames(m);
    } catch (e) {
      console.error(e);
      toast.error('Could not load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === 'scheduled' ||
          m.status === 'upcoming' ||
          m.status === 'in_progress',
      ),
    [matches],
  );
  const completed = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches]);

  const getResultColor = (result: string) => {
    if (result.startsWith('W')) return 'text-green-600 bg-green-50';
    if (result.startsWith('T')) return 'text-yellow-600 bg-yellow-50';
    if (result.startsWith('L')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const openSchedule = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setWhenLocal(d.toISOString().slice(0, 16));
    setOppName('');
    setOppShort('');
    setLocation('UC Davis Aquatic Center');
    setScheduleOpen(true);
  };

  const submitSchedule = async () => {
    const name = oppName.trim();
    if (!name) {
      toast.error('Enter an opponent team name');
      return;
    }
    if (!whenLocal) {
      toast.error('Pick date and time');
      return;
    }
    setSaving(true);
    try {
      const short =
        (oppShort.trim() || name.replace(/\s+/g, ' ').slice(0, 8).toUpperCase()) || 'OPP';
      let teams = await api.getTeams({ name });
      let opponent = teams[0];
      if (!opponent) {
        opponent = await api.createTeam({
          name,
          short_name: short.length > 12 ? short.slice(0, 12) : short,
          is_uc_davis: false,
        });
      }
      const iso = new Date(whenLocal).toISOString();
      await api.createMatch({
        uc_davis_team_id: 1,
        opponent_team_id: opponent.id,
        match_date: iso,
        location: location.trim() || 'TBD',
        status: 'scheduled',
      });
      toast.success('Match scheduled');
      setScheduleOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not schedule match');
    } finally {
      setSaving(false);
    }
  };

  const opponentLabel = (m: ApiMatch) =>
    teamNames.get(m.opponent_team_id) ?? `Team #${m.opponent_team_id}`;

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[#022851] mb-2">Matches</h1>
          <p className="text-gray-600">View and schedule matches from the database</p>
        </div>
        <Button
          type="button"
          onClick={openSchedule}
          className="bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]"
        >
          <Calendar className="mr-2" size={16} />
          Schedule Match
        </Button>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#022851]">Schedule a match</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="opp-name">Opponent team name</Label>
              <Input
                id="opp-name"
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
                placeholder="e.g. Stanford"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-short">Short name (optional)</Label>
              <Input
                id="opp-short"
                value={oppShort}
                onChange={(e) => setOppShort(e.target.value)}
                placeholder="Auto from name if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="when">Date & time</Label>
              <Input
                id="when"
                type="datetime-local"
                value={whenLocal}
                onChange={(e) => setWhenLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Location</Label>
              <Input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pool / venue"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#022851] text-white"
              disabled={saving}
              onClick={() => void submitSchedule()}
            >
              {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Save match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading matches…
        </div>
      ) : null}

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-[#022851] mb-4">Upcoming Matches</h2>
        {!loading && upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming matches. Schedule one above.</p>
        ) : null}
        <div className="grid gap-4">
          {upcoming.map((match) => {
            const { date, time } = formatMatchDate(match.match_date);
            return (
              <Card key={match.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">{date}</p>
                      <p className="text-2xl text-[#022851]">{time}</p>
                    </div>
                    <div className="w-px h-16 bg-gray-200 hidden sm:block" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="text-[#FFBF00]" size={20} />
                        <h3 className="text-[#022851]">vs {opponentLabel(match)}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin size={16} />
                        <span>{match.location ?? 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm capitalize">
                    {match.status}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent / completed */}
      <div>
        <h2 className="text-[#022851] mb-4">Recent Matches</h2>
        {!loading && completed.length === 0 ? (
          <p className="text-gray-500 text-sm">No completed matches yet.</p>
        ) : null}
        <div className="grid gap-4">
          {completed.map((match) => {
            const { date, time } = formatMatchDate(match.match_date);
            const result = resultLabel(match.uc_davis_score, match.opponent_score);
            return (
              <Card
                key={match.id}
                className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">{date}</p>
                      <p className={`text-2xl px-4 py-2 rounded-lg ${getResultColor(result)}`}>
                        {result}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">{time}</p>
                    </div>
                    <div className="w-px h-16 bg-gray-200 hidden sm:block" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="text-[#FFBF00]" size={20} />
                        <h3 className="text-[#022851]">vs {opponentLabel(match)}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin size={16} />
                        <span>{match.location ?? '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center text-sm text-gray-600">
                      <p className="font-semibold text-[#022851] text-lg">
                        {match.uc_davis_score} – {match.opponent_score}
                      </p>
                      <p>Final</p>
                    </div>
                    <Button
                      onClick={() => onNavigate('match-details', match.id)}
                      className="bg-[#022851] hover:bg-[#1a2f4a] text-white"
                    >
                      <Eye className="mr-2" size={16} />
                      View Details
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
