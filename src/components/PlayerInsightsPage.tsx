import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Award, TrendingUp, Activity, Target, Search, ArrowUpDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';

interface PlayerInsightsPageProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_TEAM_ID = Number(import.meta.env.VITE_UCD_TEAM_ID ?? 1);
const AVATAR_FALLBACK = '/team/avatar-placeholder.svg';

type BatchRow = Awaited<ReturnType<typeof api.getPlayersBatchSummary>>[number];

type SortField = 'goals' | 'assists' | 'steals' | 'saves' | 'shotAccuracy';

function isGoalkeeper(position: string | null) {
  return (position ?? '').toLowerCase().includes('goal');
}

function savesProxy(row: BatchRow) {
  return isGoalkeeper(row.position) ? row.total_blocks : 0;
}

export default function PlayerInsightsPage({ onNavigate: _onNavigate }: PlayerInsightsPageProps) {
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [teamLabel, setTeamLabel] = useState('UC Davis');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.getPlayerMatchHistory>>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('goals');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    void (async () => {
      setListLoading(true);
      setListError(null);
      try {
        const rows = await api.getPlayersBatchSummary(DEFAULT_TEAM_ID);
        setBatchRows(rows);
        setSelectedId((prev) => prev ?? rows[0]?.id ?? null);
      } catch (e) {
        setListError(e instanceof Error ? e.message : 'Failed to load players');
        setBatchRows([]);
      } finally {
        setListLoading(false);
      }
      try {
        const season = await api.getSeasonSummary(DEFAULT_TEAM_ID);
        if (season?.team?.name) setTeamLabel(season.team.name);
      } catch {
        /* team label is optional */
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    void (async () => {
      setHistoryLoading(true);
      try {
        const h = await api.getPlayerMatchHistory(selectedId, 40);
        setHistory([...h].sort((a, b) => a.match_date.localeCompare(b.match_date)));
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [selectedId]);

  const selectedRow = useMemo(
    () => batchRows.find((r) => r.id === selectedId) ?? null,
    [batchRows, selectedId],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batchRows;
    return batchRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [batchRows, searchQuery]);

  const sortedRows = useMemo(() => {
    const key = (r: BatchRow): number => {
      switch (sortField) {
        case 'goals':
          return r.total_goals;
        case 'assists':
          return r.total_assists;
        case 'steals':
          return r.total_steals;
        case 'saves':
          return savesProxy(r);
        case 'shotAccuracy':
        default:
          return r.shot_percentage;
      }
    };
    return [...filteredRows].sort((a, b) => {
      const av = key(a);
      const bv = key(b);
      return sortOrder === 'desc' ? bv - av : av - bv;
    });
  }, [filteredRows, sortField, sortOrder]);

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
  }, []);

  const timelineData = useMemo(
    () =>
      history.map((h, i) => ({
        label: `G${i + 1}`,
        dateShort: h.match_date.slice(5, 10),
        goals: h.goals,
        shotPct: h.shots > 0 ? Math.round((h.goals / h.shots) * 1000) / 10 : 0,
        opponent: h.opponent_name,
      })),
    [history],
  );

  const statsComparison = useMemo(() => {
    if (!selectedRow) return [];
    return [
      { metric: 'Goals', value: selectedRow.total_goals, max: Math.max(40, selectedRow.total_goals) },
      { metric: 'Assists', value: selectedRow.total_assists, max: Math.max(25, selectedRow.total_assists) },
      { metric: 'Steals', value: selectedRow.total_steals, max: Math.max(25, selectedRow.total_steals) },
    ];
  }, [selectedRow]);

  const photoSrc = (row: BatchRow) => (row.photo_url && row.photo_url.trim() ? row.photo_url : AVATAR_FALLBACK);

  if (listLoading) {
    return (
      <div className="p-8 bg-[#F5F7FA] min-h-screen text-gray-600">Loading player insights…</div>
    );
  }

  if (listError || batchRows.length === 0) {
    return (
      <div className="p-8 bg-[#F5F7FA] min-h-screen">
        <h1 className="text-[#022851] mb-2">Player Insights</h1>
        <p className="text-gray-600">
          {listError ?? 'No active players found for this team. Add players in the database or check team id.'}
        </p>
      </div>
    );
  }

  if (!selectedRow) {
    return null;
  }

  const gk = isGoalkeeper(selectedRow.position);
  const matchesPlayed = selectedRow.games_played || 0;

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Player Insights</h1>
      </div>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search player by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['goals', 'Goals'],
                ['assists', 'Assists'],
                ['steals', 'Steals'],
                ['saves', 'Saves (GK blocks)'],
                ['shotAccuracy', 'Shot %'],
              ] as const
            ).map(([field, label]) => (
              <Button
                key={field}
                variant={sortField === field ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort(field)}
                className={sortField === field ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#C69214]' : ''}
              >
                <ArrowUpDown size={16} className="mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-[#022851] mb-6">
          Player rankings — sorted by {sortField} ({sortOrder === 'desc' ? 'highest first' : 'lowest first'})
        </h3>
        <div className="space-y-3">
          {sortedRows.map((player, index) => (
            <button
              type="button"
              key={player.id}
              className={`w-full flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all text-left ${
                selectedRow.id === player.id
                  ? 'bg-yellow-50 border-2 border-[#FFBF00]'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => setSelectedId(player.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#022851] text-white rounded-full flex items-center justify-center shrink-0">
                  {index + 1}
                </div>
                <img
                  src={photoSrc(player)}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#FFBF00] shrink-0"
                />
                <div>
                  <p className="text-[#022851]">{player.name}</p>
                  <p className="text-gray-600 text-sm">
                    {player.position ?? '—'} • #{player.jersey_number}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Goals</p>
                  <p className="text-[#022851]">{player.total_goals}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Assists</p>
                  <p className="text-[#022851]">{player.total_assists}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Steals</p>
                  <p className="text-[#022851]">{player.total_steals}</p>
                </div>
                {savesProxy(player) > 0 && (
                  <div className="text-center">
                    <p className="text-gray-500">Blocks</p>
                    <p className="text-[#022851]">{player.total_blocks}</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <img
              src={photoSrc(selectedRow)}
              alt=""
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-[#FFBF00]"
            />
            <h2 className="text-[#022851] mb-1">{selectedRow.name}</h2>
            <p className="text-gray-600 mb-4">{selectedRow.position ?? '—'}</p>
            <div className="flex justify-center gap-4 mb-6">
              <div className="bg-[#022851] text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl">
                {selectedRow.jersey_number}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Team</span>
                <span className="text-[#022851]">{teamLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Matches with stats</span>
                <span className="text-[#022851]">{matchesPlayed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Season shot %</span>
                <span className="text-[#022851]">{selectedRow.shot_percentage}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Season totals</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Goals</p>
                  <p className="text-3xl text-[#022851]">{selectedRow.total_goals}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Award className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Assists</p>
                  <p className="text-3xl text-[#022851]">{selectedRow.total_assists}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Steals</p>
                  <p className="text-3xl text-[#022851]">{selectedRow.total_steals}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">{gk ? 'Blocks (GK proxy)' : 'Shot accuracy'}</p>
                  <p className="text-3xl text-[#022851]">{gk ? selectedRow.total_blocks : `${selectedRow.shot_percentage}%`}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-2">Per-match trend</h3>
          <p className="text-xs text-gray-500 mb-4">Chronological games with logged box scores</p>
          {historyLoading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">Loading history…</div>
          ) : timelineData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No match stats yet for this player.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dateShort" stroke="#6B7280" />
                <YAxis yAxisId="left" stroke="#6B7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'shotPct' ? [`${value}%`, 'Shot %'] : [value, name === 'goals' ? 'Goals' : name]
                  }
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload
                      ? `${(payload[0].payload as { opponent?: string }).opponent ?? ''}`
                      : ''
                  }
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="goals" stroke="#022851" strokeWidth={2} name="Goals" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="shotPct"
                  stroke="#FFBF00"
                  strokeWidth={2}
                  name="Shot %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Season comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statsComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="metric" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#FFBF00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
