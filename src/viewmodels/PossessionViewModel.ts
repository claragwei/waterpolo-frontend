import { api } from '../services/api';

export interface StartPossessionParams {
  matchId: number;
  teamId: number;
  quarter: number;
  startTimeSeconds: number;
  startReason: string | null;
}

export interface EndPossessionParams {
  matchId: number;
  possessionId: number;
  endTimeSeconds: number;
  durationSeconds: number;
  endReason: string | null;
}

class PossessionViewModel {
  async startPossession(params: StartPossessionParams): Promise<number | null> {
    try {
      const row = await api.createPossession(params.matchId, {
        team_id: params.teamId,
        quarter: params.quarter,
        start_time: params.startTimeSeconds,
        outcome: params.startReason ?? undefined,
        is_power_play: false,
      });
      return row.id;
    } catch (err) {
      console.error('PossessionViewModel.startPossession error:', err);
      return null;
    }
  }

  async endPossession(params: EndPossessionParams): Promise<void> {
    try {
      await api.patchPossession(params.matchId, params.possessionId, {
        end_time: params.endTimeSeconds,
        outcome: params.endReason,
      });
    } catch (err) {
      console.error('PossessionViewModel.endPossession error:', err);
    }
  }
}

export default new PossessionViewModel();
