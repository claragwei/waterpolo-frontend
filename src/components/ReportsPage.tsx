import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Calendar, User, Trophy, Clock, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';


export default function ReportsPage() {
  const [showQuarterReport, setShowQuarterReport] = useState(false);
  const [showHalftimeReport, setShowHalftimeReport] = useState(false);
  //new code
  const [showPlayerReport, setShowPlayerReport] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  // Mock data - in production, this would come from localStorage or state management
  const mockGameData = {
    currentQuarter: 2,
    gameTime: 360, // 6 minutes into Q2
    ucDavisScore: 5,
    opponentScore: 3,
    opponentName: 'Stanford',
    quarterStats: {
      Q1: {
        ucDavisGoals: 3,
        opponentGoals: 2,
        ucDavisPossessionTime: 250,
        opponentPossessionTime: 230,
        totalShots: { ucDavis: 8, opponent: 6 },
        topScorers: [
          { name: 'Alex Martinez', goals: 2, shots: 3 },
          { name: 'Jake Thompson', goals: 1, shots: 2 }
        ],
        refereeCalls: { yellowCards: 1, ejections: 2, penalties: 1 }
      },
      Q2: {
        ucDavisGoals: 2,
        opponentGoals: 1,
        ucDavisPossessionTime: 180,
        opponentPossessionTime: 180,
        totalShots: { ucDavis: 5, opponent: 4 },
        topScorers: [
          { name: 'Ryan Chen', goals: 1, shots: 2 },
          { name: 'Marcus Wilson', goals: 1, shots: 1 }
        ],
        refereeCalls: { yellowCards: 0, ejections: 1, penalties: 0 }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuarterReport = () => {
    const quarter = mockGameData.currentQuarter;
    const qData = mockGameData.quarterStats[`Q${quarter}` as 'Q1' | 'Q2'];
    
    return (
      <Dialog open={showQuarterReport} onOpenChange={setShowQuarterReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#022851]">
              Quarter {quarter} Report - UC Davis vs {mockGameData.opponentName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Score Summary */}
            <Card className="p-6 bg-gradient-to-br from-[#022851] to-[#034580]">
              <div className="flex justify-between items-center text-white">
                <div className="text-center">
                  <div className="text-sm opacity-80 mb-1">UC Davis</div>
                  <div className="text-5xl font-bold text-[#FFBF00]">{qData.ucDavisGoals}</div>
                </div>
                <div className="text-center">
                  <Badge className="bg-[#FFBF00] text-[#022851] text-lg px-4 py-2">Q{quarter}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm opacity-80 mb-1">{mockGameData.opponentName}</div>
                  <div className="text-5xl font-bold">{qData.opponentGoals}</div>
                </div>
              </div>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-[#FFBF00]" />
                  Possession Time
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">UC Davis:</span>
                    <span className="font-semibold text-[#022851]">{formatTime(qData.ucDavisPossessionTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{mockGameData.opponentName}:</span>
                    <span className="font-semibold">{formatTime(qData.opponentPossessionTime)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-[#FFBF00]" />
                  Shots
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">UC Davis:</span>
                    <span className="font-semibold text-[#022851]">{qData.totalShots.ucDavis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{mockGameData.opponentName}:</span>
                    <span className="font-semibold">{qData.totalShots.opponent}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Top Scorers */}
            <Card className="p-4">
              <h3 className="text-[#022851] mb-3">Top Scorers (UC Davis)</h3>
              <div className="space-y-2">
                {qData.topScorers.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{player.name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">{player.goals} goals</span>
                      <span className="text-gray-600">{player.shots} shots</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Referee Calls */}
            <Card className="p-4">
              <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                <Flag size={18} className="text-[#FFBF00]" />
                Referee Calls
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{qData.refereeCalls.yellowCards}</div>
                  <div className="text-sm text-gray-600">Yellow Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{qData.refereeCalls.ejections}</div>
                  <div className="text-sm text-gray-600">Ejections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#022851]">{qData.refereeCalls.penalties}</div>
                  <div className="text-sm text-gray-600">Penalties</div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowQuarterReport(false)}>
                Close
              </Button>
              <Button className="bg-[#022851] hover:bg-[#034580] text-white">
                <Download className="mr-2" size={16} />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderHalftimeReport = () => {
    const q1Data = mockGameData.quarterStats.Q1;
    const q2Data = mockGameData.quarterStats.Q2;
    
    // Combine Q1 and Q2 stats
    const combinedStats = {
      ucDavisGoals: q1Data.ucDavisGoals + q2Data.ucDavisGoals,
      opponentGoals: q1Data.opponentGoals + q2Data.opponentGoals,
      ucDavisPossessionTime: q1Data.ucDavisPossessionTime + q2Data.ucDavisPossessionTime,
      opponentPossessionTime: q1Data.opponentPossessionTime + q2Data.opponentPossessionTime,
      totalShots: {
        ucDavis: q1Data.totalShots.ucDavis + q2Data.totalShots.ucDavis,
        opponent: q1Data.totalShots.opponent + q2Data.totalShots.opponent
      },
      refereeCalls: {
        yellowCards: q1Data.refereeCalls.yellowCards + q2Data.refereeCalls.yellowCards,
        ejections: q1Data.refereeCalls.ejections + q2Data.refereeCalls.ejections,
        penalties: q1Data.refereeCalls.penalties + q2Data.refereeCalls.penalties
      }
    };

    return (
      <Dialog open={showHalftimeReport} onOpenChange={setShowHalftimeReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#022851]">
              Halftime Report - UC Davis vs {mockGameData.opponentName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Score Summary */}
            <Card className="p-6 bg-gradient-to-br from-[#022851] to-[#034580]">
              <div className="flex justify-between items-center text-white">
                <div className="text-center">
                  <div className="text-sm opacity-80 mb-1">UC Davis</div>
                  <div className="text-5xl font-bold text-[#FFBF00]">{combinedStats.ucDavisGoals}</div>
                </div>
                <div className="text-center">
                  <Badge className="bg-[#FFBF00] text-[#022851] text-lg px-4 py-2">Halftime</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm opacity-80 mb-1">{mockGameData.opponentName}</div>
                  <div className="text-5xl font-bold">{combinedStats.opponentGoals}</div>
                </div>
              </div>
            </Card>

            {/* Quarter Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-2 border-[#FFBF00]">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Badge className="bg-[#FFBF00] text-[#022851]">Q1</Badge>
                  First Quarter
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-semibold text-[#022851]">{q1Data.ucDavisGoals} - {q1Data.opponentGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shots:</span>
                    <span className="font-semibold">{q1Data.totalShots.ucDavis} - {q1Data.totalShots.opponent}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-[#022851]">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Badge className="bg-[#022851] text-white">Q2</Badge>
                  Second Quarter
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-semibold text-[#022851]">{q2Data.ucDavisGoals} - {q2Data.opponentGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shots:</span>
                    <span className="font-semibold">{q2Data.totalShots.ucDavis} - {q2Data.totalShots.opponent}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* First Half Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-[#FFBF00]" />
                  Total Possession Time
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">UC Davis:</span>
                    <span className="font-semibold text-[#022851]">{formatTime(combinedStats.ucDavisPossessionTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{mockGameData.opponentName}:</span>
                    <span className="font-semibold">{formatTime(combinedStats.opponentPossessionTime)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Possession %:</span>
                      <span className="font-semibold text-[#FFBF00]">
                        {Math.round((combinedStats.ucDavisPossessionTime / (combinedStats.ucDavisPossessionTime + combinedStats.opponentPossessionTime)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-[#FFBF00]" />
                  Shooting Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Shots:</span>
                    <span className="font-semibold text-[#022851]">{combinedStats.totalShots.ucDavis} - {combinedStats.totalShots.opponent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">UC Davis Accuracy:</span>
                    <span className="font-semibold text-[#FFBF00]">
                      {Math.round((combinedStats.ucDavisGoals / combinedStats.totalShots.ucDavis) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{mockGameData.opponentName} Accuracy:</span>
                    <span className="font-semibold">
                      {Math.round((combinedStats.opponentGoals / combinedStats.totalShots.opponent) * 100)}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Combined Top Scorers */}
            <Card className="p-4">
              <h3 className="text-[#022851] mb-3">First Half Top Scorers (UC Davis)</h3>
              <div className="space-y-2">
                {[...q1Data.topScorers, ...q2Data.topScorers].slice(0, 4).map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{player.name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">{player.goals} goals</span>
                      <span className="text-gray-600">{player.shots} shots</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* First Half Referee Calls */}
            <Card className="p-4">
              <h3 className="text-[#022851] mb-3 flex items-center gap-2">
                <Flag size={18} className="text-[#FFBF00]" />
                First Half Referee Calls
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{combinedStats.refereeCalls.yellowCards}</div>
                  <div className="text-sm text-gray-600">Yellow Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{combinedStats.refereeCalls.ejections}</div>
                  <div className="text-sm text-gray-600">Ejections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#022851]">{combinedStats.refereeCalls.penalties}</div>
                  <div className="text-sm text-gray-600">Penalties</div>
                </div>
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-4 bg-[#FFBF00]/10 border-2 border-[#FFBF00]">
              <h3 className="text-[#022851] mb-3">Key Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#FFBF00] mt-1">•</span>
                  <span>UC Davis leads by {combinedStats.ucDavisGoals - combinedStats.opponentGoals} goal(s) at halftime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFBF00] mt-1">•</span>
                  <span>UC Davis shooting accuracy: {Math.round((combinedStats.ucDavisGoals / combinedStats.totalShots.ucDavis) * 100)}%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FFBF00] mt-1">•</span>
                  <span>Possession advantage: UC Davis {Math.round((combinedStats.ucDavisPossessionTime / (combinedStats.ucDavisPossessionTime + combinedStats.opponentPossessionTime)) * 100)}%</span>
                </li>
              </ul>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowHalftimeReport(false)}>
                Close
              </Button>
              <Button className="bg-[#022851] hover:bg-[#034580] text-white">
                <Download className="mr-2" size={16} />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
useEffect(() => {
  fetch('http://localhost:8000/api/players?team_id=1')
    .then(res => res.json())
    .then(data => setPlayers(data))
    .catch(err => console.error('Failed to fetch players:', err));
}, []);

const fetchPlayerStats = async (playerId: number) => {
  setLoadingStats(true);
  try {
    const res = await fetch(`http://localhost:8000/api/players/${playerId}/averages`);
    const data = await res.json();
    setPlayerStats(data);
  } catch (err) {
    console.error('Failed to fetch player stats:', err);
  }
  setLoadingStats(false);
};

const renderPlayerSeasonReport = () => (
  <Dialog open={showPlayerReport} onOpenChange={setShowPlayerReport}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl text-[#022851]">
          Player Season Performance Report
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Player</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              onChange={e => {
                const player = players.find(p => p.id === parseInt(e.target.value));
                setSelectedPlayer(player);
                setPlayerStats(null);
                if (player) fetchPlayerStats(player.id);
              }}
            >
              <option value="">-- Choose a player --</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>

        {/* Stats Display */}
        {loadingStats && <p className="text-center text-gray-500">Loading stats...</p>}

        {selectedPlayer && playerStats && !loadingStats && (
          <>
            <Card className="p-6 bg-gradient-to-br from-[#022851] to-[#034580] text-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFBF00] mb-1">{selectedPlayer.name}</div>
                <div className="text-gray-300">Season {selectedSeason} Performance</div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.total_goals ?? 0}</div>
                <div className="text-sm text-gray-600">Total Goals</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.total_assists ?? 0}</div>
                <div className="text-sm text-gray-600">Total Assists</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.total_steals ?? 0}</div>
                <div className="text-sm text-gray-600">Total Steals</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.total_shots ?? 0}</div>
                <div className="text-sm text-gray-600">Total Shots</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.avg_goals ?? 0}</div>
                <div className="text-sm text-gray-600">Avg Goals/Game</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-[#022851]">{playerStats.games_played ?? 0}</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </Card>
            </div>
          </>
        )}

        {selectedPlayer && !playerStats && !loadingStats && (
          <p className="text-center text-gray-500">No stats found for this player.</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowPlayerReport(false)}>Close</Button>
          <Button className="bg-[#022851] hover:bg-[#034580] text-white">
            <Download className="mr-2" size={16} />
            Download PDF
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
  const availableReports = [
    {
      id: 1,
      type: 'Match Report',
      title: 'Stanford vs UC Davis',
      date: 'Oct 24, 2025',
      status: 'Ready',
      icon: Trophy,
    },
    {
      id: 2,
      type: 'Player Report',
      title: 'Marcus Silva - Monthly Analysis',
      date: 'Oct 2025',
      status: 'Ready',
      icon: User,
    },
    {
      id: 3,
      type: 'Season Report',
      title: 'Season 2025 Overview',
      date: '2025',
      status: 'Ready',
      icon: Calendar,
    },
  ];

  const reportTemplates = [
    {
      id: 1,
      name: 'Match Performance Report',
      description: 'Comprehensive analysis of a single match including stats and player ratings',
      icon: Trophy,
    },
    {
      id: 2,
      name: 'Player Development Report',
      description: 'Individual player progress tracking over selected time period',
      icon: User,
    },
    {
      id: 3,
      name: 'Team Analytics Report',
      description: 'Team-wide statistics and performance metrics',
      icon: FileText,
    },
    {
      id: 4,
      name: 'Season Summary Report',
      description: 'Complete season overview with trends and highlights',
      icon: Calendar,
    },
    {
      id: 5,
      name: 'Quarter Report',
      description: 'Real-time report for the current quarter based on live stats data',
      icon: Clock,
      action: () => setShowQuarterReport(true),
      highlight: true
    },
    {
      id: 6,
      name: 'Halftime Report',
      description: 'Comprehensive first-half analysis combining Q1 and Q2 statistics',
      icon: Flag,
      action: () => setShowHalftimeReport(true),
      highlight: true
    },
    {
      id: 7,
      name: 'Player Season Performance',
      description: 'View goals, assists, steals and more for any player across a selected season',
      icon: User,
      action: () => setShowPlayerReport(true),
      highlight: true
    },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      {renderQuarterReport()}
      {renderHalftimeReport()}
      {renderPlayerSeasonReport()}

      
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Reports</h1>
        <p className="text-gray-600">Generate and download comprehensive performance reports</p>
      </div>

      {/* Generate Report Section */}
      <Card className="p-8 bg-gradient-to-br from-[#022851] to-[#034580] text-white rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-2">Generate New Report</h2>
            <p className="text-gray-300 mb-6">Create custom reports based on your analytics needs</p>
            <Button className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]">
              <FileText className="mr-2" size={16} />
              Create Report
            </Button>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-[#FFBF00]/20 rounded-full flex items-center justify-center">
              <FileText className="text-[#FFBF00]" size={64} />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Reports */}
      <div className="mb-8">
        <h2 className="text-[#022851] mb-4">Recent Reports</h2>
        <div className="grid gap-4">
          {availableReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center">
                      <Icon className="text-[#FFBF00]" size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[#022851]">{report.title}</h3>
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                          {report.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{report.type} • {report.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="border-gray-300">
                      <FileText className="mr-2" size={16} />
                      View
                    </Button>
                    <Button className="bg-[#022851] hover:bg-[#034580] text-white">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-[#022851] mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-[#FFBF00]" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#022851] mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    {template.action ? (
                      <Button size="sm" className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]" onClick={template.action}>
                        Generate Report
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]">
                        Generate Report
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}