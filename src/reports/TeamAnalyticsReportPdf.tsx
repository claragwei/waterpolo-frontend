import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { RapmEntry, RegressionSummary, SubRecommendation } from './playerAnalytics';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 8, color: '#022851' },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 6, color: '#022851' },
  meta: { color: '#555', marginBottom: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingVertical: 4 },
  cell: { flex: 1 },
  bullet: { marginBottom: 4, paddingLeft: 8 },
});

export async function downloadTeamAnalyticsPdf(args: {
  filename: string;
  rapm: RapmEntry[];
  regression: RegressionSummary;
  subs: SubRecommendation[];
  avgRapm: number;
}): Promise<void> {
  const blob = await pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Team Analytics — aqualytics</Text>
        <Text style={styles.meta}>
          Simulated RAPM-style ratings from logged box scores • {new Date().toLocaleDateString()}
        </Text>

        <Text style={styles.h2}>RAPM-style player impact (regularized vs team mean)</Text>
        <Text style={styles.meta}>Team avg rating: {args.avgRapm.toFixed(2)} • {args.rapm.length} players</Text>
        <View style={styles.row}>
          <Text style={[styles.cell, { flex: 2 }]}>Player</Text>
          <Text style={styles.cell}>RAPM</Text>
          <Text style={styles.cell}>Avg PPI</Text>
          <Text style={styles.cell}>Games</Text>
        </View>
        {args.rapm.slice(0, 18).map((r) => (
          <View key={r.player_id} style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{r.name}</Text>
            <Text style={styles.cell}>{r.rapm >= 0 ? `+${r.rapm}` : r.rapm}</Text>
            <Text style={styles.cell}>{r.avg_ppi}</Text>
            <Text style={styles.cell}>{r.games}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Performance vs play time (regression)</Text>
        <Text style={styles.meta}>
          Pearson r = {args.regression.pearson_r} • n = {args.regression.n} game rows • slope ={' '}
          {args.regression.slope.toFixed(4)}
        </Text>
        <Text style={styles.meta}>{args.regression.insight}</Text>

        <Text style={styles.h2}>Substitution recommendations</Text>
        {args.subs.length === 0 ? (
          <Text style={styles.meta}>No high-priority subs flagged for the latest match sample.</Text>
        ) : (
          args.subs.map((s, i) => (
            <Text key={i} style={styles.bullet}>
              [{s.priority.toUpperCase()}] {s.player_name}: {s.reason}
            </Text>
          ))
        )}

        <Text style={[styles.meta, { marginTop: 16 }]}>
          Note: Full lineup RAPM requires stint tracking (6-man combinations). This report uses a regularized
          performance-index proxy until lineup segments are logged in Live Stats.
        </Text>
      </Page>
    </Document>,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = args.filename.endsWith('.pdf') ? args.filename : `${args.filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
