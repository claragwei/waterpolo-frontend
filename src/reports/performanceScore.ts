/** Mirrors `compute_and_save_score` in backend/main.py (Riley performance index). */

export type StatRow = {
  goals: number;
  shots: number;
  assists: number;
  steals: number;
  rebounds?: number;
  sprints?: number;
  hustle?: number;
  draws?: number;
};

const MAX = {
  conversion: 0.6,
  assists: 3,
  steals: 2.5,
  rebounds: 2,
  sprints: 1.5,
  hustle: 3,
  draws: 2,
} as const;

function norm(val: number, maxVal: number): number {
  return Math.min((val / maxVal) * 100, 100);
}

export function computePerformanceScore(row: StatRow): number {
  const shots = Math.max(row.shots, 0.1);
  const conv = norm(row.goals / shots, MAX.conversion);
  const assist = norm(row.assists, MAX.assists);
  const steal = norm(row.steals, MAX.steals);
  const rebound = norm(row.rebounds ?? 0, MAX.rebounds);
  const sprint = norm(row.sprints ?? 0, MAX.sprints);
  const hustle = norm(row.hustle ?? 0, MAX.hustle);
  const draw = norm(row.draws ?? 0, MAX.draws);
  return (
    Math.round(
      (conv * 0.32 +
        assist * 0.16 +
        steal * 0.16 +
        rebound * 0.08 +
        sprint * 0.08 +
        hustle * 0.07 +
        draw * 0.05) *
        10,
    ) / 10
  );
}

export function scoreTier(score: number): 'elite' | 'strong' | 'average' | 'developing' {
  if (score >= 80) return 'elite';
  if (score >= 60) return 'strong';
  if (score >= 40) return 'average';
  return 'developing';
}
