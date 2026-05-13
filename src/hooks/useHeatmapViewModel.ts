import { useState, useEffect, useCallback } from 'react';
import heatmapViewModel, { HeatmapPoint, MatchOption } from '../viewmodels/HeatmapViewModel';

interface UseHeatmapViewModelResult {
  shotPoints: HeatmapPoint[];
  goalPoints: HeatmapPoint[];
  matches: MatchOption[];
  loading: boolean;
  error: string | null;
  setSelectedMatch: (matchId: number | null) => void;
}

export function useHeatmapViewModel(): UseHeatmapViewModelResult {
  const [shotPoints, setShotPoints] = useState<HeatmapPoint[]>([]);
  const [goalPoints, setGoalPoints] = useState<HeatmapPoint[]>([]);
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const fetchData = useCallback(async (matchId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const [shots, goals] = await Promise.all([
        heatmapViewModel.fetchShotLocations(matchId),
        heatmapViewModel.fetchGoalLocations(matchId),
      ]);
      setShotPoints(shots);
      setGoalPoints(goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load matches list once on mount
  useEffect(() => {
    void heatmapViewModel
      .fetchMatches()
      .then(setMatches)
      .catch((err) => {
        console.error('Failed to load matches for heatmap filter:', err);
        setMatches([]);
        setError(err instanceof Error ? err.message : 'Failed to load matches for heatmap');
      });
  }, []);

  // Fetch data whenever selected match changes
  useEffect(() => {
    fetchData(selectedMatchId);
  }, [selectedMatchId, fetchData]);

  const setSelectedMatch = useCallback((matchId: number | null) => {
    setSelectedMatchId(matchId);
  }, []);

  return { shotPoints, goalPoints, matches, loading, error, setSelectedMatch };
}
