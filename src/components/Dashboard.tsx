import React, { useState } from 'react';
import { useMatchViewModel, usePlayerStatsViewModel, useActionViewModel } from '../hooks/useViewModels';
import { Player, Match } from '../models/types';
import { MatchViewModel } from '../viewmodels/MatchViewModel';
import { PlayerStatsViewModel } from '../viewmodels/PlayerStatsViewModel';
import { ActionViewModel } from '../viewmodels/ActionViewModel';

interface PlayerRowProps {
  player: Player;
  match: Match;
  isHomeTeam: boolean;
  onGoalScored: (isHomeTeam: boolean, playerId: number) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, match, isHomeTeam, onGoalScored }) => {
  const playerStatsVM: PlayerStatsViewModel = usePlayerStatsViewModel();
  const actionVM: ActionViewModel = useActionViewModel();

  const handleGoal = async () => {
    if (!player.id || !match.id || !player.team_id) {
      console.error('Missing player, match, or team ID for goal action.');
      return;
    }

    try {
      // (a) increment goals and shots_attempted in PlayerMatchStats
      await playerStatsVM.incrementStat(player.id, match.id, 'goals');
      await playerStatsVM.incrementStat(player.id, match.id, 'shots_attempted');

      // (b) log a Goal action to the Action table
      await actionVM.logAction({
        match_id: match.id,
        team_id: player.team_id,
        player_id: player.id,
        action_type: 'Goal',
        quarter: 1, // Assuming quarter 1 for simplicity, this would come from match context
        result: 'Made',
        is_power_play: false,
        is_counter_attack: false,
      });

      // (c) update home_score or away_score on the Match (delegated to parent via onGoalScored)
      onGoalScored(isHomeTeam, player.id);

      console.log(`Goal scored by ${player.first_name} ${player.last_name}`);
    } catch (error) {
      console.error('Error handling goal:', error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
      <span>{player.first_name} {player.last_name} ({player.jersey_number})</span>
      <button onClick={handleGoal} style={{ padding: '4px 8px', cursor: 'pointer' }}>Goal!</button>
    </div>
  );
};

interface DashboardProps {
  initialMatchId: number;
}

const Dashboard: React.FC<DashboardProps> = ({ initialMatchId }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const matchVM: MatchViewModel = useMatchViewModel();

  // For demonstration, these would typically be fetched from the backend based on match.id
  const [homePlayers, setHomePlayers] = useState<Player[]>([
    { id: 1, team_id: 101, first_name: 'Player', last_name: 'One', jersey_number: 7, position: 'Driver', is_active: true },
    { id: 2, team_id: 101, first_name: 'Player', last_name: 'Two', jersey_number: 9, position: 'Center', is_active: true },
  ]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([
    { id: 3, team_id: 102, first_name: 'Opponent', last_name: 'Alpha', jersey_number: 4, position: 'Driver', is_active: true },
    { id: 4, team_id: 102, first_name: 'Opponent', last_name: 'Beta', jersey_number: 11, position: 'Flat', is_active: true },
  ]);


  React.useEffect(() => {
    const fetchMatch = async () => {
      const fetchedMatch = await matchVM.getMatch(initialMatchId);
      if (fetchedMatch) {
        setMatch(fetchedMatch);
      } else {
        // Fallback for demonstration if match doesn't exist in DB
        setMatch({
          id: initialMatchId,
          home_team_id: 101, // Example team IDs
          away_team_id: 102,
          match_date: new Date().toISOString(),
          home_score: 0,
          away_score: 0,
          match_type: 'Regular',
          status: 'Scheduled',
        });
      }
    };
    fetchMatch();
  }, [initialMatchId]);

  const handleGoalScored = async (isHomeTeam: boolean, playerId: number) => {
    if (!match) return;

    let newHomeScore = match.home_score;
    let newAwayScore = match.away_score;

    if (isHomeTeam) {
      newHomeScore += 1;
    } else {
      newAwayScore += 1;
    }

    const success = await matchVM.updateScore(match.id!, newHomeScore, newAwayScore);
    if (success) {
      setMatch(prevMatch => prevMatch ? { ...prevMatch, home_score: newHomeScore, away_score: newAwayScore } : null);
    }
  };

  if (!match) {
    return <div>Loading match...</div>;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '20px auto', border: '1px solid #ccc', padding: '20px' }}>
      <h1>Match Dashboard</h1>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <h2>Home: {match.home_score}</h2>
        <h2>Away: {match.away_score}</h2>
      </div>

      <h3>Home Team Players</h3>
      {homePlayers.map(player => (
        <PlayerRow key={player.id} player={player} match={match} isHomeTeam={true} onGoalScored={handleGoalScored} />
      ))}

      <h3>Away Team Players</h3>
      {awayPlayers.map(player => (
        <PlayerRow key={player.id} player={player} match={match} isHomeTeam={false} onGoalScored={handleGoalScored} />
      ))}

      <div style={{ marginTop: '20px' }}>
        Match Status: <strong>{match.status}</strong>
        <button
          onClick={() => matchVM.updateStatus(match.id!, 'Live').then(() => setMatch(prev => prev ? {...prev, status: 'Live'} : null))}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          Go Live
        </button>
        <button
          onClick={() => matchVM.updateStatus(match.id!, 'Final').then(() => setMatch(prev => prev ? {...prev, status: 'Final'} : null))}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          End Match
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

