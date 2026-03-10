import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Plus, 
  Minus,
  Target,
  XCircle,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  ArrowRight,
  Activity,
  Clock,
  Undo,
  Redo,
  X,
  Users,
  ArrowLeftRight,
  FileText
} from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface PlayerStat {
  playerId: number;
  playerName: string;
  jerseyNumber: number;
  shots: number;
  goals: number;
  penalties: number;
  turnovers: number;
  rebounds: number;
  assists: number;
  blocks: number;
  tippedPasses: number;
  sprints: number;
  steals: number;
  hustle: number;
  exclusions: number;
  draws: number;
  isActive: boolean;
  notes?: string[];
}

interface TeamStat {
  FCO: number;
  FCD: number;
  CAO: number;
  CAD: number;
  AG: number;
  AGD: number;
  sixOnFive: number;
  fiveOnSix: number;
  sevenOnSix: number;
  sixOnSeven: number;
  possessionTimeUCDavis: number;
  possessionTimeOpponent: number;
}

interface Play {
  id: string;
  name: string;
  timestamp: string;
  success: boolean;
  team: 'ucDavis' | 'opponent';
}

interface HeatmapData {
  ucDavis: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
  opponent: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
}

interface RefereeCall {
  id: string;
  type: 'yellow-card' | 'red-card' | 'ejection' | 'offensive-foul' | 'defensive-foul' | 'brutality' | 'timeout';
  playerName?: string;
  team?: 'ucDavis' | 'opponent';
  timestamp: string;
  gameTime: number;
  quarter: number;
}

interface HistoryState {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  teamStats: TeamStat;
  plays: Play[];
  currentQuarter: number;
  heatmapData: HeatmapData;
  refereeCalls: RefereeCall[];
}

interface PossessionEvent {
  id: string;
  team: 'ucDavis' | 'opponent';
  timestamp: number;
  duration: number;
  event: string;
}

