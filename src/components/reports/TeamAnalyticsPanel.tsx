import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Loader2, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { loadTeamAnalytics, type TeamAnalyticsSnapshot } from '../../reports/loadTeamAnalytics';
import { downloadTeamAnalyticsPdf } from '../../reports/TeamAnalyticsReportPdf';
import { toast } from 'sonner';

function RapmBarChart({ chartData }: { chartData: { name: string; rapm: number; fill: string }[] }) {
  if (!chartData.length) {
    return <p className="text-gray-500 text-sm">Log matches in Live Stats to populate ratings.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis type="number" domain={[-2, 5]} stroke="#888" />
          <YAxis type="category" dataKey="name" width={72} stroke="#888" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #333' }}
            formatter={(v: number) => [`${v}`, 'RAPM']}
          />
          <Bar dataKey="rapm" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TeamAnalyticsPanel() {
  const [data, setData] = useState<TeamAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    void loadTeamAnalytics()
      .then((snap) => {
        if (!cancel) setData(snap);
      })
      .catch(() => {
        if (!cancel) toast.error('Could not load team analytics');
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const downloadPdf = async () => {
    if (!data) return;
    setPdfBusy(true);
    try {
      await downloadTeamAnalyticsPdf({
        filename: 'team-analytics-rapm',
        rapm: data.rapm,
        regression: data.regression,
        subs: data.subs,
        avgRapm: data.avgRapm,
      });
      toast.success('Team analytics PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PDF failed');
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center gap-3 text-gray-600">
        <Loader2 className="animate-spin" size={20} />
        Loading RAPM-style analytics…
      </Card>
    );
  }

  if (!data) return null;

  const chartData = data.rapm.slice(0, 14).map((r) => ({
    name: r.name.split(' ')[0],
    rapm: r.rapm,
    fill: r.rapm >= 0 ? '#22c55e' : '#ef4444',
  }));

  return (
    <Card className="p-6 bg-[#0a0f1a] text-white border border-white/10 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Team analytics</h2>
          <p className="text-gray-400 text-sm mt-1">
            {data.rapm.length} players • avg RAPM {data.avgRapm.toFixed(2)}
          </p>
        </div>
        <Button
          type="button"
          className="bg-[#FFBF00] text-[#022851] hover:bg-[#E6AC00]"
          disabled={pdfBusy}
          onClick={() => void downloadPdf()}
        >
          {pdfBusy ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Download className="mr-2" size={16} />}
          Download analytics PDF
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-2">
            <Users size={16} /> RAPM-style impact (simulated)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Regularized vs team mean • {data.fromLiveData ? 'Live database' : 'Demo until matches are logged'}
          </p>
          <RapmBarChart chartData={chartData} />
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-white/5 border-white/10">
            <h3 className="text-sm font-semibold text-[#FFBF00] mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Performance vs play time
            </h3>
            <p className="text-sm text-gray-300">
              Pearson r = <strong>{data.regression.pearson_r}</strong> (n={data.regression.n})
            </p>
            <p className="text-xs text-gray-400 mt-2">{data.regression.insight}</p>
          </Card>

          <Card className="p-4 bg-white/5 border-white/10">
            <h3 className="text-sm font-semibold text-[#FFBF00] mb-2">Substitution recommendations</h3>
            <p className="text-xs text-gray-500 mb-2">{data.latestMatchLabel}</p>
            {data.subs.length === 0 ? (
              <p className="text-sm text-gray-400">No urgent subs flagged.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.subs.map((s, i) => (
                  <li key={i} className="text-gray-300">
                    <span className={s.priority === 'high' ? 'text-red-400' : 'text-amber-400'}>
                      [{s.priority}]
                    </span>{' '}
                    <strong>{s.player_name}</strong> — {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Full lineup RAPM (6-man combinations) is on the roadmap — requires stint tracking in Live Stats. This panel uses
        the performance index (PPI) from logged box scores.
      </p>
    </Card>
  );
}
