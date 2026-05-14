import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { usePossessionViewModel } from '../hooks/usePossessionViewModel';
import { toast } from 'sonner@2.0.3';

import type {
  PlayerStat,
  TeamStat,
  Play,
  HeatmapData,
  RefereeCall,
  HistoryState,
  PossessionEvent,
  ActiveEjection,
} from '../types';

import GameHeader from './GameHeader';
import PossessionTimer from './PossessionTimer';
import ActiveEjections from './ActiveEjections';
import TeamIndicatorBanner from './TeamIndicatorBanner';
import PlayerGrid from './PlayerGrid';
import StatActionPanel from './StatActionPanel';
import TeamSituations from './TeamSituations';
import RefereePanel from './RefereePanel';
import PossessionTimeline from './PossessionTimeline';
import StatsTable from './StatsTable';
import FilmReviewPanel from './FilmReviewPanel';
import PlayerEditModal from './PlayerEditModal';
import HeatmapModal from './HeatmapModal';
import RefereeCallModal from './RefereeCallModal';
import SubstitutionModal from './SubstitutionModal';
import ReplayRollbackPanel from './ReplayRollbackPanel';

// ---------------------------------------------------------------------------
// Initial rosters
// ---------------------------------------------------------------------------

const initialUcDavisPlayers: PlayerStat[] = [
  { playerId: 1,  playerName: 'Alex Martinez',   jerseyNumber: 1,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 2,  playerName: 'Jake Thompson',   jerseyNumber: 2,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 3,  playerName: 'Ryan Chen',       jerseyNumber: 3,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 4,  playerName: 'Marcus Wilson',   jerseyNumber: 4,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 5,  playerName: 'David Kim',       jerseyNumber: 5,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 6,  playerName: 'Brandon Lee',     jerseyNumber: 6,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 7,  playerName: 'Chris Anderson',  jerseyNumber: 7,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 8,  playerName: 'Tyler Johnson',   jerseyNumber: 8,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  { playerId: 9,  playerName: 'Noah Parker',     jerseyNumber: 9,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  { playerId: 10, playerName: 'Ethan Rodriguez', jerseyNumber: 10, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
];

const initialOpponentPlayers: PlayerStat[] = [
  { playerId: 101, playerName: 'Opponent #1',  jerseyNumber: 1,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 102, playerName: 'Opponent #2',  jerseyNumber: 2,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 103, playerName: 'Opponent #3',  jerseyNumber: 3,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 104, playerName: 'Opponent #4',  jerseyNumber: 4,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 105, playerName: 'Opponent #5',  jerseyNumber: 5,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 106, playerName: 'Opponent #6',  jerseyNumber: 6,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 107, playerName: 'Opponent #7',  jerseyNumber: 7,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true,  notes: [] },
  { playerId: 108, playerName: 'Opponent #8',  jerseyNumber: 8,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  { playerId: 109, playerName: 'Opponent #9',  jerseyNumber: 9,  shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  { playerId: 110, playerName: 'Opponent #10', jerseyNumber: 10, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
];

const QUARTER_DURATION_SECONDS = 8 * 60;
const SHOT_CLOCK_SECONDS = 30;

type ReplayEventType = 'goal' | 'exclusion' | 'penalty-foul' | 'timeout' | 'ejection' | 'referee-call';

interface ReplayEvent {
  id: string;
  type: ReplayEventType;
  gameTime: number;
  quarter: number;
  team?: 'ucDavis' | 'opponent';
  playerId?: number;
  playerName?: string;
  callType?: string;
  refereeCallId?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LiveStatsPage() {
  const navigate = useNavigate();
  // ---- Match / game state ----
  const [matchId, setMatchId] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [isInBreak, setIsInBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [shotClock, setShotClock] = useState<number | null>(null);
  const previousQuarterRef = useRef<number | null>(null);

  // ---- Player / team stats ----
  const [ucDavisPlayerStats, setUcDavisPlayerStats] = useState<PlayerStat[]>(initialUcDavisPlayers);
  const [opponentPlayerStats, setOpponentPlayerStats] = useState<PlayerStat[]>(initialOpponentPlayers);
  const [teamStats, setTeamStats] = useState<TeamStat>({
    FCO: 0, FCD: 0, CAO: 0, CAD: 0, AG: 0, AGD: 0,
    sixOnFive: 0, fiveOnSix: 0, sevenOnSix: 0, sixOnSeven: 0,
    possessionTimeUCDavis: 0, possessionTimeOpponent: 0,
  });

  // ---- Possession ----
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [currentPossession, setCurrentPossession] = useState<'ucDavis' | 'opponent' | null>(null);
  const [isPossessionActive, setIsPossessionActive] = useState(false);
  const [currentPossessionStart, setCurrentPossessionStart] = useState(0);
  const [possessionTimeline, setPossessionTimeline] = useState<PossessionEvent[]>([]);
  // activeStatsTeam: which team's stat panel is active (decoupled from possession timer)
  const [activeStatsTeam, setActiveStatsTeam] = useState<'ucDavis' | 'opponent'>('ucDavis');
  // opponent team DB id, resolved on game start
  const [oppTeamId, setOppTeamId] = useState<number | null>(null);
  const { startPossession: dbStartPossession, endPossession: dbEndPossession } = usePossessionViewModel();
  const possessionStartMsRef = useRef<number | null>(null);
  const possessionBaseSecondsRef = useRef<{ ucDavis: number; opponent: number }>({
    ucDavis: 0,
    opponent: 0,
  });

  // ---- Ejections ----
  const [activeEjections, setActiveEjections] = useState<ActiveEjection[]>([]);

  // ---- Heatmap ----
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({ ucDavis: [], opponent: [] });
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'shot' | 'goal' | 'assist';
    playerId: number;
    playerName: string;
    team: 'ucDavis' | 'opponent';
  } | null>(null);
  const [formation, setFormation] = useState<'4-2' | '3-3'>('4-2');

  // ---- Substitution modal ----
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTeam, setSubTeam] = useState<'ucDavis' | 'opponent' | null>(null);
  const [firstSelectedPlayer, setFirstSelectedPlayer] = useState<number | null>(null);
  const [secondSelectedPlayer, setSecondSelectedPlayer] = useState<number | null>(null);

  // ---- Player edit modal ----
  const [showPlayerEditModal, setShowPlayerEditModal] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState('Opponent');
  const [editingUcDavisPlayers, setEditingUcDavisPlayers] = useState<PlayerStat[]>([]);
  const [editingOpponentPlayers, setEditingOpponentPlayers] = useState<PlayerStat[]>([]);

  // ---- Referee ----
  const [refereeName, setRefereeName] = useState('');
  const [refereeCalls, setRefereeCalls] = useState<RefereeCall[]>([]);
  const [showRefereeCallModal, setShowRefereeCallModal] = useState(false);
  const [pendingRefereeCall, setPendingRefereeCall] = useState<RefereeCall['type'] | null>(null);
  const [refereeCallCounts, setRefereeCallCounts] = useState<Record<RefereeCall['type'], number>>({
    'yellow-card': 0, 'red-card': 0, ejection: 0,
    'minor-foul': 0, 'major-foul': 0, simulation: 0, 'offensive-foul': 0, 'defensive-foul': 0, brutality: 0, timeout: 0,
  });
  const [suspendedPlayerIds, setSuspendedPlayerIds] = useState<number[]>([]);
  const [noSubUntilGameTime, setNoSubUntilGameTime] = useState<{ ucDavis: number; opponent: number }>({
    ucDavis: 0,
    opponent: 0,
  });

  // ---- Notes ----
  const [currentNote, setCurrentNote] = useState('');
  const [activePanel, setActivePanel] = useState<'players' | 'match' | 'analytics'>('players');

  // ---- Plays ----
  const [plays, setPlays] = useState<Play[]>([]);
  const [replayEvents, setReplayEvents] = useState<ReplayEvent[]>([]);

  // ---- Undo/Redo ----
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const activePlayerStats = activeStatsTeam === 'opponent' ? opponentPlayerStats : ucDavisPlayerStats;
  const selectedPlayerExistsInActiveTeam =
    selectedPlayer !== null && activePlayerStats.some((p) => p.playerId === selectedPlayer);
  const activeTeamName = activeStatsTeam === 'opponent' ? opponentTeamName : 'UC Davis';
  const ucDavisScore = ucDavisPlayerStats.reduce((sum, p) => sum + p.goals, 0);
  const opponentScore = opponentPlayerStats.reduce((sum, p) => sum + p.goals, 0);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // History helpers
  // ---------------------------------------------------------------------------

  const saveToHistory = (
    newUcDavisStats: PlayerStat[],
    newOpponentStats: PlayerStat[],
    newTeamStats: TeamStat,
    newPlays: Play[],
    newQuarter: number,
    newHeatmapData: HeatmapData,
    newRefereeCalls: RefereeCall[],
  ) => {
    const newState: HistoryState = {
      ucDavisPlayerStats: JSON.parse(JSON.stringify(newUcDavisStats)),
      opponentPlayerStats: JSON.parse(JSON.stringify(newOpponentStats)),
      teamStats: JSON.parse(JSON.stringify(newTeamStats)),
      plays: JSON.parse(JSON.stringify(newPlays)),
      currentQuarter: newQuarter,
      heatmapData: JSON.parse(JSON.stringify(newHeatmapData)),
      refereeCalls: JSON.parse(JSON.stringify(newRefereeCalls)),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) {
      newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setUcDavisPlayerStats(JSON.parse(JSON.stringify(prev.ucDavisPlayerStats)));
      setOpponentPlayerStats(JSON.parse(JSON.stringify(prev.opponentPlayerStats)));
      setTeamStats(JSON.parse(JSON.stringify(prev.teamStats)));
      setPlays(JSON.parse(JSON.stringify(prev.plays)));
      setCurrentQuarter(prev.currentQuarter);
      setHeatmapData(JSON.parse(JSON.stringify(prev.heatmapData)));
      setRefereeCalls(JSON.parse(JSON.stringify(prev.refereeCalls)));
      const counts = {
        'yellow-card': 0, 'red-card': 0, ejection: 0,
        'minor-foul': 0, 'major-foul': 0, simulation: 0, 'offensive-foul': 0, 'defensive-foul': 0, brutality: 0, timeout: 0,
      } as Record<RefereeCall['type'], number>;
      prev.refereeCalls.forEach((c: RefereeCall) => counts[c.type]++);
      setRefereeCallCounts(counts);
      setHistoryIndex(historyIndex - 1);
      toast.info('Action undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setUcDavisPlayerStats(JSON.parse(JSON.stringify(next.ucDavisPlayerStats)));
      setOpponentPlayerStats(JSON.parse(JSON.stringify(next.opponentPlayerStats)));
      setTeamStats(JSON.parse(JSON.stringify(next.teamStats)));
      setPlays(JSON.parse(JSON.stringify(next.plays)));
      setCurrentQuarter(next.currentQuarter);
      setHeatmapData(JSON.parse(JSON.stringify(next.heatmapData)));
      setRefereeCalls(JSON.parse(JSON.stringify(next.refereeCalls)));
      const counts = {
        'yellow-card': 0, 'red-card': 0, ejection: 0,
        'minor-foul': 0, 'major-foul': 0, simulation: 0, 'offensive-foul': 0, 'defensive-foul': 0, brutality: 0, timeout: 0,
      } as Record<RefereeCall['type'], number>;
      next.refereeCalls.forEach((c: RefereeCall) => counts[c.type]++);
      setRefereeCallCounts(counts);
      setHistoryIndex(historyIndex + 1);
      toast.info('Action redone');
    }
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Init history
  useEffect(() => {
    if (history.length === 0) {
      const initial: HistoryState = {
        ucDavisPlayerStats: JSON.parse(JSON.stringify(ucDavisPlayerStats)),
        opponentPlayerStats: JSON.parse(JSON.stringify(opponentPlayerStats)),
        teamStats: JSON.parse(JSON.stringify(teamStats)),
        plays: JSON.parse(JSON.stringify(plays)),
        currentQuarter,
        heatmapData: JSON.parse(JSON.stringify(heatmapData)),
        refereeCalls: [],
      };
      setHistory([initial]);
      setHistoryIndex(0);
    }
  }, []);

  // Guard against stale selected player state causing an empty blocking overlay.
  useEffect(() => {
    if (selectedPlayer !== null && !selectedPlayerExistsInActiveTeam) {
      setSelectedPlayer(null);
    }
  }, [selectedPlayer, selectedPlayerExistsInActiveTeam]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Game clock
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive && !isPaused && !isInBreak) {
      interval = setInterval(() => setGameTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isGameActive, isPaused, isInBreak]);

  // Quarter end → break
  useEffect(() => {
    if (gameTime === QUARTER_DURATION_SECONDS && isGameActive && !isInBreak && currentQuarter < 4) {
      let breakDuration = 0;
      let breakMessage = '';
      if (currentQuarter === 1) { breakDuration = 120; breakMessage = 'Quarter 1 complete! 2-minute break before Quarter 2'; }
      else if (currentQuarter === 2) { breakDuration = 300; breakMessage = 'Halftime! 5-minute break before Quarter 3'; }
      else if (currentQuarter === 3) { breakDuration = 120; breakMessage = 'Quarter 3 complete! 2-minute break before Quarter 4'; }
      setIsInBreak(true);
      setBreakTimeRemaining(breakDuration);
      setIsPossessionActive(false);
      toast.info(breakMessage, { duration: 5000 });
    }
  }, [gameTime, isGameActive, isInBreak, currentQuarter]);

  // Q2 → Q3: prompt to open halftime report on Reports (not auto-PDF)
  useEffect(() => {
    if (previousQuarterRef.current === null) {
      previousQuarterRef.current = currentQuarter;
      return;
    }
    const prev = previousQuarterRef.current;
    if (prev === 2 && currentQuarter === 3) {
      const path =
        matchId != null ? `/reports?matchId=${matchId}&halftime=1` : '/reports?halftime=1';
      toast.message('Halftime — generate the Q1+Q2 report?', {
        description: 'Opens Reports with the halftime view for this match.',
        action: { label: 'Open Reports', onClick: () => navigate(path) },
        duration: 14_000,
      });
    }
    previousQuarterRef.current = currentQuarter;
  }, [currentQuarter, matchId, navigate]);

  // Break countdown
  useEffect(() => {
    let breakInterval: NodeJS.Timeout | null = null;
    if (isInBreak && breakTimeRemaining > 0) {
      breakInterval = setInterval(() => {
        setBreakTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsInBreak(false);
            setGameTime(0);
            const nextQ = currentQuarter + 1;
            setCurrentQuarter(nextQ);
            saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, nextQ, heatmapData, refereeCalls);
            toast.success(`Quarter ${nextQ} starting!`, { duration: 3000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (breakInterval) clearInterval(breakInterval); };
  }, [isInBreak, breakTimeRemaining, currentQuarter, ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, heatmapData, refereeCalls]);

  // Shot clock
  useEffect(() => {
    if (
      shotClock === null ||
      !isGameActive ||
      isPaused ||
      isInBreak ||
      !isPossessionActive ||
      !currentPossession
    ) {
      return;
    }
    const interval = setInterval(() => {
      setShotClock((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          const fromTeam = currentPossession;
          toast.warning('Shot clock violation - possession changes');
          setIsPossessionActive(false);
          setTimeout(() => switchPossession(fromTeam), 0);
          return SHOT_CLOCK_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shotClock, isGameActive, isPaused, isInBreak, isPossessionActive, currentPossession]);

  // Possession timer
  const captureCurrentPossessionSeconds = useCallback(() => {
    if (!currentPossession) return null;
    const base = possessionBaseSecondsRef.current[currentPossession];
    const elapsed = possessionStartMsRef.current === null
      ? 0
      : Math.floor((Date.now() - possessionStartMsRef.current) / 1000);
    const total = base + elapsed;
    possessionBaseSecondsRef.current[currentPossession] = total;
    possessionStartMsRef.current = null;
    return { team: currentPossession, seconds: total };
  }, [currentPossession]);

  const getPossessionSeconds = useCallback((team: 'ucDavis' | 'opponent') => {
    const base = possessionBaseSecondsRef.current[team];
    if (
      isPossessionActive &&
      currentPossession === team &&
      isGameActive &&
      !isPaused &&
      !isInBreak &&
      possessionStartMsRef.current !== null
    ) {
      return base + Math.floor((Date.now() - possessionStartMsRef.current) / 1000);
    }
    return base;
  }, [isPossessionActive, currentPossession, isGameActive, isPaused, isInBreak]);

  const startPossession = useCallback((team: 'ucDavis' | 'opponent', clearSelection: boolean = true) => {
    // Reset per-possession clock whenever a new possession starts.
    possessionBaseSecondsRef.current[team] = 0;
    possessionStartMsRef.current = Date.now();
    setCurrentPossession(team);
    // Track possession start using game clock time for timeline/event duration math.
    setCurrentPossessionStart(gameTime);
    setIsPossessionActive(true);
    const remainingInPeriod = Math.max(0, QUARTER_DURATION_SECONDS - gameTime);
    setShotClock(remainingInPeriod < SHOT_CLOCK_SECONDS ? null : SHOT_CLOCK_SECONDS);
    if (clearSelection) setSelectedPlayer(null);
  }, [gameTime]);

  const stopPossession = useCallback(() => {
    const captured = captureCurrentPossessionSeconds();
    if (captured) {
      const key = captured.team === 'ucDavis' ? 'possessionTimeUCDavis' : 'possessionTimeOpponent';
      setTeamStats((prev) => (prev[key] === captured.seconds ? prev : { ...prev, [key]: captured.seconds }));
    }
    setIsPossessionActive(false);
    setShotClock((prev) => (prev === null ? null : prev));
    setSelectedPlayer(null);
  }, [captureCurrentPossessionSeconds]);

  useEffect(() => {
    if (
      !isPossessionActive ||
      !currentPossession ||
      !isGameActive ||
      isPaused ||
      isInBreak
    ) {
      const captured = captureCurrentPossessionSeconds();
      if (captured) {
        const key = captured.team === 'ucDavis' ? 'possessionTimeUCDavis' : 'possessionTimeOpponent';
        setTeamStats((prev) => (prev[key] === captured.seconds ? prev : { ...prev, [key]: captured.seconds }));
      }
      return;
    }

    if (possessionStartMsRef.current === null) {
      possessionStartMsRef.current = Date.now();
    }

    const key = currentPossession === 'ucDavis' ? 'possessionTimeUCDavis' : 'possessionTimeOpponent';
    const interval = setInterval(() => {
      const liveSeconds = getPossessionSeconds(currentPossession);
      setTeamStats((prev) => (prev[key] === liveSeconds ? prev : { ...prev, [key]: liveSeconds }));
    }, 250);

    return () => clearInterval(interval);
  }, [
    isPossessionActive,
    currentPossession,
    isGameActive,
    isPaused,
    isInBreak,
    captureCurrentPossessionSeconds,
    getPossessionSeconds,
  ]);

  useEffect(() => {
    if (possessionStartMsRef.current !== null) return;
    possessionBaseSecondsRef.current.ucDavis = teamStats.possessionTimeUCDavis;
    possessionBaseSecondsRef.current.opponent = teamStats.possessionTimeOpponent;
  }, [teamStats.possessionTimeUCDavis, teamStats.possessionTimeOpponent]);

  // Ejection countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive && !isPaused && !isInBreak && activeEjections.length > 0) {
      interval = setInterval(() => {
        setActiveEjections((prev) => {
          const updated = prev.map((ej) => ({ ...ej, timeRemaining: Math.max(0, ej.timeRemaining - 1) }));
          updated.filter((ej) => ej.timeRemaining === 0).forEach((ej) => {
            toast.info(`${ej.playerName} ejection expired - can return to play`);
          });
          return updated.filter((ej) => ej.timeRemaining > 0);
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isGameActive, isPaused, isInBreak, activeEjections.length]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStartGame = async () => {
    try {
      // --- Opponent team ---
      let opponentTeamId: number;
      const existingTeams = await api.getTeams({ name: opponentTeamName });
      if (existingTeams.length > 0) {
        opponentTeamId = existingTeams[0].id;
      } else {
        const newTeam = await api.createTeam({
          name: opponentTeamName,
          short_name: opponentTeamName.slice(0, 10),
          is_uc_davis: false,
        });
        opponentTeamId = newTeam.id;
      }

      // --- UC Davis players: fetch existing, create any missing ---
      const existingUcd = await api.getPlayers({ team_id: 1 });
      const ucdByJersey = new Map(existingUcd.map((p) => [p.jersey_number, p]));
      const resolvedUcd = await Promise.all(
        initialUcDavisPlayers.map(async (p) => {
          const existing = ucdByJersey.get(p.jerseyNumber);
          if (existing) return { ...p, playerId: existing.id };
          const created = await api.createPlayer({ team_id: 1, name: p.playerName, jersey_number: p.jerseyNumber, is_active: p.isActive });
          return { ...p, playerId: created.id };
        }),
      );

      // --- Opponent players: always create fresh for this game ---
      const resolvedOpp = await Promise.all(
        initialOpponentPlayers.map(async (p) => {
          const created = await api.createPlayer({ team_id: opponentTeamId, name: p.playerName, jersey_number: p.jerseyNumber, is_active: p.isActive });
          return { ...p, playerId: created.id };
        }),
      );

      const match = await api.createMatch({
        uc_davis_team_id: 1,
        opponent_team_id: opponentTeamId,
        match_date: new Date().toISOString(),
        location: 'UC Davis Aquatic Center',
        status: 'in_progress',
      });

      setUcDavisPlayerStats(resolvedUcd);
      setOpponentPlayerStats(resolvedOpp);
      setMatchId(match.id);
      setOppTeamId(opponentTeamId);
      setIsGameActive(true);
      setIsPaused(false);
      toast.success('Game started! Go Aggies!');
    } catch (error) {
      console.error('Failed to create match:', error);
      setIsGameActive(true);
      setIsPaused(false);
      toast.error('Server unavailable — running in local mode');
    }
  };

  const handlePauseGame = () => {
    if (!isPaused && isPossessionActive && currentPossession) {
      // Possession ends when the game is paused
      const duration = Math.max(0, gameTime - currentPossessionStart);
      if (matchId) dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: null });
      setIsPossessionActive(false);
    }
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Game resumed' : 'Game paused');
  };

  const handleResetGame = () => {
    setIsGameActive(false);
    setIsPaused(false);
    setGameTime(0);
    setCurrentQuarter(1);
    setIsInBreak(false);
    setBreakTimeRemaining(0);
    setShotClock(null);
    setUcDavisPlayerStats(initialUcDavisPlayers);
    setOpponentPlayerStats(initialOpponentPlayers);
    setTeamStats({ FCO: 0, FCD: 0, CAO: 0, CAD: 0, AG: 0, AGD: 0, sixOnFive: 0, fiveOnSix: 0, sevenOnSix: 0, sixOnSeven: 0, possessionTimeUCDavis: 0, possessionTimeOpponent: 0 });
    possessionStartMsRef.current = null;
    possessionBaseSecondsRef.current = { ucDavis: 0, opponent: 0 };
    setPlays([]);
    setReplayEvents([]);
    setHistory([]);
    setHistoryIndex(-1);
    setHeatmapData({ ucDavis: [], opponent: [] });
    setSuspendedPlayerIds([]);
    setNoSubUntilGameTime({ ucDavis: 0, opponent: 0 });
    toast.success('Game stats reset');
  };

  const handleSaveGame = async () => {
    console.log('UC Davis Stats:', ucDavisPlayerStats);
    console.log('Opponent Stats:', opponentPlayerStats);
    console.log('Team Stats:', teamStats);
    if (!matchId) { toast.success('Game stats saved locally'); return; }
    try {
      await api.updateMatch(matchId, {
        uc_davis_score: ucDavisScore,
        opponent_score: opponentScore,
        current_quarter: currentQuarter,
        game_time: formatTime(gameTime),
        referee_name: refereeName || undefined,
      });
      toast.success('Game stats saved!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.success('Game stats saved locally');
    }
  };

  const handleEndGame = async () => {
    // Stop possession timer immediately to prevent drift during async ops
    if (isPossessionActive && currentPossession && matchId) {
      const duration = Math.max(0, gameTime - currentPossessionStart);
      dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Period End' });
    }
    setIsPossessionActive(false);
    if (!matchId) { handleResetGame(); return; }
    try {
      const allPlayers = [...ucDavisPlayerStats, ...opponentPlayerStats];
      await Promise.allSettled(
        allPlayers.map((p) =>
          api.upsertMatchStats(matchId, p.playerId, {
            shots: p.shots, goals: p.goals, assists: p.assists, steals: p.steals,
            blocks: p.blocks, turnovers: p.turnovers, exclusions: p.exclusions,
            penalties: p.penalties, rebounds: p.rebounds, tipped_passes: p.tippedPasses,
            sprints: p.sprints, hustle: p.hustle, draws: p.draws,
          }),
        ),
      );
      await api.updateMatch(matchId, {
        status: 'completed',
        uc_davis_score: ucDavisScore,
        opponent_score: opponentScore,
        current_quarter: currentQuarter,
        game_time: formatTime(gameTime),
        referee_name: refereeName || undefined,
      });
      toast.success(`Game over! UC Davis ${ucDavisScore} — ${opponentScore} ${opponentTeamName}`);
    } catch (error) {
      console.error('End game sync failed:', error);
      toast.error('Could not sync to server — stats saved locally');
    }
    handleResetGame();
  };

  const updatePlayerStat = async (
    playerId: number,
    stat: keyof PlayerStat,
    increment: number = 1,
  ) => {
    const team = activeStatsTeam;
    if (team === 'opponent') {
      const newStats = opponentPlayerStats.map((p) =>
        p.playerId === playerId
          ? { ...p, [stat]: Math.max(0, (p[stat as keyof PlayerStat] as number) + increment) }
          : p,
      );
      setOpponentPlayerStats(newStats);
      saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newStats = ucDavisPlayerStats.map((p) =>
        p.playerId === playerId
          ? { ...p, [stat]: Math.max(0, (p[stat as keyof PlayerStat] as number) + increment) }
          : p,
      );
      setUcDavisPlayerStats(newStats);
      saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    if (matchId) {
      try { await api.updateMatchStats(matchId, playerId, { [stat as string]: increment }); }
      catch (error) { console.error('Failed to sync player stat:', error); }
    }
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    if (player) toast.success(`${player.playerName} - ${stat as string} ${increment > 0 ? 'added' : 'removed'}`);
  };

  const updateTeamStat = async (stat: keyof TeamStat, increment: number = 1) => {
    const newTeamStats = { ...teamStats, [stat]: Math.max(0, teamStats[stat] + increment) };
    setTeamStats(newTeamStats);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, newTeamStats, plays, currentQuarter, heatmapData, refereeCalls);
    if (matchId) {
      try {
        await api.createPlay(matchId, { event_type: 'team_stat', stat_name: stat, value: increment, quarter: currentQuarter, game_time: gameTime });
      } catch (error) { console.error('Failed to sync team stat:', error); }
    }
    toast.success(`Team ${stat as string} ${increment > 0 ? 'incremented' : 'decremented'}`);
  };

  const updateQuarter = (newQuarter: number) => {
    setCurrentQuarter(newQuarter);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, newQuarter, heatmapData, refereeCalls);
  };

  const handleSkipBreak = () => {
    setIsInBreak(false);
    setBreakTimeRemaining(0);
    setGameTime(0);
    const nextQ = currentQuarter + 1;
    setCurrentQuarter(nextQ);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, nextQ, heatmapData, refereeCalls);
    toast.success(`Quarter ${nextQ} starting early!`, { duration: 3000 });
  };

  // Possession change helper — fromTeam is the team LOSING possession.
  const switchPossession = (fromTeam: 'ucDavis' | 'opponent', startReason: string | null = 'Turnover') => {
    stopPossession();
    const newPossession = fromTeam === 'ucDavis' ? 'opponent' : 'ucDavis';
    startPossession(newPossession);
    setActiveStatsTeam(newPossession);
    if (activeEjections.length > 0) {
      activeEjections.forEach((ej) => toast.info(`${ej.playerName} ejection ended (possession change)`));
      setActiveEjections([]);
    }
    if (matchId) {
      const newTeamId = newPossession === 'ucDavis' ? 1 : oppTeamId;
      if (newTeamId) {
        dbStartPossession({ matchId, teamId: newTeamId, quarter: currentQuarter, startTimeSeconds: gameTime, startReason });
      }
    }
    toast.info(`${newPossession === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession started`);
  };

  const handleTurnover = async (playerId: number) => {
    if (isPossessionActive) stopPossession();
    const team = activeStatsTeam;
    if (team === 'opponent') {
      const newStats = opponentPlayerStats.map((p) =>
        p.playerId === playerId ? { ...p, turnovers: p.turnovers + 1 } : p,
      );
      setOpponentPlayerStats(newStats);
      saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newStats = ucDavisPlayerStats.map((p) =>
        p.playerId === playerId ? { ...p, turnovers: p.turnovers + 1 } : p,
      );
      setUcDavisPlayerStats(newStats);
      saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    if (matchId) {
      try {
        await api.updateMatchStats(matchId, playerId, { turnovers: 1 });
        await api.createPlay(matchId, { player_id: playerId, quarter: currentQuarter, game_time: gameTime, event_type: 'turnover' });
      } catch (error) { console.error('Failed to sync turnover:', error); }
    }
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    if (player) toast.error(`${player.playerName} - Turnover`);
    const duration = Math.max(0, gameTime - currentPossessionStart);
    if (currentPossession && duration > 0) {
      setPossessionTimeline((prev) => [...prev, { id: Date.now().toString(), team: currentPossession, timestamp: currentPossessionStart, duration, event: 'Turnover' }]);
    }
    // End current possession row before switching
    if (matchId && currentPossession) {
      dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Turnover' });
    }
    // Turnover: possession goes to the OTHER team (away from the team that turned it over)
    setTimeout(() => switchPossession(activeStatsTeam, 'Turnover'), 500);
  };

  const handleSteal = async (playerId: number) => {
    if (isPossessionActive) stopPossession();
    const team = activeStatsTeam;
    if (team === 'opponent') {
      const newStats = opponentPlayerStats.map((p) =>
        p.playerId === playerId ? { ...p, steals: p.steals + 1 } : p,
      );
      setOpponentPlayerStats(newStats);
      saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newStats = ucDavisPlayerStats.map((p) =>
        p.playerId === playerId ? { ...p, steals: p.steals + 1 } : p,
      );
      setUcDavisPlayerStats(newStats);
      saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    if (matchId) {
      try {
        await api.updateMatchStats(matchId, playerId, { steals: 1 });
        await api.createPlay(matchId, { player_id: playerId, quarter: currentQuarter, game_time: gameTime, event_type: 'steal' });
      } catch (error) { console.error('Failed to sync steal:', error); }
    }
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    if (player) toast.success(`${player.playerName} - Steal!`);
    const duration = Math.max(0, gameTime - currentPossessionStart);
    if (currentPossession && duration > 0) {
      setPossessionTimeline((prev) => [...prev, { id: Date.now().toString(), team: currentPossession, timestamp: currentPossessionStart, duration, event: 'Steal' }]);
    }
    // End current possession row before switching
    if (matchId && currentPossession) {
      dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Steal' });
    }
    // Steal: possession goes TO the stealing team (activeStatsTeam)
    // switchPossession takes fromTeam (the team losing possession), so pass the opposite of activeStatsTeam
    setTimeout(() => switchPossession(activeStatsTeam === 'ucDavis' ? 'opponent' : 'ucDavis', 'Steal'), 500);
  };

  const handleShotClick = (playerId: number) => {
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    const team = activeStatsTeam;
    if (player) { setPendingAction({ type: 'shot', playerId, playerName: player.playerName, team }); setShowHeatmapModal(true); }
  };

  const handleGoalClick = (playerId: number) => {
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    const team = activeStatsTeam;
    if (player) { setPendingAction({ type: 'goal', playerId, playerName: player.playerName, team }); setShowHeatmapModal(true); }
  };

  const handleAssistClick = (playerId: number) => {
    const player = activePlayerStats.find((p) => p.playerId === playerId);
    const team = activeStatsTeam;
    if (player) { setPendingAction({ type: 'assist', playerId, playerName: player.playerName, team }); setShowHeatmapModal(true); }
  };

  const handlePinDrop = async (x: number, y: number) => {
    if (!pendingAction) return;
    const { type, playerId, playerName, team } = pendingAction;
    const newHeatmapData = { ...heatmapData };
    newHeatmapData[team] = [...newHeatmapData[team], { x, y, type, formation }];

    if (matchId) {
      try {
        const statUpdate: Record<string, number> = {};
        if (type === 'goal') { statUpdate.goals = 1; statUpdate.shots = 1; }
        else if (type === 'shot') { statUpdate.shots = 1; }
        else if (type === 'assist') { statUpdate.assists = 1; }
        await api.updateMatchStats(matchId, playerId, statUpdate);
        await api.createPlay(matchId, { player_id: playerId, quarter: currentQuarter, game_time: gameTime, event_type: type, x_coordinate: x, y_coordinate: y, formation });
      } catch (error) { console.error(`Failed to sync ${type}:`, error); }
    }

    if (type === 'shot') {
      if (team === 'opponent') {
        const newStats = opponentPlayerStats.map((p) => p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p);
        setOpponentPlayerStats(newStats);
        saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newStats = ucDavisPlayerStats.map((p) => p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p);
        setUcDavisPlayerStats(newStats);
        saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - Shot recorded (${formation})`);
      setShotClock(SHOT_CLOCK_SECONDS);
    } else if (type === 'goal') {
      if (team === 'opponent') {
        const newStats = opponentPlayerStats.map((p) => p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p);
        setOpponentPlayerStats(newStats);
        saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newStats = ucDavisPlayerStats.map((p) => p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p);
        setUcDavisPlayerStats(newStats);
        saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - GOAL! (${formation})`);
      setReplayEvents((prev) => [
        ...prev,
        {
          id: `${Date.now()}-goal-${playerId}`,
          type: 'goal',
          gameTime,
          quarter: currentQuarter,
          team,
          playerId,
          playerName,
        },
      ]);
      if (activeEjections.length > 0) {
        activeEjections.forEach((ej) => toast.info(`${ej.playerName} ejection ended (goal scored)`));
        setActiveEjections([]);
      }
      const duration = Math.max(0, gameTime - currentPossessionStart);
      if (duration > 0) {
        setPossessionTimeline((prev) => [...prev, { id: Date.now().toString(), team, timestamp: currentPossessionStart, duration, event: 'Goal' }]);
      }
      if (isPossessionActive) stopPossession();
      if (matchId && currentPossession) {
        dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Goal' });
      }
      const nextTeam = team === 'ucDavis' ? 'opponent' : 'ucDavis';
      setCurrentPossession(nextTeam);
      setActiveStatsTeam(nextTeam);
      setIsPossessionActive(false);
      setShotClock(null);
      toast.info('Possession switched after goal. Start shot clock manually when play resumes.');
    } else if (type === 'assist') {
      if (team === 'opponent') {
        const newStats = opponentPlayerStats.map((p) => p.playerId === playerId ? { ...p, assists: p.assists + 1 } : p);
        setOpponentPlayerStats(newStats);
        saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newStats = ucDavisPlayerStats.map((p) => p.playerId === playerId ? { ...p, assists: p.assists + 1 } : p);
        setUcDavisPlayerStats(newStats);
        saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - Assist! (${formation})`);
    }

    setHeatmapData(newHeatmapData);
    setShowHeatmapModal(false);
    setPendingAction(null);
  };

  const handleAddNote = async () => {
    if (!selectedPlayer || !currentNote.trim()) { toast.error('Please enter a note'); return; }
    const timestamp = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(gameTime % 60).padStart(2, '0')} Q${currentQuarter}`;
    const noteWithTimestamp = `[${timestamp}] ${currentNote.trim()}`;
    if (activeStatsTeam === 'opponent') {
      const newStats = opponentPlayerStats.map((p) =>
        p.playerId === selectedPlayer ? { ...p, notes: [...(p.notes || []), noteWithTimestamp] } : p,
      );
      setOpponentPlayerStats(newStats);
      saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newStats = ucDavisPlayerStats.map((p) =>
        p.playerId === selectedPlayer ? { ...p, notes: [...(p.notes || []), noteWithTimestamp] } : p,
      );
      setUcDavisPlayerStats(newStats);
      saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    if (matchId) {
      try {
        await api.createNote(matchId, { player_id: selectedPlayer, note: noteWithTimestamp, quarter: currentQuarter, game_time: gameTime });
      } catch (error) { console.error('Failed to sync note:', error); }
    }
    setCurrentNote('');
    toast.success('Note added');
  };

  const rebuildRefereeCounts = (calls: RefereeCall[]) => {
    const counts = {
      'yellow-card': 0,
      'red-card': 0,
      ejection: 0,
      'minor-foul': 0,
      'major-foul': 0,
      simulation: 0,
      'offensive-foul': 0,
      'defensive-foul': 0,
      brutality: 0,
      timeout: 0,
    } as Record<RefereeCall['type'], number>;
    calls.forEach((c) => {
      counts[c.type] += 1;
    });
    return counts;
  };

  const handleReplayRollback = (eventIds: string[]) => {
    const selectedIds = new Set(eventIds);
    const toRollback = replayEvents.filter((ev) => selectedIds.has(ev.id));
    if (toRollback.length === 0) {
      toast.info('No events selected for correction');
      return;
    }

    const rollbackIds = new Set(toRollback.map((ev) => ev.id));
    const nextReplayEvents = replayEvents.filter((ev) => !rollbackIds.has(ev.id));

    const rollbackRefCallIds = new Set(
      toRollback
        .map((ev) => ev.refereeCallId)
        .filter((id): id is string => Boolean(id)),
    );

    const nextRefCalls = refereeCalls.filter((call) => !rollbackRefCallIds.has(call.id));
    setRefereeCalls(nextRefCalls);
    setRefereeCallCounts(rebuildRefereeCounts(nextRefCalls));

    let nextUc = [...ucDavisPlayerStats];
    let nextOpp = [...opponentPlayerStats];

    toRollback.forEach((ev) => {
      if (!ev.playerId) return;
      if (ev.type === 'goal') {
        if (ev.team === 'ucDavis') {
          nextUc = nextUc.map((p) =>
            p.playerId === ev.playerId
              ? { ...p, goals: Math.max(0, p.goals - 1), shots: Math.max(0, p.shots - 1) }
              : p,
          );
        } else if (ev.team === 'opponent') {
          nextOpp = nextOpp.map((p) =>
            p.playerId === ev.playerId
              ? { ...p, goals: Math.max(0, p.goals - 1), shots: Math.max(0, p.shots - 1) }
              : p,
          );
        }
      }
      if (ev.type === 'exclusion' || ev.type === 'ejection') {
        if (ev.team === 'ucDavis') {
          nextUc = nextUc.map((p) =>
            p.playerId === ev.playerId
              ? {
                  ...p,
                  exclusions: Math.max(0, p.exclusions - 1),
                  majorFouls: Math.max(0, (p.majorFouls ?? 0) - 1),
                }
              : p,
          );
        } else if (ev.team === 'opponent') {
          nextOpp = nextOpp.map((p) =>
            p.playerId === ev.playerId
              ? {
                  ...p,
                  exclusions: Math.max(0, p.exclusions - 1),
                  majorFouls: Math.max(0, (p.majorFouls ?? 0) - 1),
                }
              : p,
          );
        }
      }
    });

    setUcDavisPlayerStats(nextUc);
    setOpponentPlayerStats(nextOpp);
    setReplayEvents(nextReplayEvents);
    setSuspendedPlayerIds((prev) => prev.filter((id) => !toRollback.some((ev) => ev.playerId === id)));
    setActiveEjections((prev) => prev.filter((ej) => !toRollback.some((ev) => ev.playerId === ej.playerId)));

    saveToHistory(nextUc, nextOpp, teamStats, plays, currentQuarter, heatmapData, nextRefCalls);
    toast.success(`Correction applied: removed ${toRollback.length} event(s)`);
  };

  const handleRefereeCall = (callType: RefereeCall['type']) => {
    setIsPaused(true);
    stopPossession();
    setPendingRefereeCall(callType);
    setShowRefereeCallModal(true);
  };

  const addRefereeCall = async (
    playerName?: string,
    team?: 'ucDavis' | 'opponent',
    playerId?: number,
  ) => {
    if (!pendingRefereeCall) return;
    const timestamp = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(gameTime % 60).padStart(2, '0')}`;
    const newCall: RefereeCall = {
      id: Date.now().toString(),
      type: pendingRefereeCall,
      playerName,
      playerId,
      team,
      timestamp,
      gameTime,
      quarter: currentQuarter,
    };
    const newRefereeCalls = [...refereeCalls, newCall];
    setRefereeCalls(newRefereeCalls);
    const replayEventsToAdd: ReplayEvent[] = [];

    if (matchId) {
      try {
        const playerStats = team === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats;
        const matchedPlayer = playerName ? playerStats.find((p) => p.playerName === playerName) : undefined;
        await api.createRefereeCall(matchId, {
          call_type: pendingRefereeCall,
          player_id: playerId ?? matchedPlayer?.playerId,
          player_name: playerName, team, quarter: currentQuarter, game_time: gameTime,
        });
      } catch (error) { console.error('Failed to sync referee call:', error); }
    }

    setRefereeCallCounts((prev) => ({ ...prev, [pendingRefereeCall]: prev[pendingRefereeCall] + 1 }));
    const offendingTeam = team;
    const offenderId = playerId;

    let nextUcDavis = ucDavisPlayerStats;
    let nextOpponent = opponentPlayerStats;

    const applyMajorFoulToRoster = (teamSide: 'ucDavis' | 'opponent', id: number) => {
      const updater = (player: PlayerStat) => {
        if (player.playerId !== id) return player;
        const updatedMajorFouls = (player.majorFouls ?? 0) + 1;
        return {
          ...player,
          majorFouls: updatedMajorFouls,
          exclusions: player.exclusions + 1,
          isActive: updatedMajorFouls >= 3 ? false : player.isActive,
        };
      };
      if (teamSide === 'ucDavis') {
        nextUcDavis = nextUcDavis.map(updater);
      } else {
        nextOpponent = nextOpponent.map(updater);
      }
    };

    if (offendingTeam && offenderId && ['major-foul', 'ejection', 'brutality'].includes(pendingRefereeCall)) {
      applyMajorFoulToRoster(offendingTeam, offenderId);
    }

    if (pendingRefereeCall !== 'ejection') {
      replayEventsToAdd.push({
        id: `${newCall.id}-ref`,
        type: 'referee-call',
        gameTime,
        quarter: currentQuarter,
        team,
        playerId,
        playerName,
        callType: pendingRefereeCall,
        refereeCallId: newCall.id,
      });
    }

    if (pendingRefereeCall === 'ejection' && playerName && offendingTeam && offenderId) {
      replayEventsToAdd.push({
        id: `${newCall.id}-exclusion`,
        type: 'ejection',
        gameTime,
        quarter: currentQuarter,
        team: offendingTeam,
        playerId: offenderId,
        playerName,
        refereeCallId: newCall.id,
      });
      setActiveEjections((prev) => [...prev, { playerId: offenderId, playerName, team: offendingTeam, timeRemaining: 20, startTime: gameTime }]);
      toast.warning(`${playerName} ejected for 20 seconds (or until goal/possession change)`);
    }

    if (pendingRefereeCall === 'major-foul' && playerName && offendingTeam && offenderId) {
      replayEventsToAdd.push({
        id: `${newCall.id}-major`,
        type: 'exclusion',
        gameTime,
        quarter: currentQuarter,
        team: offendingTeam,
        playerId: offenderId,
        playerName,
        refereeCallId: newCall.id,
      });
      const updated = (offendingTeam === 'ucDavis' ? nextUcDavis : nextOpponent).find((p) => p.playerId === offenderId);
      if (updated && (updated.majorFouls ?? 0) >= 3) {
        setSuspendedPlayerIds((prev) => (prev.includes(offenderId) ? prev : [...prev, offenderId]));
        toast.error(`${playerName} has 3 major fouls and is out for the remainder of the game`);
      } else {
        setActiveEjections((prev) => [...prev, { playerId: offenderId, playerName, team: offendingTeam, timeRemaining: 20, startTime: gameTime }]);
        toast.warning(`${playerName} major foul recorded (exclusion +1)`);
      }
    }

    if (pendingRefereeCall === 'brutality' && playerName && offendingTeam && offenderId) {
      replayEventsToAdd.push({
        id: `${newCall.id}-brutality`,
        type: 'exclusion',
        gameTime,
        quarter: currentQuarter,
        team: offendingTeam,
        playerId: offenderId,
        playerName,
        refereeCallId: newCall.id,
      });
      setSuspendedPlayerIds((prev) => (prev.includes(offenderId) ? prev : [...prev, offenderId]));
      setNoSubUntilGameTime((prev) => ({
        ...prev,
        [offendingTeam]: Math.max(prev[offendingTeam], gameTime + 240),
      }));
      if (offendingTeam === 'ucDavis') {
        nextUcDavis = nextUcDavis.map((p) => (p.playerId === offenderId ? { ...p, isActive: false } : p));
      } else {
        nextOpponent = nextOpponent.map((p) => (p.playerId === offenderId ? { ...p, isActive: false } : p));
      }
      const offendedTeam = offendingTeam === 'ucDavis' ? 'opponent' : 'ucDavis';
      setCurrentPossession(offendedTeam);
      setSelectedPlayer(null);
      toast.error('Brutality: player removed; no substitute allowed for 4:00 game time; penalty throw awarded');
    }

    if (pendingRefereeCall === 'minor-foul') {
      toast.info('Minor foul recorded (free throw, direct shot allowed outside 5m)');
    }

    if (pendingRefereeCall === 'simulation') {
      if (offendingTeam && currentPossession) {
        if (offendingTeam === currentPossession) {
          const newPossession = offendingTeam === 'ucDavis' ? 'opponent' : 'ucDavis';
          setCurrentPossession(newPossession);
          setShotClock(Math.max(0, QUARTER_DURATION_SECONDS - gameTime) < SHOT_CLOCK_SECONDS ? null : SHOT_CLOCK_SECONDS);
          toast.warning('Simulation by team in possession: turnover awarded to opponent');
        } else {
          setShotClock(Math.max(0, QUARTER_DURATION_SECONDS - gameTime) < SHOT_CLOCK_SECONDS ? null : SHOT_CLOCK_SECONDS);
          toast.warning('Simulation by defending team: shot clock reset, possession retained');
        }
      } else {
        toast.info('Simulation recorded');
      }
    }

    if (pendingRefereeCall === 'timeout') {
      replayEventsToAdd.push({
        id: `${newCall.id}-timeout`,
        type: 'timeout',
        gameTime,
        quarter: currentQuarter,
        team,
        playerName,
        refereeCallId: newCall.id,
      });
    }

    if (nextUcDavis !== ucDavisPlayerStats) setUcDavisPlayerStats(nextUcDavis);
    if (nextOpponent !== opponentPlayerStats) setOpponentPlayerStats(nextOpponent);
    if (replayEventsToAdd.length > 0) {
      setReplayEvents((prev) => [...prev, ...replayEventsToAdd]);
    }

    saveToHistory(nextUcDavis, nextOpponent, teamStats, plays, currentQuarter, heatmapData, newRefereeCalls);

    const callLabel = pendingRefereeCall.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!['ejection', 'major-foul', 'brutality', 'minor-foul'].includes(pendingRefereeCall)) {
      toast.success(`${callLabel} recorded${playerName ? ` - ${playerName}` : ''}`);
    }
    setShowRefereeCallModal(false);
    setPendingRefereeCall(null);
  };

  const handleSubstitution = async () => {
    if (!firstSelectedPlayer || !secondSelectedPlayer || !subTeam) { toast.error('Please select two players to swap'); return; }
    if (gameTime < noSubUntilGameTime[subTeam]) {
      const remaining = noSubUntilGameTime[subTeam] - gameTime;
      toast.error(`No substitutions allowed for this team for ${formatTime(remaining)} due to brutality`);
      return;
    }
    if (suspendedPlayerIds.includes(firstSelectedPlayer) || suspendedPlayerIds.includes(secondSelectedPlayer)) {
      toast.error('Suspended players cannot be substituted back in');
      return;
    }
    const playerStats = subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats;
    const player1 = playerStats.find((p) => p.playerId === firstSelectedPlayer);
    const player2 = playerStats.find((p) => p.playerId === secondSelectedPlayer);
    if (!player1 || !player2) { toast.error('Invalid player selection'); return; }
    const newStats = playerStats.map((player) => {
      if (player.playerId === firstSelectedPlayer) return { ...player, isActive: player2.isActive };
      if (player.playerId === secondSelectedPlayer) return { ...player, isActive: player1.isActive };
      return player;
    });
    if (subTeam === 'ucDavis') {
      setUcDavisPlayerStats(newStats);
      saveToHistory(newStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      setOpponentPlayerStats(newStats);
      saveToHistory(ucDavisPlayerStats, newStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    if (matchId) {
      try {
        await api.createPlay(matchId, { event_type: 'substitution', player_in_id: secondSelectedPlayer, player_out_id: firstSelectedPlayer, team: subTeam, quarter: currentQuarter, game_time: gameTime });
      } catch (error) { console.error('Failed to sync substitution:', error); }
    }
    toast.success(`Swapped: ${player1.playerName} ↔ ${player2.playerName}`);
    setShowSubModal(false);
    setFirstSelectedPlayer(null);
    setSecondSelectedPlayer(null);
    setSubTeam(null);
  };

  const handleSelectPlayer = (playerId: number, team: 'ucDavis' | 'opponent') => {
    if (isPossessionActive && currentPossession && currentPossession !== team) {
      stopPossession();
      startPossession(team, false);
      toast.info(`${team === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession selected`);
    } else if (!isPossessionActive) {
      setCurrentPossession(team);
    }
    setSelectedPlayer(playerId);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 bg-[#F5F7FA] min-h-screen">
      <GameHeader
        isGameActive={isGameActive}
        isPaused={isPaused}
        isInBreak={isInBreak}
        gameTime={gameTime}
        breakTimeRemaining={breakTimeRemaining}
        quarterDurationSeconds={QUARTER_DURATION_SECONDS}
        shotClockSeconds={shotClock}
        currentQuarter={currentQuarter}
        canUndo={canUndo}
        canRedo={canRedo}
        ucDavisScore={ucDavisScore}
        opponentScore={opponentScore}
        opponentTeamName={opponentTeamName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onSaveGame={handleSaveGame}
        onEndGame={handleEndGame}
        onResetGame={handleResetGame}
        onEditPlayers={() => {
          setEditingUcDavisPlayers(JSON.parse(JSON.stringify(ucDavisPlayerStats)));
          setEditingOpponentPlayers(JSON.parse(JSON.stringify(opponentPlayerStats)));
          setShowPlayerEditModal(true);
        }}
        onQuarterChange={updateQuarter}
        onSkipBreak={handleSkipBreak}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <PossessionTimer
            possessionTimeUCDavis={teamStats.possessionTimeUCDavis}
            possessionTimeOpponent={teamStats.possessionTimeOpponent}
            currentPossession={currentPossession}
            isPossessionActive={isPossessionActive}
            isGameActive={isGameActive}
            isPaused={isPaused}
            isInBreak={isInBreak}
            onSetPossession={(team) => {
              if (team === null) {
                // Manual stop — end possession record
                if (isPossessionActive && currentPossession && matchId) {
                  const duration = Math.max(0, gameTime - currentPossessionStart);
                  dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Turnover' });
                }
                stopPossession();
                setCurrentPossession(null);
              } else {
                // Manual start — end any running possession first, then start new one
                if (isPossessionActive && currentPossession && matchId) {
                  const duration = Math.max(0, gameTime - currentPossessionStart);
                  dbEndPossession({ endTimeSeconds: gameTime, durationSeconds: duration, endReason: 'Turnover' });
                }
                setActiveStatsTeam(team);
                startPossession(team);
                if (matchId) {
                  const teamId = team === 'ucDavis' ? 1 : oppTeamId;
                  if (teamId) {
                    dbStartPossession({ matchId, teamId, quarter: currentQuarter, startTimeSeconds: gameTime, startReason: 'Sprint' });
                  }
                }
              }
            }}
          />

          <ActiveEjections activeEjections={activeEjections} />

          {(noSubUntilGameTime.ucDavis > gameTime || noSubUntilGameTime.opponent > gameTime) && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {noSubUntilGameTime.ucDavis > gameTime && (
                <div>UC Davis no-sub timer: {formatTime(noSubUntilGameTime.ucDavis - gameTime)} remaining</div>
              )}
              {noSubUntilGameTime.opponent > gameTime && (
                <div>Opponent no-sub timer: {formatTime(noSubUntilGameTime.opponent - gameTime)} remaining</div>
              )}
            </div>
          )}

          {currentPossession && (
            <TeamIndicatorBanner currentPossession={currentPossession} activeTeamName={activeTeamName} />
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePanel('players')}
                className={`rounded-md px-3 py-2 text-sm ${
                  activePanel === 'players'
                    ? 'bg-[#022851] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Players
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('match')}
                className={`rounded-md px-3 py-2 text-sm ${
                  activePanel === 'match'
                    ? 'bg-[#022851] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Game Management
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('analytics')}
                className={`rounded-md px-3 py-2 text-sm ${
                  activePanel === 'analytics'
                    ? 'bg-[#022851] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          {activePanel === 'players' && (
            <PlayerGrid
              ucDavisPlayerStats={ucDavisPlayerStats}
              opponentPlayerStats={opponentPlayerStats}
              selectedPlayer={selectedPlayer}
              currentPossession={currentPossession}
              isPossessionActive={isPossessionActive}
              activeEjections={activeEjections}
              suspendedPlayerIds={suspendedPlayerIds}
              onSelectPlayer={(playerId, team) => {
                handleSelectPlayer(playerId, team);
                setActiveStatsTeam(team);
              }}
              onOpenSubModal={(team) => {
                setSubTeam(team);
                setShowSubModal(true);
              }}
            />
          )}

          {activePanel === 'match' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <TeamSituations teamStats={teamStats} onUpdateTeamStat={updateTeamStat} />
              <RefereePanel
                refereeName={refereeName}
                refereeCallCounts={refereeCallCounts}
                refereeCalls={refereeCalls}
                onRefereeNameChange={setRefereeName}
                onRefereeCall={handleRefereeCall}
              />
              <ReplayRollbackPanel
                replayEvents={replayEvents}
                onApplyRollback={handleReplayRollback}
              />
            </div>
          )}

          {activePanel === 'analytics' && (
            <>
              <FilmReviewPanel
                replayEvents={replayEvents}
                quarterDurationSeconds={QUARTER_DURATION_SECONDS}
                matchId={matchId}
                currentQuarter={currentQuarter}
              />

              <PossessionTimeline possessionTimeline={possessionTimeline} />

              <StatsTable
                ucDavisPlayerStats={ucDavisPlayerStats}
                opponentPlayerStats={opponentPlayerStats}
              />
            </>
          )}
        </div>
      </div>

        {selectedPlayer !== null && selectedPlayerExistsInActiveTeam && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-4 md:items-center">
            <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl">
              <StatActionPanel
                selectedPlayer={selectedPlayer}
                currentPossession={activeStatsTeam}
                isOnOffense={
                  isPossessionActive && currentPossession !== null
                    ? activeStatsTeam === currentPossession
                    : undefined
                }
                activePlayerStats={activePlayerStats}
                gameTime={gameTime}
                currentQuarter={currentQuarter}
                currentNote={currentNote}
                onCurrentNoteChange={setCurrentNote}
                onShotClick={handleShotClick}
                onGoalClick={handleGoalClick}
                onAssistClick={handleAssistClick}
                onTurnover={handleTurnover}
                onSteal={handleSteal}
                onUpdateStat={updatePlayerStat}
                onAddNote={handleAddNote}
                onClose={() => setSelectedPlayer(null)}
              />
            </div>
          </div>
        )}

      {/* Modals */}
      <PlayerEditModal
        isOpen={showPlayerEditModal}
        editingUcDavisPlayers={editingUcDavisPlayers}
        editingOpponentPlayers={editingOpponentPlayers}
        opponentTeamName={opponentTeamName}
        onUcDavisPlayersChange={setEditingUcDavisPlayers}
        onOpponentPlayersChange={setEditingOpponentPlayers}
        onOpponentTeamNameChange={setOpponentTeamName}
        onSave={() => {
          setUcDavisPlayerStats(editingUcDavisPlayers);
          setOpponentPlayerStats(editingOpponentPlayers);
          setShowPlayerEditModal(false);
          toast.success('Player rosters updated!');
        }}
        onClose={() => setShowPlayerEditModal(false)}
      />

      <HeatmapModal
        isOpen={showHeatmapModal}
        pendingAction={pendingAction}
        heatmapData={heatmapData}
        formation={formation}
        onFormationChange={setFormation}
        onPinDrop={handlePinDrop}
        onClose={() => { setShowHeatmapModal(false); setPendingAction(null); }}
      />

      <RefereeCallModal
        isOpen={showRefereeCallModal}
        pendingRefereeCall={pendingRefereeCall}
        ucDavisPlayerStats={ucDavisPlayerStats}
        opponentPlayerStats={opponentPlayerStats}
        onConfirm={addRefereeCall}
        onClose={() => { setShowRefereeCallModal(false); setPendingRefereeCall(null); }}
      />

      <SubstitutionModal
        isOpen={showSubModal}
        subTeam={subTeam}
        ucDavisPlayerStats={ucDavisPlayerStats}
        opponentPlayerStats={opponentPlayerStats}
        opponentTeamName={opponentTeamName}
        firstSelectedPlayer={firstSelectedPlayer}
        secondSelectedPlayer={secondSelectedPlayer}
        onFirstPlayerSelect={setFirstSelectedPlayer}
        onSecondPlayerSelect={setSecondSelectedPlayer}
        onConfirm={handleSubstitution}
        onClose={() => {
          setShowSubModal(false);
          setFirstSelectedPlayer(null);
          setSecondSelectedPlayer(null);
          setSubTeam(null);
        }}
      />
    </div>
  );
}