export default function LiveStatsPage() {
  const [matchId, setMatchId] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [plays, setPlays] = useState<Play[]>([]);
  const [isPossessionActive, setIsPossessionActive] = useState(false);
  const [currentPossessionStart, setCurrentPossessionStart] = useState(0);
  const [currentPossession, setCurrentPossession] = useState<'ucDavis' | 'opponent' | null>(null);
  
  // Break state
  const [isInBreak, setIsInBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  
  // Undo/Redo state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    ucDavis: [],
    opponent: []
  });
  
  // Heatmap modal state
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'shot' | 'goal' | 'assist', playerId: number, playerName: string, team: 'ucDavis' | 'opponent' } | null>(null);
  const [formation, setFormation] = useState<'4-2' | '3-3'>('4-2');
  
  // Substitution modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTeam, setSubTeam] = useState<'ucDavis' | 'opponent' | null>(null);
  const [firstSelectedPlayer, setFirstSelectedPlayer] = useState<number | null>(null);
  const [secondSelectedPlayer, setSecondSelectedPlayer] = useState<number | null>(null);
  
  // Player editing modal state
  const [showPlayerEditModal, setShowPlayerEditModal] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState('Opponent');
  const [editingUcDavisPlayers, setEditingUcDavisPlayers] = useState<PlayerStat[]>([]);
  const [editingOpponentPlayers, setEditingOpponentPlayers] = useState<PlayerStat[]>([]);
  
  // Possession timeline state
  const [possessionTimeline, setPossessionTimeline] = useState<PossessionEvent[]>([]);
  
  // Referee state
  const [refereeName, setRefereeName] = useState('');
  const [refereeCalls, setRefereeCalls] = useState<RefereeCall[]>([]);
  const [showRefereeCallModal, setShowRefereeCallModal] = useState(false);
  const [pendingRefereeCall, setPendingRefereeCall] = useState<'yellow-card' | 'red-card' | 'ejection' | 'offensive-foul' | 'defensive-foul' | 'brutality' | 'timeout' | null>(null);
  const [refereeCallCounts, setRefereeCallCounts] = useState({
    'yellow-card': 0,
    'red-card': 0,
    'ejection': 0,
    'offensive-foul': 0,
    'defensive-foul': 0,
    'brutality': 0,
    'timeout': 0
  });
  
  // Player notes state
  const [currentNote, setCurrentNote] = useState('');
  
  // Ejection state - tracks active ejections with timers
  interface ActiveEjection {
    playerId: number;
    playerName: string;
    team: 'ucDavis' | 'opponent';
    timeRemaining: number; // seconds
    startTime: number; // game time when ejection started
  }
  const [activeEjections, setActiveEjections] = useState<ActiveEjection[]>([]);
  
  // UC Davis player roster (7 in pool, rest on bench)
  const ucDavisPlayers: PlayerStat[] = [
    { playerId: 1, playerName: 'Alex Martinez', jerseyNumber: 1, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 2, playerName: 'Jake Thompson', jerseyNumber: 2, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 3, playerName: 'Ryan Chen', jerseyNumber: 3, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 4, playerName: 'Marcus Wilson', jerseyNumber: 4, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 5, playerName: 'David Kim', jerseyNumber: 5, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 6, playerName: 'Brandon Lee', jerseyNumber: 6, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 7, playerName: 'Chris Anderson', jerseyNumber: 7, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 8, playerName: 'Tyler Johnson', jerseyNumber: 8, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
    { playerId: 9, playerName: 'Noah Parker', jerseyNumber: 9, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
    { playerId: 10, playerName: 'Ethan Rodriguez', jerseyNumber: 10, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  ];

  // Opponent player roster (7 in pool, rest on bench)
  const opponentPlayers: PlayerStat[] = [
    { playerId: 101, playerName: 'Opponent #1', jerseyNumber: 1, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 102, playerName: 'Opponent #2', jerseyNumber: 2, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 103, playerName: 'Opponent #3', jerseyNumber: 3, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 104, playerName: 'Opponent #4', jerseyNumber: 4, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 105, playerName: 'Opponent #5', jerseyNumber: 5, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 106, playerName: 'Opponent #6', jerseyNumber: 6, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 107, playerName: 'Opponent #7', jerseyNumber: 7, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true, notes: [] },
    { playerId: 108, playerName: 'Opponent #8', jerseyNumber: 8, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
    { playerId: 109, playerName: 'Opponent #9', jerseyNumber: 9, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
    { playerId: 110, playerName: 'Opponent #10', jerseyNumber: 10, shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: false, notes: [] },
  ];

  const [ucDavisPlayerStats, setUcDavisPlayerStats] = useState<PlayerStat[]>(ucDavisPlayers);
  const [opponentPlayerStats, setOpponentPlayerStats] = useState<PlayerStat[]>(opponentPlayers);
  const [teamStats, setTeamStats] = useState<TeamStat>({
    FCO: 0,
    FCD: 0,
    CAO: 0,
    CAD: 0,
    AG: 0,
    AGD: 0,
    sixOnFive: 0,
    fiveOnSix: 0,
    sevenOnSix: 0,
    sixOnSeven: 0,
    possessionTimeUCDavis: 0,
    possessionTimeOpponent: 0,
  });

  // Determine which team's players to show based on possession
  const activePlayerStats = currentPossession === 'opponent' ? opponentPlayerStats : ucDavisPlayerStats;
  const activeTeamName = currentPossession === 'opponent' ? 'Opponent' : 'UC Davis';

  // Helper function to check if a player is currently ejected
  const isPlayerEjected = (playerId: number, team: 'ucDavis' | 'opponent'): ActiveEjection | undefined => {
    return activeEjections.find(ej => ej.playerId === playerId && ej.team === team);
  };

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        ucDavisPlayerStats: JSON.parse(JSON.stringify(ucDavisPlayerStats)),
        opponentPlayerStats: JSON.parse(JSON.stringify(opponentPlayerStats)),
        teamStats: JSON.parse(JSON.stringify(teamStats)),
        plays: JSON.parse(JSON.stringify(plays)),
        currentQuarter,
        heatmapData: JSON.parse(JSON.stringify(heatmapData)),
        refereeCalls: []
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Save state to history
  const saveToHistory = (
    newUcDavisStats: PlayerStat[], 
    newOpponentStats: PlayerStat[],
    newTeamStats: TeamStat, 
    newPlays: Play[], 
    newQuarter: number, 
    newHeatmapData: HeatmapData,
    newRefereeCalls: RefereeCall[]
  ) => {
    const newState: HistoryState = {
      ucDavisPlayerStats: JSON.parse(JSON.stringify(newUcDavisStats)),
      opponentPlayerStats: JSON.parse(JSON.stringify(newOpponentStats)),
      teamStats: JSON.parse(JSON.stringify(newTeamStats)),
      plays: JSON.parse(JSON.stringify(newPlays)),
      currentQuarter: newQuarter,
      heatmapData: JSON.parse(JSON.stringify(newHeatmapData)),
      refereeCalls: JSON.parse(JSON.stringify(newRefereeCalls))
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

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setUcDavisPlayerStats(JSON.parse(JSON.stringify(previousState.ucDavisPlayerStats)));
      setOpponentPlayerStats(JSON.parse(JSON.stringify(previousState.opponentPlayerStats)));
      setTeamStats(JSON.parse(JSON.stringify(previousState.teamStats)));
      setPlays(JSON.parse(JSON.stringify(previousState.plays)));
      setCurrentQuarter(previousState.currentQuarter);
      setHeatmapData(JSON.parse(JSON.stringify(previousState.heatmapData)));
      setRefereeCalls(JSON.parse(JSON.stringify(previousState.refereeCalls)));
      
      // Recalculate referee call counts
      const counts = {
        'yellow-card': 0,
        'red-card': 0,
        'ejection': 0,
        'offensive-foul': 0,
        'defensive-foul': 0,
        'brutality': 0,
        'timeout': 0
      };
      previousState.refereeCalls.forEach((call: RefereeCall) => {
        counts[call.type]++;
      });
      setRefereeCallCounts(counts);
      
      setHistoryIndex(historyIndex - 1);
      toast.info('Action undone');
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setUcDavisPlayerStats(JSON.parse(JSON.stringify(nextState.ucDavisPlayerStats)));
      setOpponentPlayerStats(JSON.parse(JSON.stringify(nextState.opponentPlayerStats)));
      setTeamStats(JSON.parse(JSON.stringify(nextState.teamStats)));
      setPlays(JSON.parse(JSON.stringify(nextState.plays)));
      setCurrentQuarter(nextState.currentQuarter);
      setHeatmapData(JSON.parse(JSON.stringify(nextState.heatmapData)));
      setRefereeCalls(JSON.parse(JSON.stringify(nextState.refereeCalls)));
      
      // Recalculate referee call counts
      const counts = {
        'yellow-card': 0,
        'red-card': 0,
        'ejection': 0,
        'offensive-foul': 0,
        'defensive-foul': 0,
        'brutality': 0,
        'timeout': 0
      };
      nextState.refereeCalls.forEach((call: RefereeCall) => {
        counts[call.type]++;
      });
      setRefereeCallCounts(counts);
      
      setHistoryIndex(historyIndex + 1);
      toast.info('Action redone');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerInitials = (name: string) => {
    if (name.startsWith('Opponent')) {
      return name.replace('Opponent ', '');
    }
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const handleStartGame = async () => {
    try {
      const match = await api.createMatch({
        uc_davis_team_id: 1, // Default team IDs
        opponent_team_id: 2,
        match_date: new Date().toISOString(),
        location: 'UC Davis Aquatic Center'
      });
      setMatchId(match.id);
      setIsGameActive(true);
      setIsPaused(false);
      toast.success('Game started! Good luck Aggies!');
    } catch (error) {
      console.error('Failed to create match:', error);
      toast.error('Failed to start game on server, using local mode');
      setIsGameActive(true);
      setIsPaused(false);
    }
  };

  const handlePauseGame = () => {
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
    setUcDavisPlayerStats(ucDavisPlayers);
    setOpponentPlayerStats(opponentPlayers);
    setTeamStats({
      FCO: 0,
      FCD: 0,
      CAO: 0,
      CAD: 0,
      AG: 0,
      AGD: 0,
      sixOnFive: 0,
      fiveOnSix: 0,
      sevenOnSix: 0,
      sixOnSeven: 0,
      possessionTimeUCDavis: 0,
      possessionTimeOpponent: 0,
    });
    setPlays([]);
    setHistory([]);
    setHistoryIndex(-1);
    setHeatmapData({
      ucDavis: [],
      opponent: []
    });
    toast.success('Game stats reset');
  };

  const handleSaveGame = () => {
    toast.success('Game stats saved successfully!');
    console.log('UC Davis Stats:', ucDavisPlayerStats);
    console.log('Opponent Stats:', opponentPlayerStats);
    console.log('Team Stats:', teamStats);
    console.log('Plays:', plays);
    console.log('Heatmap Data:', heatmapData);
  };

  const updatePlayerStat = async (playerId: number, stat: keyof Omit<PlayerStat, 'playerId' | 'playerName' | 'isActive'>, increment: number = 1) => {
    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    
    if (team === 'opponent') {
      const newPlayerStats = opponentPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, [stat]: Math.max(0, (p[stat as keyof PlayerStat] as number) + increment) }
          : p
      );
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, [stat]: Math.max(0, (p[stat as keyof PlayerStat] as number) + increment) }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }

    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.updateMatchStats(matchId, playerId, { [stat]: increment });
      } catch (error) {
        console.error('Failed to sync player stat:', error);
      }
    }

    const player = activePlayerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.success(`${player.playerName} - ${stat} ${increment > 0 ? 'added' : 'removed'}`);
    }
  };

  const updateTeamStat = async (stat: keyof TeamStat, increment: number = 1) => {
    const newTeamStats = {
      ...teamStats,
      [stat]: Math.max(0, teamStats[stat] + increment)
    };
    setTeamStats(newTeamStats);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, newTeamStats, plays, currentQuarter, heatmapData, refereeCalls);
    
    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.createPlay(matchId, {
          event_type: 'team_stat',
          stat_name: stat,
          value: increment,
          quarter: currentQuarter,
          game_time: gameTime
        });
      } catch (error) {
        console.error('Failed to sync team stat:', error);
      }
    }

    toast.success(`Team ${stat} ${increment > 0 ? 'incremented' : 'decremented'}`);
  };

  const updateQuarter = (newQuarter: number) => {
    setCurrentQuarter(newQuarter);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, newQuarter, heatmapData, refereeCalls);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive && !isPaused && !isInBreak) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGameActive, isPaused, isInBreak]);

  // Check if quarter has ended and trigger break
  useEffect(() => {
    if (gameTime === 480 && isGameActive && !isInBreak && currentQuarter < 4) {
      // Quarter ended at 8 minutes
      let breakDuration = 0;
      let breakMessage = '';
      
      if (currentQuarter === 1) {
        breakDuration = 120; // 2 minutes between Q1 and Q2
        breakMessage = 'Quarter 1 complete! 2-minute break before Quarter 2';
      } else if (currentQuarter === 2) {
        breakDuration = 300; // 5 minutes between Q2 and Q3 (halftime)
        breakMessage = 'Halftime! 5-minute break before Quarter 3';
      } else if (currentQuarter === 3) {
        breakDuration = 120; // 2 minutes between Q3 and Q4
        breakMessage = 'Quarter 3 complete! 2-minute break before Quarter 4';
      }
      
      setIsInBreak(true);
      setBreakTimeRemaining(breakDuration);
      setIsPossessionActive(false); // Stop possession timer during break
      toast.info(breakMessage, { duration: 5000 });
    }
  }, [gameTime, isGameActive, isInBreak, currentQuarter]);

  // Break timer countdown
  useEffect(() => {
    let breakInterval: NodeJS.Timeout | null = null;
    if (isInBreak && breakTimeRemaining > 0) {
      breakInterval = setInterval(() => {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            // Break is over, advance to next quarter
            setIsInBreak(false);
            setGameTime(0);
            const nextQuarter = currentQuarter + 1;
            setCurrentQuarter(nextQuarter);
            saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, nextQuarter, heatmapData, refereeCalls);
            toast.success(`Quarter ${nextQuarter} starting!`, { duration: 3000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (breakInterval) {
        clearInterval(breakInterval);
      }
    };
  }, [isInBreak, breakTimeRemaining, currentQuarter, ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, heatmapData, refereeCalls]);

  useEffect(() => {
    let possessionInterval: NodeJS.Timeout | null = null;
    if (isPossessionActive && currentPossession && isGameActive && !isPaused && !isInBreak) {
      possessionInterval = setInterval(() => {
        setTeamStats(prev => ({
          ...prev,
          [currentPossession === 'ucDavis' ? 'possessionTimeUCDavis' : 'possessionTimeOpponent']: 
            prev[currentPossession === 'ucDavis' ? 'possessionTimeUCDavis' : 'possessionTimeOpponent'] + 1
        }));
      }, 1000);
    }
    return () => {
      if (possessionInterval) {
        clearInterval(possessionInterval);
      }
    };
  }, [isPossessionActive, currentPossession, isGameActive, isPaused, isInBreak]);

  // Ejection timer countdown effect
  useEffect(() => {
    let ejectionInterval: NodeJS.Timeout | null = null;
    if (isGameActive && !isPaused && !isInBreak && activeEjections.length > 0) {
      ejectionInterval = setInterval(() => {
        setActiveEjections(prev => {
          const updated = prev.map(ejection => ({
            ...ejection,
            timeRemaining: Math.max(0, ejection.timeRemaining - 1)
          }));
          
          // Remove expired ejections
          const stillActive = updated.filter(ej => ej.timeRemaining > 0);
          
          // Check if any ejections expired
          const expired = updated.filter(ej => ej.timeRemaining === 0);
          expired.forEach(ej => {
            toast.info(`${ej.playerName} ejection expired - can return to play`);
          });
          
          return stillActive;
        });
      }, 1000);
    }
    return () => {
      if (ejectionInterval) {
        clearInterval(ejectionInterval);
      }
    };
  }, [isGameActive, isPaused, isInBreak, activeEjections.length]);

  // Handle turnover - switch possession
  const handleTurnover = async (playerId: number) => {
    if (isPossessionActive) {
      setIsPossessionActive(false);
    }

    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    
    if (team === 'opponent') {
      const newPlayerStats = opponentPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, turnovers: p.turnovers + 1 }
          : p
      );
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, turnovers: p.turnovers + 1 }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }

    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.updateMatchStats(matchId, playerId, { turnovers: 1 });
        await api.createPlay(matchId, {
          player_id: playerId,
          quarter: currentQuarter,
          game_time: gameTime,
          event_type: 'turnover'
        });
      } catch (error) {
        console.error('Failed to sync turnover:', error);
      }
    }
    
    const player = activePlayerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.error(`${player.playerName} - Turnover`);
    }
    
    // Add to possession timeline
    const currentTime = currentPossession === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent;
    const duration = currentTime - currentPossessionStart;
    if (currentPossession && duration > 0) {
      const newEvent: PossessionEvent = {
        id: Date.now().toString(),
        team: currentPossession,
        timestamp: currentPossessionStart,
        duration: duration,
        event: 'Turnover'
      };
      setPossessionTimeline(prev => [...prev, newEvent]);
    }
    
    setTimeout(() => {
      const newPossession = currentPossession === 'ucDavis' ? 'opponent' : 'ucDavis';
      setCurrentPossession(newPossession);
      setCurrentPossessionStart(newPossession === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent);
      setIsPossessionActive(true);
      setSelectedPlayer(null); // Clear selected player when possession changes
      
      // Clear all active ejections when possession changes
      if (activeEjections.length > 0) {
        activeEjections.forEach(ej => {
          toast.info(`${ej.playerName} ejection ended (possession change)`);
        });
        setActiveEjections([]);
      }
      
      toast.info(`${newPossession === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession started`);
    }, 500);
  };

  // Handle steal - switch possession
  const handleSteal = async (playerId: number) => {
    if (isPossessionActive) {
      setIsPossessionActive(false);
    }

    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    
    if (team === 'opponent') {
      const newPlayerStats = opponentPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, steals: p.steals + 1 }
          : p
      );
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, steals: p.steals + 1 }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }

    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.updateMatchStats(matchId, playerId, { steals: 1 });
        await api.createPlay(matchId, {
          player_id: playerId,
          quarter: currentQuarter,
          game_time: gameTime,
          event_type: 'steal'
        });
      } catch (error) {
        console.error('Failed to sync steal:', error);
      }
    }
    
    const player = activePlayerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.success(`${player.playerName} - Steal!`);
    }
    
    // Add to possession timeline
    const currentTime = currentPossession === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent;
    const duration = currentTime - currentPossessionStart;
    if (currentPossession && duration > 0) {
      const newEvent: PossessionEvent = {
        id: Date.now().toString(),
        team: currentPossession,
        timestamp: currentPossessionStart,
        duration: duration,
        event: 'Steal'
      };
      setPossessionTimeline(prev => [...prev, newEvent]);
    }
    
    setTimeout(() => {
      const newPossession = currentPossession === 'ucDavis' ? 'opponent' : 'ucDavis';
      setCurrentPossession(newPossession);
      setCurrentPossessionStart(newPossession === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent);
      setIsPossessionActive(true);
      setSelectedPlayer(null); // Clear selected player when possession changes
      
      // Clear all active ejections when possession changes
      if (activeEjections.length > 0) {
        activeEjections.forEach(ej => {
          toast.info(`${ej.playerName} ejection ended (possession change)`);
        });
        setActiveEjections([]);
      }
      
      toast.success(`${newPossession === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession started`);
    }, 500);
  };

  // Open heatmap modal for shot
  const handleShotClick = (playerId: number) => {
    const player = activePlayerStats.find(p => p.playerId === playerId);
    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    if (player) {
      setPendingAction({ type: 'shot', playerId, playerName: player.playerName, team });
      setShowHeatmapModal(true);
    }
  };

  // Open heatmap modal for goal
  const handleGoalClick = (playerId: number) => {
    const player = activePlayerStats.find(p => p.playerId === playerId);
    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    if (player) {
      setPendingAction({ type: 'goal', playerId, playerName: player.playerName, team });
      setShowHeatmapModal(true);
    }
  };

  // Open heatmap modal for assist
  const handleAssistClick = (playerId: number) => {
    const player = activePlayerStats.find(p => p.playerId === playerId);
    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    if (player) {
      setPendingAction({ type: 'assist', playerId, playerName: player.playerName, team });
      setShowHeatmapModal(true);
    }
  };

  // Add note to player
  const handleAddNote = () => {
    if (!selectedPlayer || !currentNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    const timestamp = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(gameTime % 60).padStart(2, '0')} Q${currentQuarter}`;
    const noteWithTimestamp = `[${timestamp}] ${currentNote.trim()}`;

    if (currentPossession === 'opponent') {
      const newPlayerStats = opponentPlayerStats.map(p => 
        p.playerId === selectedPlayer 
          ? { ...p, notes: [...(p.notes || []), noteWithTimestamp] } 
          : p
      );
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === selectedPlayer 
          ? { ...p, notes: [...(p.notes || []), noteWithTimestamp] } 
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }

    setCurrentNote('');
    toast.success('Note added');
  };

  // Handle referee call
  const handleRefereeCall = (callType: 'yellow-card' | 'red-card' | 'ejection' | 'offensive-foul' | 'defensive-foul' | 'brutality' | 'timeout') => {
    // Pause the game
    setIsPaused(true);
    setPendingRefereeCall(callType);
    setShowRefereeCallModal(true);
  };

  // Add referee call with player/team selection
  const addRefereeCall = async (playerName?: string, team?: 'ucDavis' | 'opponent') => {
    if (!pendingRefereeCall) return;

    const timestamp = `${String(Math.floor(gameTime / 60)).padStart(2, '0')}:${String(gameTime % 60).padStart(2, '0')}`;
    const newCall: RefereeCall = {
      id: Date.now().toString(),
      type: pendingRefereeCall,
      playerName,
      team,
      timestamp,
      gameTime,
      quarter: currentQuarter
    };

    const newRefereeCalls = [...refereeCalls, newCall];
    setRefereeCalls(newRefereeCalls);
    
    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.createPlay(matchId, {
          event_type: 'referee_call',
          call_type: pendingRefereeCall,
          player_name: playerName,
          team: team,
          quarter: currentQuarter,
          game_time: gameTime
        });
      } catch (error) {
        console.error('Failed to sync referee call:', error);
      }
    }
    
    // Increment the counter for this call type
    setRefereeCallCounts(prev => ({
      ...prev,
      [pendingRefereeCall]: prev[pendingRefereeCall] + 1
    }));
    
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, newRefereeCalls);

    // Handle ejection - add to active ejections and increment player exclusion stat
    if (pendingRefereeCall === 'ejection' && playerName && team) {
      const playerStats = team === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats;
      const player = playerStats.find(p => p.playerName === playerName);
      
      if (player) {
        // Add to active ejections with 20-second timer
        const newEjection: ActiveEjection = {
          playerId: player.playerId,
          playerName: player.playerName,
          team: team,
          timeRemaining: 20,
          startTime: gameTime
        };
        setActiveEjections(prev => [...prev, newEjection]);
        
        // Increment player's exclusion stat
        if (team === 'ucDavis') {
          const newPlayerStats = ucDavisPlayerStats.map(p =>
            p.playerId === player.playerId
              ? { ...p, exclusions: p.exclusions + 1 }
              : p
          );
          setUcDavisPlayerStats(newPlayerStats);
        } else {
          const newPlayerStats = opponentPlayerStats.map(p =>
            p.playerId === player.playerId
              ? { ...p, exclusions: p.exclusions + 1 }
              : p
          );
          setOpponentPlayerStats(newPlayerStats);
        }
        
        toast.warning(`${playerName} ejected for 20 seconds (or until goal/possession change)`);
      }
    }

    const callLabel = pendingRefereeCall.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (pendingRefereeCall !== 'ejection') {
      toast.success(`${callLabel} recorded${playerName ? ` - ${playerName}` : ''}`);
    }
    
    setShowRefereeCallModal(false);
    setPendingRefereeCall(null);
  };

  // Handle player substitution
  const handleSubstitution = async () => {
    if (!firstSelectedPlayer || !secondSelectedPlayer || !subTeam) {
      toast.error('Please select two players to swap');
      return;
    }

    const playerStats = subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats;
    
    const player1 = playerStats.find(p => p.playerId === firstSelectedPlayer);
    const player2 = playerStats.find(p => p.playerId === secondSelectedPlayer);

    if (!player1 || !player2) {
      toast.error('Invalid player selection');
      return;
    }

    // Swap the isActive status of both players
    const newPlayerStats = playerStats.map(player => {
      if (player.playerId === firstSelectedPlayer) {
        return { ...player, isActive: player2.isActive };
      } else if (player.playerId === secondSelectedPlayer) {
        return { ...player, isActive: player1.isActive };
      }
      return player;
    });

    if (subTeam === 'ucDavis') {
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    } else {
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData, refereeCalls);
    }
    
    // Sync with backend if match is active
    if (matchId) {
      try {
        await api.createPlay(matchId, {
          event_type: 'substitution',
          player_in_id: secondSelectedPlayer, // assuming second is coming in
          player_out_id: firstSelectedPlayer,
          team: subTeam,
          quarter: currentQuarter,
          game_time: gameTime
        });
      } catch (error) {
        console.error('Failed to sync substitution:', error);
      }
    }
    
    toast.success(`Swapped: ${player1.playerName} ↔ ${player2.playerName}`);
    
    setShowSubModal(false);
    setFirstSelectedPlayer(null);
    setSecondSelectedPlayer(null);
    setSubTeam(null);
  };

  // Handle pin-drop selection in heatmap modal
  const handlePinDrop = async (x: number, y: number) => {
    if (!pendingAction) return;

    const { type, playerId, playerName, team } = pendingAction;

    // Add shot location to heatmap data with formation and type
    const newHeatmapData = { ...heatmapData };
    newHeatmapData[team] = [...newHeatmapData[team], { x, y, type, formation }];

    // Sync with backend if match is active
    if (matchId) {
      try {
        const statUpdate: any = {};
        if (type === 'goal') {
          statUpdate.goals = 1;
          statUpdate.shots = 1;
        } else if (type === 'shot') {
          statUpdate.shots = 1;
        } else if (type === 'assist') {
          statUpdate.assists = 1;
        }
        
        await api.updateMatchStats(matchId, playerId, statUpdate);
        await api.createPlay(matchId, {
          player_id: playerId,
          quarter: currentQuarter,
          game_time: gameTime,
          event_type: type,
          x_coordinate: x,
          y_coordinate: y,
          formation: formation
        });
      } catch (error) {
        console.error(`Failed to sync ${type}:`, error);
      }
    }

    // Update player stats
    if (type === 'shot') {
      if (team === 'opponent') {
        const newPlayerStats = opponentPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p
        );
        setOpponentPlayerStats(newPlayerStats);
        saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newPlayerStats = ucDavisPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p
        );
        setUcDavisPlayerStats(newPlayerStats);
        saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - Shot recorded (${formation})`);
    } else if (type === 'goal') {
      if (team === 'opponent') {
        const newPlayerStats = opponentPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p
        );
        setOpponentPlayerStats(newPlayerStats);
        saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newPlayerStats = ucDavisPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p
        );
        setUcDavisPlayerStats(newPlayerStats);
        saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - GOAL! (${formation})`);
      
      // Clear all active ejections when a goal is scored
      if (activeEjections.length > 0) {
        activeEjections.forEach(ej => {
          toast.info(`${ej.playerName} ejection ended (goal scored)`);
        });
        setActiveEjections([]);
      }
      
      // Add to possession timeline
      const currentTime = team === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent;
      const duration = currentTime - currentPossessionStart;
      if (duration > 0) {
        const newEvent: PossessionEvent = {
          id: Date.now().toString(),
          team: team,
          timestamp: currentPossessionStart,
          duration: duration,
          event: 'Goal'
        };
        setPossessionTimeline(prev => [...prev, newEvent]);
      }
      
      // Handle possession change for goal
      if (isPossessionActive) {
        setIsPossessionActive(false);
      }
      setTimeout(() => {
        const newPossession = team === 'ucDavis' ? 'opponent' : 'ucDavis';
        setCurrentPossession(newPossession);
        setCurrentPossessionStart(newPossession === 'ucDavis' ? teamStats.possessionTimeUCDavis : teamStats.possessionTimeOpponent);
        setIsPossessionActive(true);
        setSelectedPlayer(null);
        toast.info(`${newPossession === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession started (restart)`);
      }, 500);
    } else if (type === 'assist') {
      if (team === 'opponent') {
        const newPlayerStats = opponentPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, assists: p.assists + 1 } : p
        );
        setOpponentPlayerStats(newPlayerStats);
        saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      } else {
        const newPlayerStats = ucDavisPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, assists: p.assists + 1 } : p
        );
        setUcDavisPlayerStats(newPlayerStats);
        saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData, refereeCalls);
      }
      toast.success(`${playerName} - Assist! (${formation})`);
    }

    setHeatmapData(newHeatmapData);

    // Close modal
    setShowHeatmapModal(false);
    setPendingAction(null);
  };

  // Get player positions based on formation
  const getPlayerPositions = (formation: '4-2' | '3-3') => {
    if (formation === '4-2') {
      return [
        // 4 players at 2m line (positioned at y=25%)
        { x: 20, y: 25, label: '1' },
        { x: 40, y: 25, label: '2' },
        { x: 60, y: 25, label: '3' },
        { x: 80, y: 25, label: '4' },
        // 2 players at 6m line (positioned at y=70%)
        { x: 35, y: 70, label: '5' },
        { x: 65, y: 70, label: '6' },
      ];
    } else {
      // 3-3 formation
      return [
        // 3 players at 2m line (positioned at y=25%)
        { x: 25, y: 25, label: '1' },
        { x: 50, y: 25, label: '2' },
        { x: 75, y: 25, label: '3' },
        // 3 players at 6m line (positioned at y=70%)
        { x: 25, y: 70, label: '4' },
        { x: 50, y: 70, label: '5' },
        { x: 75, y: 70, label: '6' },
      ];
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[#022851] mb-2">Live Stats Input</h1>
            <p className="text-gray-600">Track real-time game statistics for UC Davis Water Polo</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2 mr-2 border-r pr-4">
              <Button 
                onClick={handleUndo}
                disabled={!canUndo}
                variant="outline"
                size="sm"
                className="border-gray-300"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={16} className="mr-1" />
                Undo
              </Button>
              <Button 
                onClick={handleRedo}
                disabled={!canRedo}
                variant="outline"
                size="sm"
                className="border-gray-300"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={16} className="mr-1" />
                Redo
              </Button>
            </div>

            {!isGameActive ? (
              <>
                <Button 
                  onClick={() => {
                    setEditingUcDavisPlayers(JSON.parse(JSON.stringify(ucDavisPlayerStats)));
                    setEditingOpponentPlayers(JSON.parse(JSON.stringify(opponentPlayerStats)));
                    setShowPlayerEditModal(true);
                  }}
                  variant="outline"
                  className="border-[#022851] text-[#022851] hover:bg-[#022851]/10"
                >
                  <Users size={16} className="mr-2" />
                  Edit Players
                </Button>
                <Button 
                  onClick={handleStartGame}
                  className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
                >
                  <Play size={16} className="mr-2" />
                  Start Game
                </Button>
              </>
            ) : (
              <>
                {isInBreak ? (
                  <Button 
                    onClick={() => {
                      // Skip break and start next quarter immediately
                      setIsInBreak(false);
                      setBreakTimeRemaining(0);
                      setGameTime(0);
                      const nextQuarter = currentQuarter + 1;
                      setCurrentQuarter(nextQuarter);
                      saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, nextQuarter, heatmapData, refereeCalls);
                      toast.success(`Quarter ${nextQuarter} starting early!`, { duration: 3000 });
                    }}
                    className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
                  >
                    <ArrowRight size={16} className="mr-2" />
                    Skip Break & Start Q{currentQuarter + 1}
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePauseGame}
                    className="bg-[#022851] text-white hover:bg-[#022851]/90"
                  >
                    {isPaused ? <Play size={16} className="mr-2" /> : <Pause size={16} className="mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                <Button 
                  onClick={handleSaveGame}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
                <Button 
                  onClick={handleResetGame}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Game Info Bar */}
        <Card className="p-4 bg-gradient-to-r from-[#022851] to-[#033a70] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                {isInBreak ? (
                  <span className="text-2xl">{formatTime(breakTimeRemaining)}</span>
                ) : (
                  <span className="text-2xl">{formatTime(gameTime)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Activity size={20} />
                {isInBreak ? (
                  <span className="text-xl">
                    {currentQuarter === 2 ? 'Halftime' : `Break (Q${currentQuarter} → Q${currentQuarter + 1})`}
                  </span>
                ) : (
                  <span className="text-xl">Quarter {currentQuarter}</span>
                )}
              </div>
              <Badge className={`${isInBreak ? 'bg-orange-500' : isGameActive ? (isPaused ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-500'} text-white`}>
                {isInBreak ? 'BREAK' : isGameActive ? (isPaused ? 'PAUSED' : 'LIVE') : 'NOT STARTED'}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => updateQuarter(Math.max(1, currentQuarter - 1))}
              >
                <Minus size={14} />
              </Button>
              <span>Quarter</span>
              <Button
                size="sm"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => updateQuarter(Math.min(4, currentQuarter + 1))}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Single Page Layout */}
      <div className="space-y-6">
        {/* Possession Timer */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-4">Possession Timer</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className={`p-4 border-none ${
              currentPossession === 'ucDavis' && isPossessionActive
                ? 'bg-gradient-to-br from-[#FFBF00] to-[#ffcc33] ring-4 ring-[#FFBF00]/50'
                : 'bg-gradient-to-br from-[#FFBF00]/70 to-[#ffcc33]/70'
            }`}>
              <div className="text-sm text-[#022851]/70 mb-2">UC Davis</div>
              <div className="text-3xl text-[#022851]">{formatTime(teamStats.possessionTimeUCDavis)}</div>
              <Button
                onClick={() => {
                  if (!isGameActive) {
                    toast.error('Please start the game first');
                    return;
                  }
                  if (currentPossession === 'ucDavis') {
                    setIsPossessionActive(false);
                    setSelectedPlayer(null);
                    toast.info('UC Davis possession stopped');
                  } else {
                    setCurrentPossession('ucDavis');
                    setCurrentPossessionStart(teamStats.possessionTimeUCDavis);
                    setIsPossessionActive(true);
                    setSelectedPlayer(null);
                    toast.success('UC Davis possession started');
                  }
                }}
                disabled={!isGameActive && currentPossession !== 'ucDavis'}
                className={`mt-3 w-full ${
                  currentPossession === 'ucDavis' && isPossessionActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#022851] hover:bg-[#022851]/90 text-white'
                }`}
              >
                {currentPossession === 'ucDavis' && isPossessionActive ? (
                  <><Pause size={16} className="mr-2" />Stop</> 
                ) : (
                  <><Play size={16} className="mr-2" />Start</>
                )}
              </Button>
            </Card>

            <Card className={`p-4 border-none text-white ${
              currentPossession === 'opponent' && isPossessionActive
                ? 'bg-gradient-to-br from-red-600 to-red-700 ring-4 ring-red-500/50'
                : 'bg-gradient-to-br from-red-600/70 to-red-700/70'
            }`}>
              <div className="text-sm opacity-70 mb-2">Opponent</div>
              <div className="text-3xl">{formatTime(teamStats.possessionTimeOpponent)}</div>
              <Button
                onClick={() => {
                  if (!isGameActive) {
                    toast.error('Please start the game first');
                    return;
                  }
                  if (currentPossession === 'opponent') {
                    setIsPossessionActive(false);
                    setSelectedPlayer(null);
                    toast.info('Opponent possession stopped');
                  } else {
                    setCurrentPossession('opponent');
                    setCurrentPossessionStart(teamStats.possessionTimeOpponent);
                    setIsPossessionActive(true);
                    setSelectedPlayer(null);
                    toast.info('Opponent possession started');
                  }
                }}
                disabled={!isGameActive && currentPossession !== 'opponent'}
                className={`mt-3 w-full ${
                  currentPossession === 'opponent' && isPossessionActive
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-white hover:bg-gray-100 text-red-600'
                }`}
              >
                {currentPossession === 'opponent' && isPossessionActive ? (
                  <><Pause size={16} className="mr-2" />Stop</>
                ) : (
                  <><Play size={16} className="mr-2" />Start</>
                )}
              </Button>
            </Card>
          </div>
        </Card>

        {/* Active Ejections Display */}
        {activeEjections.length > 0 && (
          <Card className="p-4 bg-orange-50 border border-orange-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-orange-600" size={20} />
              <h3 className="text-orange-900 font-semibold">Active Ejections</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeEjections.map((ejection) => (
                <div
                  key={ejection.playerId + ejection.team}
                  className={`p-3 rounded-lg border-2 ${
                    ejection.team === 'ucDavis'
                      ? 'bg-[#FFBF00]/20 border-[#FFBF00]'
                      : 'bg-red-100 border-red-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${
                        ejection.team === 'ucDavis' ? 'text-[#022851]' : 'text-red-900'
                      }`}>
                        {ejection.playerName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {ejection.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        ejection.team === 'ucDavis' ? 'text-[#022851]' : 'text-red-900'
                      }`}>
                        {ejection.timeRemaining}
                      </div>
                      <div className="text-xs text-gray-600">seconds</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-700 mt-3 italic">
              Ejections end after 20 seconds, when a goal is scored, or when possession changes
            </p>
          </Card>
        )}

        {/* Team Indicator Banner */}
        {currentPossession && (
          <Card className={`p-4 ${
            currentPossession === 'ucDavis'
              ? 'bg-gradient-to-r from-[#FFBF00] to-[#ffcc33]'
              : 'bg-gradient-to-r from-red-600 to-red-700'
          } border-none`}>
            <div className="text-center">
              <h2 className={`text-2xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                Now Tracking: {activeTeamName}
              </h2>
              <p className={`text-sm ${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>
                Switch possession to track the other team
              </p>
            </div>
          </Card>
        )}

        {/* Player Selection */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="space-y-6">
            {/* UC Davis Players */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#022851]">Select Player - UC Davis</h3>
                {currentPossession === 'ucDavis' && isPossessionActive && (
                  <Badge className="bg-[#FFBF00] text-[#022851]">
                    <Activity size={12} className="mr-1 inline animate-pulse" />
                    Active Possession
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {ucDavisPlayerStats.map((player) => {
                  const isSelectedUCDavis = selectedPlayer === player.playerId && currentPossession === 'ucDavis';
                  const ejection = isPlayerEjected(player.playerId, 'ucDavis');
                  const isEjected = !!ejection;
                  return (
                    <div key={player.playerId} className="relative">
                      <Button
                        onClick={() => {
                          if (isEjected) {
                            toast.error(`${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`);
                            return;
                          }
                          setSelectedPlayer(player.playerId);
                          setCurrentPossession('ucDavis');
                          toast.success(`Tracking ${player.playerName}`);
                        }}
                        disabled={isEjected}
                        className={`w-full h-20 flex flex-col items-center justify-center transition-all ${
                          isEjected
                            ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                            : isSelectedUCDavis
                            ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                            : player.isActive
                            ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="text-3xl font-bold mb-1">
                          #{player.jerseyNumber}
                        </div>
                        <div className="text-[10px] opacity-80 leading-tight text-center px-1">
                          {player.playerName}
                        </div>
                      </Button>
                      {isEjected && (
                        <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                          {ejection.timeRemaining}s
                        </Badge>
                      )}
                      {!isEjected && player.isActive && (
                        <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                          IN
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opponent Players */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#022851]">Select Player - Opponents</h3>
                {currentPossession === 'opponent' && isPossessionActive && (
                  <Badge className="bg-red-600 text-white">
                    <Activity size={12} className="mr-1 inline animate-pulse" />
                    Active Possession
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {opponentPlayerStats.map((player) => {
                  const isSelectedOpponent = selectedPlayer === player.playerId && currentPossession === 'opponent';
                  const ejection = isPlayerEjected(player.playerId, 'opponent');
                  const isEjected = !!ejection;
                  return (
                    <div key={player.playerId} className="relative">
                      <Button
                        onClick={() => {
                          if (isEjected) {
                            toast.error(`${player.playerName} is ejected (${ejection.timeRemaining}s remaining)`);
                            return;
                          }
                          setSelectedPlayer(player.playerId);
                          setCurrentPossession('opponent');
                          toast.success(`Tracking ${player.playerName}`);
                        }}
                        disabled={isEjected}
                        className={`w-full h-20 flex flex-col items-center justify-center transition-all ${
                          isEjected
                            ? 'bg-orange-600 text-white border-2 border-orange-800 opacity-70 cursor-not-allowed'
                            : isSelectedOpponent
                            ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800 shadow-lg'
                            : player.isActive
                            ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="text-3xl font-bold mb-1">
                          #{player.jerseyNumber}
                        </div>
                        <div className="text-[10px] opacity-80 leading-tight text-center px-1">
                          {player.playerName}
                        </div>
                      </Button>
                      {isEjected && (
                        <Badge className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs px-1 animate-pulse">
                          {ejection.timeRemaining}s
                        </Badge>
                      )}
                      {!isEjected && player.isActive && (
                        <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                          IN
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend and Substitution Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>In Pool</span>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>On Bench</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setSubTeam('ucDavis');
                  setShowSubModal(true);
                }}
                className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]"
              >
                <ArrowLeftRight className="mr-1" size={14} />
                Swap UC Davis
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSubTeam('opponent');
                  setShowSubModal(true);
                }}
                className="bg-gray-700 hover:bg-gray-800 text-white"
              >
                <ArrowLeftRight className="mr-1" size={14} />
                Swap Opponent
              </Button>
            </div>
          </div>
        </Card>

        {selectedPlayer && (
          <>
            {/* Current Player Stats Display */}
            <Card className={`p-6 border-none ${
              currentPossession === 'ucDavis'
                ? 'bg-gradient-to-r from-[#FFBF00] to-[#ffcc33]'
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                    {activePlayerStats.find(p => p.playerId === selectedPlayer)?.playerName}
                  </h3>
                  <p className={`${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>
                    Currently tracking
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className={`text-3xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                      {activePlayerStats.find(p => p.playerId === selectedPlayer)?.shots || 0}
                    </div>
                    <div className={`text-sm ${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>Shots</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                      {activePlayerStats.find(p => p.playerId === selectedPlayer)?.goals || 0}
                    </div>
                    <div className={`text-sm ${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>Goals</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                      {activePlayerStats.find(p => p.playerId === selectedPlayer)?.assists || 0}
                    </div>
                    <div className={`text-sm ${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>Assists</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl ${currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'}`}>
                      {activePlayerStats.find(p => p.playerId === selectedPlayer)?.steals || 0}
                    </div>
                    <div className={`text-sm ${currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'}`}>Steals</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Scoring Actions */}
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-[#022851] mb-4 flex items-center gap-2">
                <Target size={20} />
                Scoring & Shooting
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleShotClick(selectedPlayer)}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Target size={24} className="mb-1" />
                  Shot Taken
                </Button>
                <Button
                  onClick={() => handleGoalClick(selectedPlayer)}
                  className="bg-green-600 hover:bg-green-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Target size={24} className="mb-1" />
                  Goal Scored
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'penalties')}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-20 flex flex-col items-center justify-center"
                >
                  <AlertTriangle size={24} className="mb-1" />
                  Penalty Shot
                </Button>
                <Button
                  onClick={() => handleAssistClick(selectedPlayer)}
                  className="bg-purple-500 hover:bg-purple-600 text-white h-20 flex flex-col items-center justify-center"
                >
                  <ArrowRight size={24} className="mb-1" />
                  Assist
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'rebounds')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white h-20 flex flex-col items-center justify-center"
                >
                  <TrendingUp size={24} className="mb-1" />
                  Rebound
                </Button>
                <Button
                  onClick={() => handleTurnover(selectedPlayer)}
                  className="bg-red-600 hover:bg-red-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <XCircle size={24} className="mb-1" />
                  Turnover
                </Button>
              </div>
            </Card>

            {/* Defensive Actions */}
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-[#022851] mb-4 flex items-center gap-2">
                <Shield size={20} />
                Defensive Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleSteal(selectedPlayer)}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Zap size={24} className="mb-1" />
                  Steal
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'blocks')}
                  className="bg-gray-700 hover:bg-gray-800 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Shield size={24} className="mb-1" />
                  Block
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'draws')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <AlertTriangle size={24} className="mb-1" />
                  Draw Exclusion
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'exclusions')}
                  className="bg-red-700 hover:bg-red-800 text-white h-20 flex flex-col items-center justify-center"
                >
                  <XCircle size={24} className="mb-1" />
                  Exclusion
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'tippedPasses')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Activity size={24} className="mb-1" />
                  Tipped Pass
                </Button>
                <Button
                  onClick={() => updatePlayerStat(selectedPlayer, 'hustle')}
                  className="bg-pink-600 hover:bg-pink-700 text-white h-20 flex flex-col items-center justify-center"
                >
                  <Zap size={24} className="mb-1" />
                  Hustle Play
                </Button>
              </div>
            </Card>

            {/* Player Notes Section */}
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[#022851]" />
                  <h3 className="text-[#022851]">Player Notes - {activePlayerStats.find(p => p.playerId === selectedPlayer)?.playerName}</h3>
                </div>
                <Badge className={currentPossession === 'ucDavis' ? 'bg-[#FFBF00] text-[#022851]' : 'bg-red-600 text-white'}>
                  Q{currentQuarter} - {String(Math.floor(gameTime / 60)).padStart(2, '0')}:{String(gameTime % 60).padStart(2, '0')}
                </Badge>
              </div>

              {/* Add Note Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote();
                    }
                  }}
                  placeholder="Add a note about this player's performance..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                />
                <Button
                  onClick={handleAddNote}
                  className="bg-[#022851] text-white hover:bg-[#022851]/90"
                >
                  <Plus size={16} className="mr-1" />
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activePlayerStats.find(p => p.playerId === selectedPlayer)?.notes && 
                 activePlayerStats.find(p => p.playerId === selectedPlayer)?.notes!.length > 0 ? (
                  activePlayerStats
                    .find(p => p.playerId === selectedPlayer)
                    ?.notes!.slice()
                    .reverse()
                    .map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{note}</p>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet. Add observations about this player's performance during the game.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Team Situations, Referee, & Possession Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Situations - Condensed */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-3 text-lg">Team Situations</h3>
            <div className="grid grid-cols-4 gap-2">
              <Button onClick={() => updateTeamStat('FCO')} className="bg-[#022851] hover:bg-[#022851]/90 text-white h-12 text-xs px-1">
                FCO <Badge className="ml-1 bg-[#FFBF00] text-[#022851]">{teamStats.FCO}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('FCD')} className="bg-[#022851] hover:bg-[#022851]/90 text-white h-12 text-xs px-1">
                FCD <Badge className="ml-1 bg-[#FFBF00] text-[#022851]">{teamStats.FCD}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('CAO')} className="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-[#022851] h-12 text-xs px-1">
                CAO <Badge className="ml-1 bg-[#022851] text-white">{teamStats.CAO}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('CAD')} className="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-[#022851] h-12 text-xs px-1">
                CAD <Badge className="ml-1 bg-[#022851] text-white">{teamStats.CAD}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('AG')} className="bg-green-600 hover:bg-green-700 text-white h-12 text-xs px-1">
                AG <Badge className="ml-1 bg-white text-green-700">{teamStats.AG}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('AGD')} className="bg-green-700 hover:bg-green-800 text-white h-12 text-xs px-1">
                AGD <Badge className="ml-1 bg-white text-green-800">{teamStats.AGD}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('sixOnFive')} className="bg-purple-600 hover:bg-purple-700 text-white h-12 text-xs px-1">
                6v5 <Badge className="ml-1 bg-white text-purple-700">{teamStats.sixOnFive}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('fiveOnSix')} className="bg-purple-700 hover:bg-purple-800 text-white h-12 text-xs px-1">
                5v6 <Badge className="ml-1 bg-white text-purple-800">{teamStats.fiveOnSix}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('sevenOnSix')} className="bg-orange-600 hover:bg-orange-700 text-white h-12 text-xs px-1">
                7v6 <Badge className="ml-1 bg-white text-orange-700">{teamStats.sevenOnSix}</Badge>
              </Button>
              <Button onClick={() => updateTeamStat('sixOnSeven')} className="bg-orange-700 hover:bg-orange-800 text-white h-12 text-xs px-1">
                6v7 <Badge className="ml-1 bg-white text-orange-800">{teamStats.sixOnSeven}</Badge>
              </Button>
            </div>
          </Card>

          {/* Referee */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-3 text-lg">Referee</h3>
            
            {/* Referee Name Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Referee Name"
                value={refereeName}
                onChange={(e) => setRefereeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#022851]"
              />
            </div>

            {/* Referee Call Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                onClick={() => handleRefereeCall('yellow-card')}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-12 text-xs flex items-center justify-center gap-1"
              >
                Yellow Card <Badge className="bg-gray-900 text-yellow-400">{refereeCallCounts['yellow-card']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('red-card')}
                className="bg-red-600 hover:bg-red-700 text-white h-12 text-xs flex items-center justify-center gap-1"
              >
                Red Card <Badge className="bg-white text-red-600">{refereeCallCounts['red-card']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('ejection')}
                className="bg-orange-600 hover:bg-orange-700 text-white h-12 text-xs flex items-center justify-center gap-1"
              >
                Ejection <Badge className="bg-white text-orange-600">{refereeCallCounts['ejection']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('offensive-foul')}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-xs flex items-center justify-center gap-1"
              >
                Off. Foul <Badge className="bg-white text-blue-600">{refereeCallCounts['offensive-foul']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('defensive-foul')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-xs flex items-center justify-center gap-1"
              >
                Def. Foul <Badge className="bg-white text-indigo-600">{refereeCallCounts['defensive-foul']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('brutality')}
                className="bg-red-900 hover:bg-red-950 text-white h-12 text-xs flex items-center justify-center gap-1"
              >
                Brutality <Badge className="bg-white text-red-900">{refereeCallCounts['brutality']}</Badge>
              </Button>
              <Button
                onClick={() => handleRefereeCall('timeout')}
                className="bg-gray-600 hover:bg-gray-700 text-white h-12 text-xs col-span-2 flex items-center justify-center gap-1"
              >
                Timeout <Badge className="bg-white text-gray-600">{refereeCallCounts['timeout']}</Badge>
              </Button>
            </div>

            {/* Referee Calls Timeline */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {refereeCalls.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">No referee calls yet</p>
              ) : (
                refereeCalls.slice().reverse().map((call) => (
                  <div
                    key={call.id}
                    className="p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-[#022851] text-white text-xs">
                        {call.timestamp} Q{call.quarter}
                      </Badge>
                      <span className="text-[#022851] font-semibold">
                        {call.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                    {call.playerName && (
                      <div className="text-gray-700">
                        {call.playerName} {call.team && `(${call.team === 'ucDavis' ? 'UC Davis' : 'Opponent'})`}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Possession Timeline */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-3 text-lg">Possession Timeline</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {possessionTimeline.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No possessions recorded yet</p>
              ) : (
                possessionTimeline.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center gap-2 p-2 rounded ${
                      event.team === 'ucDavis' 
                        ? 'bg-[#FFBF00]/20 border-l-4 border-[#FFBF00]' 
                        : 'bg-red-100 border-l-4 border-red-600'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={event.team === 'ucDavis' ? 'bg-[#FFBF00] text-[#022851]' : 'bg-red-600 text-white'}>
                          {event.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}
                        </Badge>
                        <span className="text-sm text-gray-700">{event.event}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {event.duration}s
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">#{index + 1}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Both Teams Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UC Davis Stats */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">UC Davis Players</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-[#022851]">Player</th>
                    <th className="text-center py-2 text-[#022851]">G</th>
                    <th className="text-center py-2 text-[#022851]">A</th>
                    <th className="text-center py-2 text-[#022851]">S</th>
                  </tr>
                </thead>
                <tbody>
                  {ucDavisPlayerStats.map((player) => (
                    <tr key={player.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-900">{player.playerName.split(' ')[0]}</td>
                      <td className="text-center py-2 text-gray-700">{player.goals}</td>
                      <td className="text-center py-2 text-gray-700">{player.assists}</td>
                      <td className="text-center py-2 text-gray-700">{player.steals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Opponent Stats */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Opponent Players</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-[#022851]">Player</th>
                    <th className="text-center py-2 text-[#022851]">G</th>
                    <th className="text-center py-2 text-[#022851]">A</th>
                    <th className="text-center py-2 text-[#022851]">S</th>
                  </tr>
                </thead>
                <tbody>
                  {opponentPlayerStats.map((player) => (
                    <tr key={player.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-900">{player.playerName}</td>
                      <td className="text-center py-2 text-gray-700">{player.goals}</td>
                      <td className="text-center py-2 text-gray-700">{player.assists}</td>
                      <td className="text-center py-2 text-gray-700">{player.steals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Player Edit Modal */}
      {showPlayerEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[#022851] text-2xl">Edit Players</h3>
                <p className="text-gray-600">Set up player names and numbers for the match</p>
              </div>
              <Button
                onClick={() => setShowPlayerEditModal(false)}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                <X size={16} className="mr-1" />
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* UC Davis Players */}
              <div>
                <h4 className="text-[#022851] mb-4 font-semibold flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#FFBF00] rounded"></div>
                  UC Davis Players
                </h4>
                <div className="space-y-3">
                  {editingUcDavisPlayers.map((player, index) => (
                    <div key={player.playerId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20">
                        <input
                          type="number"
                          value={player.jerseyNumber}
                          onChange={(e) => {
                            const newPlayers = [...editingUcDavisPlayers];
                            newPlayers[index].jerseyNumber = parseInt(e.target.value) || 1;
                            setEditingUcDavisPlayers(newPlayers);
                          }}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                          placeholder="#"
                          min="1"
                          max="99"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={player.playerName}
                          onChange={(e) => {
                            const newPlayers = [...editingUcDavisPlayers];
                            newPlayers[index].playerName = e.target.value;
                            setEditingUcDavisPlayers(newPlayers);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                          placeholder="Player Name"
                        />
                      </div>
                      <Badge className="bg-[#022851] text-white">ID: {player.playerId}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent Players */}
              <div>
                <div className="mb-4">
                  <h4 className="text-[#022851] font-semibold flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    Opponent Team
                  </h4>
                  <input
                    type="text"
                    value={opponentTeamName}
                    onChange={(e) => setOpponentTeamName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 mb-3"
                    placeholder="Opponent Team Name"
                  />
                </div>
                <div className="space-y-3">
                  {editingOpponentPlayers.map((player, index) => (
                    <div key={player.playerId} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-20">
                        <input
                          type="number"
                          value={player.jerseyNumber}
                          onChange={(e) => {
                            const newPlayers = [...editingOpponentPlayers];
                            newPlayers[index].jerseyNumber = parseInt(e.target.value) || 1;
                            setEditingOpponentPlayers(newPlayers);
                          }}
                          className="w-full px-2 py-2 border border-red-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="#"
                          min="1"
                          max="99"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={player.playerName}
                          onChange={(e) => {
                            const newPlayers = [...editingOpponentPlayers];
                            newPlayers[index].playerName = e.target.value;
                            setEditingOpponentPlayers(newPlayers);
                          }}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder={`${opponentTeamName} Player ${index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setShowPlayerEditModal(false)}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setUcDavisPlayerStats(editingUcDavisPlayers);
                  setOpponentPlayerStats(editingOpponentPlayers);
                  setShowPlayerEditModal(false);
                  toast.success('Player rosters updated!');
                }}
                className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
              >
                <Save size={16} className="mr-2" />
                Save Players
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Heatmap Modal */}
      {showHeatmapModal && pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#022851] text-2xl">Select Location</h3>
                <p className="text-gray-600">
                  {pendingAction.playerName} ({pendingAction.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}) - {pendingAction.type === 'shot' ? 'Shot Taken' : pendingAction.type === 'goal' ? 'Goal Scored' : 'Assist'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowHeatmapModal(false);
                  setPendingAction(null);
                }}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
            </div>

            {/* Formation Toggle */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="text-gray-700 font-medium">Formation:</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFormation('4-2')}
                  variant={formation === '4-2' ? 'default' : 'outline'}
                  className={formation === '4-2' ? 'bg-[#022851] text-white' : 'border-gray-300'}
                  size="sm"
                >
                  4-2
                  <Badge className="ml-2 bg-white text-[#022851]">
                    {heatmapData[pendingAction.team].filter(s => s.formation === '4-2').length}
                  </Badge>
                </Button>
                <Button
                  onClick={() => setFormation('3-3')}
                  variant={formation === '3-3' ? 'default' : 'outline'}
                  className={formation === '3-3' ? 'bg-[#022851] text-white' : 'border-gray-300'}
                  size="sm"
                >
                  3-3
                  <Badge className="ml-2 bg-white text-[#022851]">
                    {heatmapData[pendingAction.team].filter(s => s.formation === '3-3').length}
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Water Polo Court with Pin Drop */}
            <div className="max-w-3xl mx-auto">
              {/* Opponent Goal */}
              <div className="text-center mb-3">
                <div className="inline-block">
                  <div className="w-48 h-12 bg-white/90 border-4 border-white rounded-t-lg mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="border border-gray-300"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Opponent Goal</div>
                </div>
              </div>

              {/* Pool Court - Interactive Pin Drop */}
              <div 
                className="relative border-4 border-yellow-400 border-dashed rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500 cursor-crosshair"
                style={{ height: '600px' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  handlePinDrop(x, y);
                }}
              >
                {/* Goal Line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/60 border-b-2 border-white pointer-events-none">
                  <span className="absolute right-2 top-0 text-xs text-white font-bold">Goal Line</span>
                </div>

                {/* 2m Line */}
                <div className="absolute left-0 right-0 h-1 bg-red-500 pointer-events-none" style={{ top: '15%' }}>
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">2m</span>
                </div>

                {/* 5m Line */}
                <div className="absolute left-0 right-0 h-1 bg-yellow-400 pointer-events-none" style={{ top: '50%' }}>
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">5m</span>
                </div>

                {/* 7m Line */}
                <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/60 pointer-events-none">
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold">7m</span>
                </div>

                {/* Player Position Markers based on formation */}
                {getPlayerPositions(formation).map((pos, idx) => (
                  <div
                    key={idx}
                    className="absolute w-10 h-10 bg-white/80 border-2 border-[#022851] rounded-full flex items-center justify-center pointer-events-none shadow-lg"
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <span className="text-[#022851] text-sm font-bold">{pos.label}</span>
                  </div>
                ))}

                {/* Hole Marker */}
                <div className="absolute w-16 h-16 bg-orange-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center pointer-events-none"
                  style={{ 
                    left: '50%', 
                    top: '15%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span className="text-white text-xs font-bold">Hole</span>
                </div>

                {/* Existing Shot Pins - filtered by current formation */}
                {heatmapData[pendingAction.team]
                  .filter(shot => shot.formation === formation)
                  .map((shot, idx) => {
                    const pinColor = shot.type === 'goal' ? 'bg-green-500' : shot.type === 'assist' ? 'bg-purple-500' : 'bg-red-500';
                    const arrowColor = shot.type === 'goal' ? '#22c55e' : shot.type === 'assist' ? '#a855f7' : '#ef4444';
                    return (
                      <div
                        key={idx}
                        className="absolute pointer-events-none"
                        style={{ 
                          left: `${shot.x}%`, 
                          top: `${shot.y}%`,
                          transform: 'translate(-50%, -100%)'
                        }}
                      >
                        <div className={`w-6 h-6 rounded-full ${pinColor} border-2 border-white shadow-lg`}></div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto"
                          style={{ borderTopColor: arrowColor }}
                        ></div>
                      </div>
                    );
                  })}
              </div>

              {/* UC Davis Goal */}
              <div className="text-center mt-3">
                <div className="text-xs text-gray-600 mb-1">UC Davis Goal</div>
                <div className="inline-block">
                  <div className="w-48 h-12 bg-gradient-to-b from-[#FFBF00] to-[#ffcc33] border-4 border-[#FFBF00] rounded-b-lg mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="border border-[#022851]/20"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>💡 Click anywhere on the court to drop a pin and record the shot location</strong>
                  </p>
                  <p className="text-xs text-blue-700 text-center">
                    Each shot is saved with the selected formation. Toggle between formations to view shots specific to that setup.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      <span className="text-gray-700">Goal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full"></div>
                      <span className="text-gray-700">Assist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                      <span className="text-gray-700">Shot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Referee Call Modal */}
      {showRefereeCallModal && pendingRefereeCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#022851] text-xl">
                {pendingRefereeCall.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <Button
                onClick={() => {
                  setShowRefereeCallModal(false);
                  setPendingRefereeCall(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X size={20} />
              </Button>
            </div>

            <p className="text-gray-600 mb-4">
              Select a player (optional) or record without a specific player
            </p>

            {/* Quick Record Button */}
            <Button
              onClick={() => addRefereeCall()}
              className="w-full mb-4 bg-gray-600 hover:bg-gray-700 text-white"
            >
              Record Call (No Player)
            </Button>

            {/* Team Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* UC Davis Players */}
              <div>
                <h4 className="text-[#022851] font-semibold mb-2 text-sm">UC Davis</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ucDavisPlayerStats.map((player) => (
                    <Button
                      key={player.playerId}
                      onClick={() => addRefereeCall(player.playerName, 'ucDavis')}
                      variant="outline"
                      className="w-full text-left justify-start text-xs border-[#FFBF00] hover:bg-[#FFBF00]/10"
                    >
                      {player.playerName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Opponent Players */}
              <div>
                <h4 className="text-red-600 font-semibold mb-2 text-sm">Opponent</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {opponentPlayerStats.map((player) => (
                    <Button
                      key={player.playerId}
                      onClick={() => addRefereeCall(player.playerName, 'opponent')}
                      variant="outline"
                      className="w-full text-left justify-start text-xs border-red-600 hover:bg-red-100"
                    >
                      {player.playerName}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubModal && subTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl ${subTeam === 'ucDavis' ? 'text-[#022851]' : 'text-gray-800'}`}>
                <ArrowLeftRight className="inline mr-2" size={24} />
                Player Substitution - {subTeam === 'ucDavis' ? 'UC Davis' : opponentTeamName}
              </h3>
              <Button
                onClick={() => {
                  setShowSubModal(false);
                  setFirstSelectedPlayer(null);
                  setSecondSelectedPlayer(null);
                  setSubTeam(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X size={20} />
              </Button>
            </div>

            <p className="text-gray-600 mb-6">
              Select any two players to swap their positions
            </p>

            {/* Single list showing all players */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <h4 className="font-semibold text-gray-800">All Players</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>In Pool</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>On Bench</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {(subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats)
                  .map((player) => {
                    const isFirstSelected = firstSelectedPlayer === player.playerId;
                    const isSecondSelected = secondSelectedPlayer === player.playerId;
                    const isSelected = isFirstSelected || isSecondSelected;
                    
                    return (
                      <Button
                        key={player.playerId}
                        onClick={() => {
                          if (isFirstSelected) {
                            // Deselect first player
                            setFirstSelectedPlayer(null);
                          } else if (isSecondSelected) {
                            // Deselect second player
                            setSecondSelectedPlayer(null);
                          } else if (!firstSelectedPlayer) {
                            // Select as first player
                            setFirstSelectedPlayer(player.playerId);
                          } else if (!secondSelectedPlayer) {
                            // Select as second player
                            setSecondSelectedPlayer(player.playerId);
                          } else {
                            // Both are selected, replace first selection
                            setFirstSelectedPlayer(player.playerId);
                            setSecondSelectedPlayer(null);
                          }
                        }}
                        variant="outline"
                        className={`w-full text-left justify-start transition-all ${
                          isSelected
                            ? isFirstSelected
                              ? 'bg-blue-100 border-blue-500 text-blue-900'
                              : 'bg-purple-100 border-purple-500 text-purple-900'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${player.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="font-semibold text-sm">#{player.jerseyNumber}</span>
                            <span>{player.playerName}</span>
                            <span className="text-xs text-gray-500">
                              {player.isActive ? '(In Pool)' : '(On Bench)'}
                            </span>
                          </div>
                          {isSelected && (
                            <Badge className={isFirstSelected ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                              {isFirstSelected ? '1st' : '2nd'}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    );
                  })}
              </div>
            </div>

            {/* Swap Preview */}
            {firstSelectedPlayer && secondSelectedPlayer && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Swap Preview:</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <Badge className="bg-blue-500 text-white mb-1">Player 1</Badge>
                    <p className="font-semibold">
                      {(subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats)
                        .find(p => p.playerId === firstSelectedPlayer)?.playerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats)
                        .find(p => p.playerId === firstSelectedPlayer)?.isActive ? 'In Pool' : 'On Bench'}
                    </p>
                  </div>
                  <ArrowLeftRight className="text-gray-400" size={24} />
                  <div className="text-center">
                    <Badge className="bg-purple-500 text-white mb-1">Player 2</Badge>
                    <p className="font-semibold">
                      {(subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats)
                        .find(p => p.playerId === secondSelectedPlayer)?.playerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(subTeam === 'ucDavis' ? ucDavisPlayerStats : opponentPlayerStats)
                        .find(p => p.playerId === secondSelectedPlayer)?.isActive ? 'In Pool' : 'On Bench'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowSubModal(false);
                  setFirstSelectedPlayer(null);
                  setSecondSelectedPlayer(null);
                  setSubTeam(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubstitution}
                disabled={!firstSelectedPlayer || !secondSelectedPlayer}
                className={`flex-1 ${
                  subTeam === 'ucDavis'
                    ? 'bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]'
                    : 'bg-gray-700 hover:bg-gray-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowLeftRight className="mr-2" size={16} />
                Confirm Swap
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}