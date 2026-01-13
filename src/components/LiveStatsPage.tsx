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
  Redo
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
}

interface TeamStat {
  FCO: number; // Front Court Offense
  FCD: number; // Front Court Defense
  CAO: number; // Counter Attack Offense
  CAD: number; // Counter Attack Defense
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
}

interface HeatmapData {
  ucDavis: number[][];
  opponent: number[][];
}

interface HistoryState {
  playerStats: PlayerStat[];
  teamStats: TeamStat;
  plays: Play[];
  currentQuarter: number;
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

  // Heatmap state - 2x3 grid (2 columns, 3 rows)
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    ucDavis: [[0, 0], [0, 0], [0, 0]],
    opponent: [[0, 0], [0, 0], [0, 0]]
  });
  const [heatmapTeam, setHeatmapTeam] = useState<'ucDavis' | 'opponent'>('ucDavis');
  const [heatmapPlayer, setHeatmapPlayer] = useState<string>('');
  
  // Heatmap modal state
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'shot' | 'goal', playerId: number, playerName: string } | null>(null);
  
  // Mock player roster
  const players: PlayerStat[] = [
    { playerId: 1, playerName: 'Alex Martinez', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 2, playerName: 'Jake Thompson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 3, playerName: 'Ryan Chen', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 4, playerName: 'Marcus Wilson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 5, playerName: 'David Kim', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 6, playerName: 'Brandon Lee', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
    { playerId: 7, playerName: 'Chris Anderson', shots: 0, goals: 0, penalties: 0, turnovers: 0, rebounds: 0, assists: 0, blocks: 0, tippedPasses: 0, sprints: 0, steals: 0, hustle: 0, exclusions: 0, draws: 0 },
  ];

  const [playerStats, setPlayerStats] = useState<PlayerStat[]>(players);
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

  // Initialize history with current state on mount
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        playerStats: JSON.parse(JSON.stringify(playerStats)),
        teamStats: JSON.parse(JSON.stringify(teamStats)),
        plays: JSON.parse(JSON.stringify(plays)),
        currentQuarter
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Save state to history
  const saveToHistory = (newPlayerStats: PlayerStat[], newTeamStats: TeamStat, newPlays: Play[], newQuarter: number) => {
    const newState: HistoryState = {
      playerStats: JSON.parse(JSON.stringify(newPlayerStats)),
      teamStats: JSON.parse(JSON.stringify(newTeamStats)),
      plays: JSON.parse(JSON.stringify(newPlays)),
      currentQuarter: newQuarter
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    // Limit history to last 50 states
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
      setPlayerStats(JSON.parse(JSON.stringify(previousState.playerStats)));
      setTeamStats(JSON.parse(JSON.stringify(previousState.teamStats)));
      setPlays(JSON.parse(JSON.stringify(previousState.plays)));
      setCurrentQuarter(previousState.currentQuarter);
      setHistoryIndex(historyIndex - 1);
      toast.info('Action undone');
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPlayerStats(JSON.parse(JSON.stringify(nextState.playerStats)));
      setTeamStats(JSON.parse(JSON.stringify(nextState.teamStats)));
      setPlays(JSON.parse(JSON.stringify(nextState.plays)));
      setCurrentQuarter(nextState.currentQuarter);
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
    setPlayerStats(players);
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
    toast.success('Game stats reset');
  };

  const handleSaveGame = () => {
    toast.success('Game stats saved successfully!');
    console.log('Player Stats:', playerStats);
    console.log('Team Stats:', teamStats);
    console.log('Plays:', plays);
  };

  const updatePlayerStat = (playerId: number, stat: keyof Omit<PlayerStat, 'playerId' | 'playerName'>, increment: number = 1) => {
    const newPlayerStats = playerStats.map(p => 
      p.playerId === playerId 
        ? { ...p, [stat]: Math.max(0, p[stat] + increment) }
        : p
    );
    setPlayerStats(newPlayerStats);
    saveToHistory(newPlayerStats, teamStats, plays, currentQuarter);
    const player = playerStats.find(p => p.playerId === playerId);
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
    saveToHistory(playerStats, newTeamStats, plays, currentQuarter);
    toast.success(`Team ${stat} ${increment > 0 ? 'incremented' : 'decremented'}`);
  };

  const updateQuarter = (newQuarter: number) => {
    setCurrentQuarter(newQuarter);
    saveToHistory(playerStats, teamStats, plays, newQuarter);
  };

  const addPlay = (name: string, success: boolean) => {
    const newPlay: Play = {
      id: Date.now().toString(),
      name,
      timestamp: formatTime(gameTime),
      success
    };
    const newPlays = [newPlay, ...plays];
    setPlays(newPlays);
    saveToHistory(playerStats, teamStats, newPlays, currentQuarter);
    toast.success(`Play "${name}" logged as ${success ? 'successful' : 'unsuccessful'}`);
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
    // Stop current possession and save time
    if (isPossessionActive) {
      setIsPossessionActive(false);
      const currentTime = currentPossession === 'ucDavis' 
        ? teamStats.possessionTimeUCDavis 
        : teamStats.possessionTimeOpponent;
      const duration = currentTime - currentPossessionStart;
      toast.info(`Possession ended: ${duration}s - Switching possession`);
    }

    // Update player stats
    const newPlayerStats = playerStats.map(p => 
      p.playerId === playerId 
        ? { ...p, turnovers: p.turnovers + 1 }
        : p
    );
    
    // Switch possession to opponent
    setPlayerStats(newPlayerStats);
    saveToHistory(newPlayerStats, teamStats, plays, currentQuarter);
    
    const player = playerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.error(`${player.playerName} - Turnover`);
    }
    
    // Auto-start opponent possession
    setTimeout(() => {
      setCurrentPossession('opponent');
      setCurrentPossessionStart(teamStats.possessionTimeOpponent);
      setIsPossessionActive(true);
      toast.info('Opponent possession started');
    }, 500);
  };

  // Handle steal - switch possession to UC Davis
  const handleSteal = (playerId: number) => {
    // Stop current possession and save time
    if (isPossessionActive) {
      setIsPossessionActive(false);
      const currentTime = currentPossession === 'ucDavis' 
        ? teamStats.possessionTimeUCDavis 
        : teamStats.possessionTimeOpponent;
      const duration = currentTime - currentPossessionStart;
      toast.info(`Possession ended: ${duration}s - Switching possession`);
    }

    // Update player stats
    const newPlayerStats = playerStats.map(p => 
      p.playerId === playerId 
        ? { ...p, steals: p.steals + 1 }
        : p
    );
    
    // Switch possession to UC Davis
    setPlayerStats(newPlayerStats);
    saveToHistory(newPlayerStats, teamStats, plays, currentQuarter);
    
    const player = playerStats.find(p => p.playerId === playerId);
    if (player) {
      toast.success(`${player.playerName} - Steal!`);
    }
    
    // Auto-start UC Davis possession
    setTimeout(() => {
      setCurrentPossession('ucDavis');
      setCurrentPossessionStart(teamStats.possessionTimeUCDavis);
      setIsPossessionActive(true);
      toast.success('UC Davis possession started');
    }, 500);
  };

  // Handle goal scored - switch possession to opponent (restart)
  const handleGoalScored = (playerId: number) => {
    // Stop current possession and save time
    if (isPossessionActive) {
      setIsPossessionActive(false);
      const currentTime = currentPossession === 'ucDavis' 
        ? teamStats.possessionTimeUCDavis 
        : teamStats.possessionTimeOpponent;
      const duration = currentTime - currentPossessionStart;
      toast.info(`Possession ended: ${duration}s`);
    }

    // Update player stats - increment both goals and shots
    const newPlayerStats = playerStats.map(p => 
      p.playerId === playerId 
        ? { ...p, goals: p.goals + 1, shots: p.shots + 1 }
        : p
    );
    
    setPlayerStats(newPlayerStats);
    saveToHistory(newPlayerStats, teamStats, plays, currentQuarter);
    toast.success('Goal scored!');
    
    // Auto-start opponent possession (they restart)
    setTimeout(() => {
      setCurrentPossession('opponent');
      setCurrentPossessionStart(teamStats.possessionTimeOpponent);
      setIsPossessionActive(true);
      toast.info('Opponent possession started (restart)');
    }, 500);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Heatmap functions
  const handleHeatmapClick = (row: number, col: number) => {
    if (!heatmapPlayer) {
      toast.error('Please select a player first');
      return;
    }

    const newHeatmapData = { ...heatmapData };
    newHeatmapData[heatmapTeam][row][col] += 1;
    setHeatmapData(newHeatmapData);
    toast.success(`Goal recorded for ${heatmapPlayer} in zone ${row + 1}-${col + 1}`);
  };

  const getHeatmapIntensity = (value: number) => {
    if (value === 0) return 'bg-blue-400/40';
    if (value === 1) return heatmapTeam === 'ucDavis' ? 'bg-yellow-200/70' : 'bg-red-200/70';
    if (value === 2) return heatmapTeam === 'ucDavis' ? 'bg-yellow-300/80' : 'bg-red-300/80';
    if (value === 3) return heatmapTeam === 'ucDavis' ? 'bg-yellow-400/90' : 'bg-red-400/90';
    if (value >= 4) return heatmapTeam === 'ucDavis' ? 'bg-yellow-500' : 'bg-red-500';
    return 'bg-blue-400/40';
  };

  const getZoneLabel = (row: number, col: number) => {
    // 2x3 grid: Row 0 (near goal), Row 1 (mid), Row 2 (point)
    const zones = [
      ['① Left Wing', '③ Right Wing'],
      ['② Left Flat', '④ Right Flat'],
      ['⑤ Point', '⑤ Point']
    ];
    return zones[row][col];
  };

  const getPositionName = (row: number, col: number) => {
    const positions = [
      ['Left Wing', 'Right Wing'],
      ['Left Flat', 'Right Flat'],
      ['Point', 'Point']
    ];
    return positions[row][col];
  };

  const resetHeatmap = () => {
    setHeatmapData({
      ucDavis: [[0, 0], [0, 0], [0, 0]],
      opponent: [[0, 0], [0, 0], [0, 0]]
    });
    toast.success('Heatmap data reset');
  };

  const opponentPlayers = [
    'Opponent #1',
    'Opponent #2',
    'Opponent #3',
    'Opponent #4',
    'Opponent #5',
    'Opponent #6',
    'Opponent #7',
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[#022851] mb-2">Live Stats Input</h1>
            <p className="text-gray-600">Track real-time game statistics for UC Davis Water Polo</p>
          </div>
          
          {/* Game Controls */}
          <div className="flex items-center gap-4">
            {/* Undo/Redo Buttons */}
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
              <Button 
                onClick={handleStartGame}
                className="bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90"
              >
                <Play size={16} className="mr-2" />
                Start Game
              </Button>
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

      <Tabs defaultValue="player" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="player" className="data-[state=active]:bg-[#FFBF00] data-[state=active]:text-[#022851]">
            Player Stats
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[#FFBF00] data-[state=active]:text-[#022851]">
            Team Stats
          </TabsTrigger>
          <TabsTrigger value="plays" className="data-[state=active]:bg-[#FFBF00] data-[state=active]:text-[#022851]">
            Plays & Timeline
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-[#FFBF00] data-[state=active]:text-[#022851]">
            Heatmap
          </TabsTrigger>
        </TabsList>

        {/* Player Stats Tab */}
        <TabsContent value="player" className="space-y-6">
          {/* Player Selection */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Select Player</h3>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {playerStats.map((player) => (
                <Button
                  key={player.playerId}
                  onClick={() => {
                    setSelectedPlayer(player.playerId);
                    toast.success(`Tracking ${player.playerName}`);
                  }}
                  className={`h-20 flex flex-col items-center justify-center transition-all ${
                    selectedPlayer === player.playerId
                      ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{getPlayerInitials(player.playerName)}</div>
                  <div className="text-xs opacity-80">{player.playerName.split(' ')[0]}</div>
                </Button>
              ))}
            </div>
          </Card>

          {selectedPlayer && (
            <>
              {/* Current Player Stats Display */}
              <Card className="p-6 bg-gradient-to-r from-[#FFBF00] to-[#ffcc33] border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[#022851] text-2xl">
                      {playerStats.find(p => p.playerId === selectedPlayer)?.playerName}
                    </h3>
                    <p className="text-[#022851]/70">Currently tracking</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-3xl text-[#022851]">
                        {playerStats.find(p => p.playerId === selectedPlayer)?.goals || 0}
                      </div>
                      <div className="text-sm text-[#022851]/70">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl text-[#022851]">
                        {playerStats.find(p => p.playerId === selectedPlayer)?.assists || 0}
                      </div>
                      <div className="text-sm text-[#022851]/70">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl text-[#022851]">
                        {playerStats.find(p => p.playerId === selectedPlayer)?.steals || 0}
                      </div>
                      <div className="text-sm text-[#022851]/70">Steals</div>
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
                    onClick={() => updatePlayerStat(selectedPlayer, 'shots')}
                    className="bg-blue-500 hover:bg-blue-600 text-white h-20 flex flex-col items-center justify-center"
                  >
                    <Target size={24} className="mb-1" />
                    Shot Taken
                  </Button>
                  <Button
                    onClick={() => handleGoalScored(selectedPlayer)}
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
                    className="bg-red-500 hover:bg-red-600 text-white h-20 flex flex-col items-center justify-center"
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'blocks')}
                    className="bg-[#022851] hover:bg-[#033a70] text-white h-20 flex flex-col items-center justify-center"
                  >
                    <Shield size={24} className="mb-1" />
                    Block
                  </Button>
                  <Button
                    onClick={() => handleSteal(selectedPlayer)}
                    className="bg-[#022851] hover:bg-[#033a70] text-white h-20 flex flex-col items-center justify-center"
                  >
                    <Zap size={24} className="mb-1" />
                    Steal
                  </Button>
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'tippedPasses')}
                    className="bg-[#022851] hover:bg-[#033a70] text-white h-20 flex flex-col items-center justify-center"
                  >
                    <Activity size={24} className="mb-1" />
                    Tipped Pass
                  </Button>
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'draws')}
                    className="bg-[#022851] hover:bg-[#033a70] text-white h-20 flex flex-col items-center justify-center"
                  >
                    <AlertTriangle size={24} className="mb-1" />
                    Drew Exclusion
                  </Button>
                </div>
              </Card>

              {/* Physical & Hustle */}
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-[#022851] mb-4 flex items-center gap-2">
                  <Zap size={20} />
                  Hustle & Physicality
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'sprints')}
                    className="bg-[#FFBF00] hover:bg-[#ffcc33] text-[#022851] h-20 flex flex-col items-center justify-center"
                  >
                    <Zap size={24} className="mb-1" />
                    Sprint
                  </Button>
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'hustle')}
                    className="bg-[#FFBF00] hover:bg-[#ffcc33] text-[#022851] h-20 flex flex-col items-center justify-center"
                  >
                    <Activity size={24} className="mb-1" />
                    Hustle Play
                  </Button>
                  <Button
                    onClick={() => updatePlayerStat(selectedPlayer, 'exclusions')}
                    className="bg-red-600 hover:bg-red-700 text-white h-20 flex flex-col items-center justify-center"
                  >
                    <XCircle size={24} className="mb-1" />
                    Exclusion
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* All Players Stats Summary */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">All Players Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-[#022851]">Player</th>
                    <th className="text-center py-2 text-[#022851]">Goals</th>
                    <th className="text-center py-2 text-[#022851]">Assists</th>
                    <th className="text-center py-2 text-[#022851]">Steals</th>
                    <th className="text-center py-2 text-[#022851]">Blocks</th>
                    <th className="text-center py-2 text-[#022851]">Exclusions</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((player) => (
                    <tr key={player.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900">{player.playerName}</td>
                      <td className="text-center py-3 text-gray-700">{player.goals}</td>
                      <td className="text-center py-3 text-gray-700">{player.assists}</td>
                      <td className="text-center py-3 text-gray-700">{player.steals}</td>
                      <td className="text-center py-3 text-gray-700">{player.blocks}</td>
                      <td className="text-center py-3 text-gray-700">{player.exclusions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Team Stats Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Game Situations */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Game Situations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.FCO}</div>
                <div className="text-sm text-gray-600 mb-2">Front Court Offense</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('FCO')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('FCO', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.FCD}</div>
                <div className="text-sm text-gray-600 mb-2">Front Court Defense</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('FCD')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('FCD', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.CAO}</div>
                <div className="text-sm text-gray-600 mb-2">Counter Attack Offense</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('CAO')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('CAO', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.CAD}</div>
                <div className="text-sm text-gray-600 mb-2">Counter Attack Defense</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('CAD')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('CAD', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.AG}</div>
                <div className="text-sm text-gray-600 mb-2">AG</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('AG')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('AG', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.AGD}</div>
                <div className="text-sm text-gray-600 mb-2">AGD</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('AGD')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('AGD', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Power Play Situations */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Power Play Situations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.sixOnFive}</div>
                <div className="text-sm text-gray-600 mb-2">6 on 5</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('sixOnFive')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('sixOnFive', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.fiveOnSix}</div>
                <div className="text-sm text-gray-600 mb-2">5 on 6</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('fiveOnSix')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('fiveOnSix', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.sevenOnSix}</div>
                <div className="text-sm text-gray-600 mb-2">7 on 6</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('sevenOnSix')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('sevenOnSix', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl text-[#022851] mb-1">{teamStats.sixOnSeven}</div>
                <div className="text-sm text-gray-600 mb-2">6 on 7</div>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" onClick={() => updateTeamStat('sixOnSeven')} className="bg-[#FFBF00] text-[#022851] hover:bg-[#ffcc33]">
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" onClick={() => updateTeamStat('sixOnSeven', -1)} variant="outline">
                    <Minus size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Possession Time */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Possession Time Tracker</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* UC Davis Possession */}
              <div className={`text-center p-6 rounded-lg ${currentPossession === 'ucDavis' && isPossessionActive ? 'bg-gradient-to-r from-[#FFBF00] to-[#ffcc33]' : 'bg-gradient-to-r from-[#022851] to-[#033a70]'} text-white relative`}>
                {currentPossession === 'ucDavis' && isPossessionActive && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
                <div className="text-4xl mb-2">{teamStats.possessionTimeUCDavis}s</div>
                <div className="text-sm mb-4">UC Davis</div>
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (isPossessionActive && currentPossession === 'ucDavis') {
                      setIsPossessionActive(false);
                      const duration = teamStats.possessionTimeUCDavis - currentPossessionStart;
                      toast.info(`UC Davis possession ended: ${duration}s`);
                      setCurrentPossession(null);
                    } else {
                      if (isPossessionActive && currentPossession === 'opponent') {
                        setIsPossessionActive(false);
                        const duration = teamStats.possessionTimeOpponent - currentPossessionStart;
                        toast.info(`Opponent possession ended: ${duration}s`);
                      }
                      setCurrentPossession('ucDavis');
                      setCurrentPossessionStart(teamStats.possessionTimeUCDavis);
                      setIsPossessionActive(true);
                      toast.success('UC Davis possession started');
                    }
                  }}
                  className={currentPossession === 'ucDavis' && isPossessionActive ? "bg-red-600 text-white hover:bg-red-700 w-full" : "bg-green-600 text-white hover:bg-green-700 w-full"}
                >
                  {currentPossession === 'ucDavis' && isPossessionActive ? (
                    <><Pause size={18} className="mr-2" />Stop</>
                  ) : (
                    <><Play size={18} className="mr-2" />Start</>
                  )}
                </Button>
              </div>

              {/* Opponent Possession */}
              <div className={`text-center p-6 rounded-lg ${currentPossession === 'opponent' && isPossessionActive ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'} text-white relative`}>
                {currentPossession === 'opponent' && isPossessionActive && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
                <div className="text-4xl mb-2">{teamStats.possessionTimeOpponent}s</div>
                <div className="text-sm mb-4">Opponent</div>
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (isPossessionActive && currentPossession === 'opponent') {
                      setIsPossessionActive(false);
                      const duration = teamStats.possessionTimeOpponent - currentPossessionStart;
                      toast.info(`Opponent possession ended: ${duration}s`);
                      setCurrentPossession(null);
                    } else {
                      if (isPossessionActive && currentPossession === 'ucDavis') {
                        setIsPossessionActive(false);
                        const duration = teamStats.possessionTimeUCDavis - currentPossessionStart;
                        toast.info(`UC Davis possession ended: ${duration}s`);
                      }
                      setCurrentPossession('opponent');
                      setCurrentPossessionStart(teamStats.possessionTimeOpponent);
                      setIsPossessionActive(true);
                      toast.success('Opponent possession started');
                    }
                  }}
                  className={currentPossession === 'opponent' && isPossessionActive ? "bg-red-800 text-white hover:bg-red-900 w-full" : "bg-green-600 text-white hover:bg-green-700 w-full"}
                >
                  {currentPossession === 'opponent' && isPossessionActive ? (
                    <><Pause size={18} className="mr-2" />Stop</>
                  ) : (
                    <><Play size={18} className="mr-2" />Start</>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <Button 
                size="sm" 
                onClick={() => {
                  const newTeamStats = { ...teamStats, possessionTimeUCDavis: 0, possessionTimeOpponent: 0 };
                  setTeamStats(newTeamStats);
                  saveToHistory(playerStats, newTeamStats, plays, currentQuarter);
                  setIsPossessionActive(false);
                  setCurrentPossession(null);
                  toast.success('All possession times reset');
                }}
                variant="outline"
                className="border-gray-300"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset All
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Plays & Timeline Tab */}
        <TabsContent value="plays" className="space-y-6">
          {/* Add Play */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Log Custom Play</h3>
            <div className="flex gap-3">
              <Button
                onClick={() => addPlay('Quick Counter', true)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                Quick Counter (Success)
              </Button>
              <Button
                onClick={() => addPlay('Quick Counter', false)}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50 flex-1"
              >
                Quick Counter (Failed)
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Button
                onClick={() => addPlay('Set Play', true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Set Play (Success)
              </Button>
              <Button
                onClick={() => addPlay('Set Play', false)}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Set Play (Failed)
              </Button>
              <Button
                onClick={() => addPlay('Power Play', true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Power Play (Success)
              </Button>
              <Button
                onClick={() => addPlay('Power Play', false)}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Power Play (Failed)
              </Button>
            </div>
          </Card>

          {/* Plays Timeline */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Game Timeline</h3>
            {plays.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>No plays logged yet. Start tracking plays during the game!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {plays.map((play) => (
                  <div 
                    key={play.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      play.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded text-sm ${
                        play.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {play.timestamp}
                      </div>
                      <div>
                        <div className="text-[#022851]">{play.name}</div>
                        <div className={`text-sm ${play.success ? 'text-green-600' : 'text-red-600'}`}>
                          {play.success ? 'Successful' : 'Unsuccessful'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-6">
          {/* Team Selection */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Select Team</h3>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setHeatmapTeam('ucDavis');
                  setHeatmapPlayer('');
                  toast.success('Tracking UC Davis shots');
                }}
                className={`flex-1 h-16 ${
                  heatmapTeam === 'ucDavis'
                    ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl">UC Davis Aggies</div>
                  <div className="text-xs opacity-70">Home Team</div>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setHeatmapTeam('opponent');
                  setHeatmapPlayer('');
                  toast.success('Tracking opponent shots');
                }}
                className={`flex-1 h-16 ${
                  heatmapTeam === 'opponent'
                    ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl">Opponent</div>
                  <div className="text-xs opacity-70">Away Team</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Player Selection */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Select Player</h3>
            {heatmapTeam === 'ucDavis' ? (
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {playerStats.map((player) => (
                  <Button
                    key={player.playerId}
                    onClick={() => {
                      setHeatmapPlayer(player.playerName);
                      toast.success(`Tracking ${player.playerName}`);
                    }}
                    className={`h-20 flex flex-col items-center justify-center transition-all ${
                      heatmapPlayer === player.playerName
                        ? 'bg-[#FFBF00] text-[#022851] hover:bg-[#FFBF00]/90 ring-2 ring-[#022851] shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{getPlayerInitials(player.playerName)}</div>
                    <div className="text-xs opacity-80">{player.playerName.split(' ')[0]}</div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {opponentPlayers.map((player, idx) => (
                  <Button
                    key={idx}
                    onClick={() => {
                      setHeatmapPlayer(player);
                      toast.success(`Tracking ${player}`);
                    }}
                    className={`h-20 flex flex-col items-center justify-center transition-all ${
                      heatmapPlayer === player
                        ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-800 shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">#{idx + 1}</div>
                    <div className="text-xs opacity-80">Opponent</div>
                  </Button>
                ))}
              </div>
            )}
            {heatmapPlayer && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tracking:</strong> {heatmapPlayer} ({heatmapTeam === 'ucDavis' ? 'UC Davis' : 'Opponent'})
                </p>
              </div>
            )}
          </Card>

          {/* Water Polo Court Heatmap */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#022851]">Water Polo Court - Goal Zones</h3>
              <Button
                onClick={resetHeatmap}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <RotateCcw size={14} className="mr-2" />
                Reset Heatmap
              </Button>
            </div>

            {/* Court Visualization */}
            <div className="max-w-5xl mx-auto">
              {/* Opponent Goal */}
              <div className="text-center mb-3">
                <div className="inline-block">
                  {/* Goal Net */}
                  <div className="relative">
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
              </div>

              {/* Water Polo Pool with 2x3 Grid */}
              <div className="relative border-4 border-yellow-400 border-dashed rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500 p-0">
                {/* Goal Line - White */}
                <div className="relative h-2 bg-white/60 border-b-2 border-white">
                  <span className="absolute right-2 top-0 text-xs text-white font-bold">Goal Line</span>
                </div>
                
                {/* Row 1: Wings (0-2m zone) */}
                <div className="grid grid-cols-2 gap-0 border-b-4 border-red-500">
                  {heatmapData[heatmapTeam][0].map((value, colIndex) => (
                    <button
                      key={colIndex}
                      onClick={() => handleHeatmapClick(0, colIndex)}
                      className={`
                        relative h-36 
                        ${getHeatmapIntensity(value)}
                        hover:scale-105 hover:shadow-2xl transition-all duration-200
                        flex flex-col items-center justify-center
                        ${!heatmapPlayer ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        border-r ${colIndex === 0 ? 'border-r-white/30' : ''}
                      `}
                      disabled={!heatmapPlayer}
                    >
                      <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                        {getZoneLabel(0, colIndex)}
                      </div>
                      <div className="text-5xl text-white font-bold drop-shadow-lg">{value}</div>
                      <div className="text-xs text-white/90 mt-1 drop-shadow">
                        {value === 1 ? 'goal' : 'goals'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 2m Line - Red */}
                <div className="relative h-1 bg-red-500">
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">2m</span>
                </div>

                {/* Center: Hole/2 Meter marker */}
                <div className="absolute left-1/2 top-[90px] transform -translate-x-1/2 z-10">
                  <div className="w-16 h-16 bg-orange-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Hole</span>
                  </div>
                </div>

                {/* Row 2: Flats (2m-5m zone) */}
                <div className="grid grid-cols-2 gap-0 border-b-4 border-yellow-400">
                  {heatmapData[heatmapTeam][1].map((value, colIndex) => (
                    <button
                      key={colIndex}
                      onClick={() => handleHeatmapClick(1, colIndex)}
                      className={`
                        relative h-36
                        ${getHeatmapIntensity(value)}
                        hover:scale-105 hover:shadow-2xl transition-all duration-200
                        flex flex-col items-center justify-center
                        ${!heatmapPlayer ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        border-r ${colIndex === 0 ? 'border-r-white/30' : ''}
                      `}
                      disabled={!heatmapPlayer}
                    >
                      <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                        {getZoneLabel(1, colIndex)}
                      </div>
                      <div className="text-5xl text-white font-bold drop-shadow-lg">{value}</div>
                      <div className="text-xs text-white/90 mt-1 drop-shadow">
                        {value === 1 ? 'goal' : 'goals'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 5m Line - Yellow */}
                <div className="relative h-1 bg-yellow-400">
                  <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">5m</span>
                </div>

                {/* Row 3: Point (5m-7m zone) */}
                <div className="grid grid-cols-1 gap-0 border-b-2 border-white/60">
                  <button
                    onClick={() => handleHeatmapClick(2, 0)}
                    className={`
                      relative h-40
                      ${getHeatmapIntensity(heatmapData[heatmapTeam][2][0])}
                      hover:scale-105 hover:shadow-2xl transition-all duration-200
                      flex flex-col items-center justify-center
                      ${!heatmapPlayer ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
                    disabled={!heatmapPlayer}
                  >
                    <div className="text-sm font-bold text-white mb-1 drop-shadow-lg">
                      {getZoneLabel(2, 0)}
                    </div>
                    <div className="text-5xl text-white font-bold drop-shadow-lg">
                      {heatmapData[heatmapTeam][2][0] + heatmapData[heatmapTeam][2][1]}
                    </div>
                    <div className="text-xs text-white/90 mt-1 drop-shadow">
                      {(heatmapData[heatmapTeam][2][0] + heatmapData[heatmapTeam][2][1]) === 1 ? 'goal' : 'goals'}
                    </div>
                  </button>
                </div>

                {/* 7m Line - White */}
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
              {!heatmapPlayer && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Tip:</strong> Select a team and player above to start tracking goal locations
                  </p>
                </div>
              )}

              {/* Legend */}
              <div className="mt-4 p-4 bg-white/80 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-700">
                  <div className="font-bold mb-2">Position Guide:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>① Left Wing (0-2m)</div>
                    <div>③ Right Wing (0-2m)</div>
                    <div>② Left Flat (2m-5m)</div>
                    <div>④ Right Flat (2m-5m)</div>
                    <div>⑤ Point (5m-7m)</div>
                    <div className="text-xs text-gray-500 col-span-2 mt-2">
                      <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span> 2m Line
                      <span className="inline-block w-3 h-3 bg-yellow-400 ml-3 mr-1"></span> 5m Line
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-[#FFBF00] to-[#ffcc33] border-none">
              <h3 className="text-[#022851] mb-4">UC Davis Goals</h3>
              <div className="text-5xl text-[#022851] mb-2">
                {heatmapData.ucDavis.flat().reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-sm text-[#022851]/70">Total goals tracked</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-600 to-red-700 border-none text-white">
              <h3 className="mb-4">Opponent Goals</h3>
              <div className="text-5xl mb-2">
                {heatmapData.opponent.flat().reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-sm opacity-70">Total goals tracked</p>
            </Card>
          </div>

          {/* Zone Breakdown */}
          <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[#022851] mb-4">Zone Breakdown - {heatmapTeam === 'ucDavis' ? 'UC Davis' : 'Opponent'}</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Row 0: Wings */}
              {heatmapData[heatmapTeam][0].map((value, colIndex) => (
                <div
                  key={`0-${colIndex}`}
                  className={`p-4 rounded-lg border-2 ${
                    value > 0 ? 'border-[#FFBF00] bg-yellow-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-600 mb-1">{getPositionName(0, colIndex)}</div>
                  <div className="text-2xl text-[#022851]">{value} goals</div>
                </div>
              ))}
              {/* Row 1: Flats */}
              {heatmapData[heatmapTeam][1].map((value, colIndex) => (
                <div
                  key={`1-${colIndex}`}
                  className={`p-4 rounded-lg border-2 ${
                    value > 0 ? 'border-[#FFBF00] bg-yellow-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-600 mb-1">{getPositionName(1, colIndex)}</div>
                  <div className="text-2xl text-[#022851]">{value} goals</div>
                </div>
              ))}
              {/* Row 2: Point (merged) */}
              <div
                className={`p-4 rounded-lg border-2 col-span-2 ${
                  (heatmapData[heatmapTeam][2][0] + heatmapData[heatmapTeam][2][1]) > 0 
                    ? 'border-[#FFBF00] bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-sm text-gray-600 mb-1">Point</div>
                <div className="text-2xl text-[#022851]">
                  {heatmapData[heatmapTeam][2][0] + heatmapData[heatmapTeam][2][1]} goals
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}