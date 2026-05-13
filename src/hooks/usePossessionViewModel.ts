import { useState, useCallback, useRef } from 'react';
import possessionViewModel, { StartPossessionParams } from '../viewmodels/PossessionViewModel';

interface EndParams {
  endTimeSeconds: number;
  durationSeconds: number;
  endReason: string | null;
}

interface UsePossessionViewModelResult {
  activePossessionId: number | null;
  startPossession: (params: StartPossessionParams) => void;
  endPossession: (params: EndParams) => void;
}

export function usePossessionViewModel(): UsePossessionViewModelResult {
  const [activePossessionId, setActivePossessionId] = useState<number | null>(null);
  const activePossessionIdRef = useRef<number | null>(null);
  const activeMatchIdRef = useRef<number | null>(null);

  const startPossession = useCallback((params: StartPossessionParams) => {
    activeMatchIdRef.current = params.matchId;
    possessionViewModel.startPossession(params).then((id) => {
      activePossessionIdRef.current = id;
      setActivePossessionId(id);
    });
  }, []);

  const endPossession = useCallback((params: EndParams) => {
    const possId = activePossessionIdRef.current;
    const mid = activeMatchIdRef.current;
    if (!possId || !mid) return;
    activePossessionIdRef.current = null;
    setActivePossessionId(null);
    void possessionViewModel.endPossession({
      matchId: mid,
      possessionId: possId,
      ...params,
    });
  }, []);

  return { activePossessionId, startPossession, endPossession };
}
