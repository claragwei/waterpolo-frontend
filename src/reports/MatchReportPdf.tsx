import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { MatchReportBundle } from './aggregateMatchReport';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 12, color: '#022851' },
  h2: { fontSize: 12, marginTop: 10, marginBottom: 6, color: '#022851' },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 4 },
  cell: { flex: 1 },
  cellN: { width: 40 },
  meta: { marginBottom: 8, color: '#444' },
});

function StatTable({ rows }: { rows: { name: string; g: number; s: number; a: number }[] }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.cell, { flex: 2 }]}>Player</Text>
        <Text style={styles.cellN}>G</Text>
        <Text style={styles.cellN}>S</Text>
        <Text style={styles.cellN}>A</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.row} wrap={false}>
          <Text style={[styles.cell, { flex: 2 }]}>{r.name}</Text>
          <Text style={styles.cellN}>{r.g}</Text>
          <Text style={styles.cellN}>{r.s}</Text>
          <Text style={styles.cellN}>{r.a}</Text>
        </View>
      ))}
    </View>
  );
}

export function MatchReportPdfDoc({
  title,
  bundle,
  opponentName,
  playerNames,
}: {
  title: string;
  bundle: MatchReportBundle;
  opponentName: string;
  playerNames: Map<number, string>;
}) {
  const m = bundle.match;
  const statRows = bundle.player_stats
    .map((s) => ({
      name: playerNames.get(s.player_id) ?? `#${s.player_id}`,
      g: s.goals,
      s: s.shots,
      a: s.assists,
    }))
    .sort((a, b) => b.g - a.g);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.meta}>
          UC Davis vs {opponentName} — {new Date(m.match_date).toLocaleString()}
        </Text>
        <Text style={styles.meta}>Status: {m.status}</Text>
        <Text style={styles.h2}>
          Final score: UC Davis {m.uc_davis_score} — {m.opponent_score} {opponentName}
        </Text>
        <Text style={styles.h2}>Player box (match totals)</Text>
        <StatTable rows={statRows} />
        <Text style={[styles.meta, { marginTop: 16 }]}>
          Plays logged: {bundle.plays.length} | Possession segments: {bundle.possessions.length}
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadMatchReportPdf(args: {
  filename: string;
  title: string;
  bundle: MatchReportBundle;
  opponentName: string;
  playerNames: Map<number, string>;
}): Promise<void> {
  const blob = await pdf(
    <MatchReportPdfDoc
      title={args.title}
      bundle={args.bundle}
      opponentName={args.opponentName}
      playerNames={args.playerNames}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = args.filename.endsWith('.pdf') ? args.filename : `${args.filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
