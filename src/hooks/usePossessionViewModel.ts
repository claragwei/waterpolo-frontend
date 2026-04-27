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
  // Ref so callbacks (setTimeout, async) always see the current id without stale closures
  const activePossessionIdRef = useRef<number | null>(null);

  const startPossession = useCallback((params: StartPossessionParams) => {
    possessionViewModel.startPossession(params).then((id) => {
      activePossessionIdRef.current = id;
      setActivePossessionId(id);
    });
  }, []);

  const endPossession = useCallback((params: EndParams) => {
    const possId = activePossessionIdRef.current;
    if (!possId) return;
    activePossessionIdRef.current = null;
    setActivePossessionId(null);
    possessionViewModel.endPossession({ possessionId: possId, ...params });
  }, []);

  return { activePossessionId, startPossession, endPossession };
}
