import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 8, color: '#022851' },
  h2: { fontSize: 12, marginTop: 10, marginBottom: 6, color: '#022851' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
});

export async function downloadPlayerSeasonPdf(args: {
  filename: string;
  playerName: string;
  season: string;
  stats: {
    games_played?: number;
    avg_goals?: number;
    avg_assists?: number;
    avg_steals?: number;
    shot_percentage?: number;
  };
  ppi?: number;
  tier?: string;
}): Promise<void> {
  const blob = await pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{args.playerName}</Text>
        <Text style={styles.h2}>Season {args.season} — Player development report</Text>
        <View style={styles.row}>
          <Text>Games played</Text>
          <Text>{args.stats.games_played ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Avg goals / game</Text>
          <Text>{args.stats.avg_goals ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Avg assists / game</Text>
          <Text>{args.stats.avg_assists ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Avg steals / game</Text>
          <Text>{args.stats.avg_steals ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Shot %</Text>
          <Text>{args.stats.shot_percentage != null ? `${args.stats.shot_percentage}%` : '—'}</Text>
        </View>
        {args.ppi != null && (
          <View style={styles.row}>
            <Text>Performance index (PPI)</Text>
            <Text>
              {args.ppi} {args.tier ? `(${args.tier})` : ''}
            </Text>
          </View>
        )}
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
