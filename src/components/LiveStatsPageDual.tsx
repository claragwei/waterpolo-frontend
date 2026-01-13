import { useState, useEffect } from 'react';
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
  ArrowLeftRight
} from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface PlayerStat {
  playerId: number;
  playerName: string;
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
  ucDavis: number[][];
  opponent: number[][];
}

interface HistoryState {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  teamStats: TeamStat;
  plays: Play[];
  currentQuarter: number;
  heatmapData: HeatmapData;
}

interface PossessionEvent {
  id: string;
  team: 'ucDavis' | 'opponent';
  timestamp: number;
  duration: number;
  event: string;
}

export default function LiveStatsPage() {
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [plays, setPlays] = useState<Play[]>([]);
  const [isPossessionActive, setIsPossessionActive] = useState(false);
  const [currentPossessionStart, setCurrentPossessionStart] = useState(0);
  const [currentPossession, setCurrentPossession] = useState<'ucDavis' | 'opponent' | null>(null);
  
  // Undo/Redo state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    ucDavis: [[0, 0], [0, 0], [0, 0]],
    opponent: [[0, 0], [0, 0], [0, 0]]
  });
  
  // Heatmap modal state
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'shot' | 'goal', playerId: number, playerName: string, team: 'ucDavis' | 'opponent' } | null>(null);
  
  // Substitution modal state
  const [showSubModal, setShowSubModal] = useState(false);
  
  // Player editing modal state
  const [showPlayerEditModal, setShowPlayerEditModal] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState('Opponent');
  const [editingUcDavisPlayers, setEditingUcDavisPlayers] = useState<PlayerStat[]>([]);
  const [editingOpponentPlayers, setEditingOpponentPlayers] = useState<PlayerStat[]>([]);
  
  // Possession timeline state
  const [possessionTimeline, setPossessionTimeline] = useState<PossessionEvent[]>([]);
  
  // UC Davis player roster
  const ucDavisPlayers: PlayerStat[] = [
    { playerId: 1, playerName: 'Alex Martinez', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 2, playerName: 'Jake Thompson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 3, playerName: 'Ryan Chen', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 4, playerName: 'Marcus Wilson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 5, playerName: 'David Kim', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 6, playerName: 'Brandon Lee', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 7, playerName: 'Chris Anderson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
  ];

  // Opponent player roster
  const opponentPlayers: PlayerStat[] = [
    { playerId: 101, playerName: 'Opponent #1', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 102, playerName: 'Opponent #2', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 103, playerName: 'Opponent #3', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 104, playerName: 'Opponent #4', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 105, playerName: 'Opponent #5', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 106, playerName: 'Opponent #6', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
    { playerId: 107, playerName: 'Opponent #7', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0, isActive: true },
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

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        ucDavisPlayerStats: JSON.parse(JSON.stringify(ucDavisPlayerStats)),
        opponentPlayerStats: JSON.parse(JSON.stringify(opponentPlayerStats)),
        teamStats: JSON.parse(JSON.stringify(teamStats)),
        plays: JSON.parse(JSON.stringify(plays)),
        currentQuarter,
        heatmapData: JSON.parse(JSON.stringify(heatmapData))
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
    newHeatmapData: HeatmapData
  ) => {
    const newState: HistoryState = {
      ucDavisPlayerStats: JSON.parse(JSON.stringify(newUcDavisStats)),
      opponentPlayerStats: JSON.parse(JSON.stringify(newOpponentStats)),
      teamStats: JSON.parse(JSON.stringify(newTeamStats)),
      plays: JSON.parse(JSON.stringify(newPlays)),
      currentQuarter: newQuarter,
      heatmapData: JSON.parse(JSON.stringify(newHeatmapData))
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

  const handleStartGame = () => {
    setIsGameActive(true);
    setIsPaused(false);
    toast.success('Game started! Good luck Aggies!');
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
      ucDavis: [[0, 0], [0, 0], [0, 0]],
      opponent: [[0, 0], [0, 0], [0, 0]]
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

  const updatePlayerStat = (playerId: number, stat: keyof Omit<PlayerStat, 'playerId' | 'playerName' | 'isActive'>, increment: number = 1) => {
    const team = currentPossession === 'opponent' ? 'opponent' : 'ucDavis';
    
    if (team === 'opponent') {
      const newPlayerStats = opponentPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, [stat]: Math.max(0, p[stat as keyof PlayerStat] as number + increment) }
          : p
      );
      setOpponentPlayerStats(newPlayerStats);
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, [stat]: Math.max(0, p[stat as keyof PlayerStat] as number + increment) }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData);
    }

    const player = activePlayerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.success(`${player.playerName} - ${stat} ${increment > 0 ? 'added' : 'removed'}`);
    }
  };

  const updateTeamStat = (stat: keyof TeamStat, increment: number = 1) => {
    const newTeamStats = {
      ...teamStats,
      [stat]: Math.max(0, teamStats[stat] + increment)
    };
    setTeamStats(newTeamStats);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, newTeamStats, plays, currentQuarter, heatmapData);
    toast.success(`Team ${stat} ${increment > 0 ? 'incremented' : 'decremented'}`);
  };

  const updateQuarter = (newQuarter: number) => {
    setCurrentQuarter(newQuarter);
    saveToHistory(ucDavisPlayerStats, opponentPlayerStats, teamStats, plays, newQuarter, heatmapData);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive && !isPaused) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGameActive, isPaused]);

  useEffect(() => {
    let possessionInterval: NodeJS.Timeout | null = null;
    if (isPossessionActive && currentPossession) {
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
  }, [isPossessionActive, currentPossession]);

  // Handle turnover - switch possession
  const handleTurnover = (playerId: number) => {
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
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, turnovers: p.turnovers + 1 }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData);
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
      toast.info(`${newPossession === 'ucDavis' ? 'UC Davis' : 'Opponent'} possession started`);
    }, 500);
  };

  // Handle steal - switch possession
  const handleSteal = (playerId: number) => {
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
      saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, heatmapData);
    } else {
      const newPlayerStats = ucDavisPlayerStats.map(p => 
        p.playerId === playerId 
          ? { ...p, steals: p.steals + 1 }
          : p
      );
      setUcDavisPlayerStats(newPlayerStats);
      saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, heatmapData);
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

  // Handle zone selection in heatmap modal
  const handleZoneSelect = (row: number, col: number) => {
    if (!pendingAction) return;

    const { type, playerId, playerName, team } = pendingAction;

    // Update heatmap data
    const newHeatmapData = { ...heatmapData };
    newHeatmapData[team][row][col] += 1;

    // Update player stats
    if (type === 'shot') {
      if (team === 'opponent') {
        const newPlayerStats = opponentPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p
        );
        setOpponentPlayerStats(newPlayerStats);
        saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, newHeatmapData);
      } else {
        const newPlayerStats = ucDavisPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, shots: p.shots + 1 } : p
        );
        setUcDavisPlayerStats(newPlayerStats);
        saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData);
      }
      toast.success(`${playerName} - Shot from ${getPositionName(row, col)}`);
    } else if (type === 'goal') {
      if (team === 'opponent') {
        const newPlayerStats = opponentPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p
        );
        setOpponentPlayerStats(newPlayerStats);
        saveToHistory(ucDavisPlayerStats, newPlayerStats, teamStats, plays, currentQuarter, newHeatmapData);
      } else {
        const newPlayerStats = ucDavisPlayerStats.map(p => 
          p.playerId === playerId ? { ...p, goals: p.goals + 1, shots: p.shots + 1 } : p
        );
        setUcDavisPlayerStats(newPlayerStats);
        saveToHistory(newPlayerStats, opponentPlayerStats, teamStats, plays, currentQuarter, newHeatmapData);
      }
      toast.success(`${playerName} - GOAL from ${getPositionName(row, col)}!`);
      
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
    }

    setHeatmapData(newHeatmapData);

    // Close modal
    setShowHeatmapModal(false);
    setPendingAction(null);
  };

  const getPositionName = (row: number, col: number) => {
    const positions = [
      ['Left Wing', 'Right Wing'],
      ['Left Flat', 'Right Flat'],
      ['Point', 'Point']
    ];
    return positions[row][col];
  };

  const getZoneLabel = (row: number, col: number) => {
    const zones = [
      ['① Left Wing', '③ Right Wing'],
      ['② Left Flat', '④ Right Flat'],
      ['⑤ Point', '⑤ Point']
    ];
    return zones[row][col];
  };

  const getHeatmapIntensity = (value: number, team: 'ucDavis' | 'opponent') => {
    if (value === 0) return 'bg-blue-400/40';
    if (team === 'ucDavis') {
      if (value === 1) return 'bg-yellow-200/70';
      if (value === 2) return 'bg-yellow-300/80';
      if (value === 3) return 'bg-yellow-400/90';
      if (value >= 4) return 'bg-yellow-500';
    } else {
      if (value === 1) return 'bg-red-200/70';
      if (value === 2) return 'bg-red-300/80';
      if (value === 3) return 'bg-red-400/90';
      if (value >= 4) return 'bg-red-500';
    }
    return 'bg-blue-400/40';
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
                <Button 
                  onClick={handlePauseGame}
                  className="bg-[#022851] text-white hover:bg-[#022851]/90"
                >
                  {isPaused ? <Play size={16} className="mr-2" /> : <Pause size={16} className="mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
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
                <span className="text-2xl">{formatTime(gameTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <span className="text-xl">Quarter {currentQuarter}</span>
              </div>
              <Badge className={`${isGameActive ? (isPaused ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-500'} text-white`}>
                {isGameActive ? (isPaused ? 'PAUSED' : 'LIVE') : 'NOT STARTED'}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#022851]">Select Player - {activeTeamName}</h3>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {activePlayerStats.map((player) => (
              <div key={player.playerId} className="relative">
                <Button
                  onClick={() => {
                    setSelectedPlayer(player.playerId);
                    toast.success(`Tracking ${player.playerName}`);
                  }}
                  className={`w-full h-20 flex flex-col items-center justify-center transition-all ${
                    selectedPlayer === player.playerId
                      ? currentPossession === 'ucDavis'
                        ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                        : 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800 shadow-lg'
                      : player.isActive
                      ? 'bg-green-100 text-gray-700 hover:bg-green-200 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1">{getPlayerInitials(player.playerName)}</div>
                  <div className="text-xs opacity-80">{player.playerName.split(' ')[0]}</div>
                </Button>
                {player.isActive && (
                  <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1">
                    IN
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>In Pool</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>On Bench</span>
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
                  onClick={() => updatePlayerStat(selectedPlayer, 'assists')}
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
          </>
        )}

        {/* Team Situations & Possession Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <Badge className="bg-[#022851] text-white">{player.playerId}</Badge>
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
                          type="text"
                          value={player.playerId - 100}
                          onChange={(e) => {
                            const newPlayers = [...editingOpponentPlayers];
                            const newNumber = parseInt(e.target.value) || 1;
                            newPlayers[index].playerId = 100 + newNumber;
                            setEditingOpponentPlayers(newPlayers);
                          }}
                          className="w-full px-2 py-2 border border-red-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="#"
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
                <h3 className="text-[#022851] text-2xl">Select Shot Location</h3>
                <p className="text-gray-600">
                  {pendingAction.playerName} ({pendingAction.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}) - {pendingAction.type === 'shot' ? 'Shot Taken' : 'Goal Scored'}
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

            {/* Water Polo Court Heatmap */}
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

              {/* Pool Court */}
              <div className="relative border-4 border-yellow-400 border-dashed rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500">
                {/* Goal Line */}
                <div className="relative h-2 bg-white/60 border-b-2 border-white">
                  <span className="absolute right-2 top-0 text-xs text-white font-bold">Goal Line</span>
                </div>
                
                {/* Row 1: Wings */}
                <div className="grid grid-cols-2 gap-0 border-b-4 border-red-500">
                  {heatmapData[pendingAction.team][0].map((value, colIndex) => (
                    <button
                      key={colIndex}
                      onClick={() => handleZoneSelect(0, colIndex)}
                      className={`
                        relative h-36 
                        ${getHeatmapIntensity(value, pendingAction.team)}
                        hover:scale-105 hover:shadow-2xl transition-all duration-200
                        flex flex-col items-center justify-center
                        cursor-pointer border-r ${colIndex === 0 ? 'border-r-white/30' : ''}
                      `}
                    >
                      <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                        {getZoneLabel(0, colIndex)}
                      </div>
                      <div className="text-5xl text-white font-bold drop-shadow-lg">{value}</div>
                    </button>
                  ))}
                </div>

                {/* 2m Line */}
                <div className="relative h-1 bg-red-500">
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">2m</span>
                </div>

                {/* Hole Marker */}
                <div className="absolute left-1/2 top-[85px] transform -translate-x-1/2 z-10 pointer-events-none">
                  <div className="w-16 h-16 bg-orange-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Hole</span>
                  </div>
                </div>

                {/* Row 2: Flats */}
                <div className="grid grid-cols-2 gap-0 border-b-4 border-yellow-400">
                  {heatmapData[pendingAction.team][1].map((value, colIndex) => (
                    <button
                      key={colIndex}
                      onClick={() => handleZoneSelect(1, colIndex)}
                      className={`
                        relative h-36
                        ${getHeatmapIntensity(value, pendingAction.team)}
                        hover:scale-105 hover:shadow-2xl transition-all duration-200
                        flex flex-col items-center justify-center
                        cursor-pointer border-r ${colIndex === 0 ? 'border-r-white/30' : ''}
                      `}
                    >
                      <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                        {getZoneLabel(1, colIndex)}
                      </div>
                      <div className="text-5xl text-white font-bold drop-shadow-lg">{value}</div>
                    </button>
                  ))}
                </div>

                {/* 5m Line */}
                <div className="relative h-1 bg-yellow-400">
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">5m</span>
                </div>

                {/* Row 3: Point */}
                <div className="grid grid-cols-1 gap-0 border-b-2 border-white/60">
                  <button
                    onClick={() => handleZoneSelect(2, 0)}
                    className={`
                      relative h-40
                      ${getHeatmapIntensity(heatmapData[pendingAction.team][2][0], pendingAction.team)}
                      hover:scale-105 hover:shadow-2xl transition-all duration-200
                      flex flex-col items-center justify-center
                      cursor-pointer
                    `}
                  >
                    <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                      {getZoneLabel(2, 0)}
                    </div>
                    <div className="text-5xl text-white font-bold drop-shadow-lg">
                      {heatmapData[pendingAction.team][2][0] + heatmapData[pendingAction.team][2][1]}
                    </div>
                  </button>
                </div>

                {/* 7m Line */}
                <div className="relative h-2 bg-white/60">
                  <span className="absolute right-2 top-0 text-xs text-white font-bold">7m</span>
                </div>
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
                <p className="text-sm text-blue-800 text-center">
                  <strong>💡 Click a zone on the court to record the shot location</strong>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}