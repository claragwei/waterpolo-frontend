import { useMemo } from 'react';
import { MatchViewModel } from '../viewmodels/MatchViewModel';
import { PlayerStatsViewModel } from '../viewmodels/PlayerStatsViewModel';
import { TeamStatsViewModel } from '../viewmodels/TeamStatsViewModel';
import { PossessionViewModel } from '../viewmodels/PossessionViewModel';
import { ActionViewModel } from '../viewmodels/ActionViewModel';

export const useMatchViewModel = () => {
  return useMemo(() => new MatchViewModel(), []);
};

export const usePlayerStatsViewModel = () => {
  return useMemo(() => new PlayerStatsViewModel(), []);
};

export const useTeamStatsViewModel = () => {
  return useMemo(() => new TeamStatsViewModel(), []);
};

export const usePossessionViewModel = () => {
  return useMemo(() => new PossessionViewModel(), []);
};

export const useActionViewModel = () => {
  return useMemo(() => new ActionViewModel(), []);
};
