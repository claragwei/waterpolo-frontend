// Seed script for UC Davis Water Polo database
// Run this with: deno run --allow-net --allow-env seed.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============ SEED TEAMS ============
    console.log('📋 Seeding teams...');
    
    const { data: ucDavis, error: ucDavisError } = await supabase
      .from('teams')
      .upsert({
        name: 'UC Davis Aggies',
        coach_name: 'Coach Davis',
        division: 'Division 1',
        season: '2024-25',
      }, { onConflict: 'name,season' })
      .select()
      .single();

    if (ucDavisError) throw ucDavisError;
    console.log(`  ✓ Created UC Davis Aggies (${ucDavis.id})`);

    const { data: stanford, error: stanfordError } = await supabase
      .from('teams')
      .upsert({
        name: 'Stanford Cardinal',
        coach_name: 'Coach Cardinal',
        division: 'Division 1',
        season: '2024-25',
      }, { onConflict: 'name,season' })
      .select()
      .single();

    if (stanfordError) throw stanfordError;
    console.log(`  ✓ Created Stanford Cardinal (${stanford.id})`);

    const { data: cal, error: calError } = await supabase
      .from('teams')
      .upsert({
        name: 'UC Berkeley Golden Bears',
        coach_name: 'Coach Bear',
        division: 'Division 1',
        season: '2024-25',
      }, { onConflict: 'name,season' })
      .select()
      .single();

    if (calError) throw calError;
    console.log(`  ✓ Created UC Berkeley Golden Bears (${cal.id})\n`);

    // ============ SEED PLAYERS ============
    console.log('👥 Seeding players...');

    const positions = ['Attacker', 'Center', 'Defender', 'Goalie', 'Utility'];
    const ucDavisPlayers = [];

    for (let i = 1; i <= 13; i++) {
      const { data: player, error } = await supabase
        .from('players')
        .upsert({
          team_id: ucDavis.id,
          first_name: 'Aggie',
          last_name: `Player ${i}`,
          jersey_number: i,
          position: positions[i % positions.length],
          is_active: i <= 10, // First 10 are active
        }, { onConflict: 'team_id,jersey_number' })
        .select()
        .single();

      if (error) throw error;
      ucDavisPlayers.push(player);
    }
    console.log(`  ✓ Created ${ucDavisPlayers.length} UC Davis players`);

    const stanfordPlayers = [];
    for (let i = 1; i <= 13; i++) {
      const { data: player, error } = await supabase
        .from('players')
        .upsert({
          team_id: stanford.id,
          first_name: 'Cardinal',
          last_name: `Player ${i}`,
          jersey_number: i,
          position: positions[i % positions.length],
          is_active: i <= 10,
        }, { onConflict: 'team_id,jersey_number' })
        .select()
        .single();

      if (error) throw error;
      stanfordPlayers.push(player);
    }
    console.log(`  ✓ Created ${stanfordPlayers.length} Stanford players\n`);

    // ============ SEED MATCHES ============
    console.log('🏊 Seeding matches...');

    // Match 1: UC Davis vs Stanford (Completed)
    const matchDate1 = new Date();
    matchDate1.setDate(matchDate1.getDate() - 7); // 1 week ago

    const { data: match1, error: match1Error } = await supabase
      .from('matches')
      .insert({
        home_team_id: ucDavis.id,
        away_team_id: stanford.id,
        match_date: matchDate1.toISOString(),
        location: 'Schaal Aquatics Center',
        match_type: 'Conference',
        status: 'Final',
        home_score: 12,
        away_score: 10,
        quarter_scores: {
          q1: [3, 2],
          q2: [3, 3],
          q3: [4, 2],
          q4: [2, 3],
        },
      })
      .select()
      .single();

    if (match1Error) throw match1Error;
    console.log(`  ✓ Created match: UC Davis 12 - 10 Stanford (${match1.id})`);

    // Match 2: UC Davis vs Cal (Upcoming)
    const matchDate2 = new Date();
    matchDate2.setDate(matchDate2.getDate() + 3); // 3 days from now

    const { data: match2, error: match2Error } = await supabase
      .from('matches')
      .insert({
        home_team_id: ucDavis.id,
        away_team_id: cal.id,
        match_date: matchDate2.toISOString(),
        location: 'Schaal Aquatics Center',
        match_type: 'Conference',
        status: 'Scheduled',
        home_score: 0,
        away_score: 0,
      })
      .select()
      .single();

    if (match2Error) throw match2Error;
    console.log(`  ✓ Created match: UC Davis vs Cal (Upcoming) (${match2.id})\n`);

    // ============ SEED TEAM MATCH STATS ============
    console.log('📊 Seeding team match stats...');

    await supabase.from('team_match_stats').insert({
      team_id: ucDavis.id,
      match_id: match1.id,
      fco: 24,
      fcd: 20,
      cao: 8,
      cad: 6,
      ag: 3,
      agd: 2,
      six_on_five_opportunities: 8,
      five_on_six_opportunities: 6,
      seven_on_six_opportunities: 2,
      six_on_seven_opportunities: 1,
      total_possession_time_seconds: 950.5,
    });

    await supabase.from('team_match_stats').insert({
      team_id: stanford.id,
      match_id: match1.id,
      fco: 22,
      fcd: 22,
      cao: 6,
      cad: 8,
      ag: 2,
      agd: 3,
      six_on_five_opportunities: 6,
      five_on_six_opportunities: 8,
      seven_on_six_opportunities: 1,
      six_on_seven_opportunities: 2,
      total_possession_time_seconds: 890.0,
    });

    console.log('  ✓ Created team stats for match 1\n');

    // ============ SEED PLAYER MATCH STATS ============
    console.log('🎯 Seeding player match stats...');

    const playerStatsToInsert = [];
    const actionsToInsert = [];

    // Generate stats for UC Davis players
    for (const player of ucDavisPlayers.slice(0, 10)) {
      const goals = Math.floor(Math.random() * 5);
      const shots = goals + Math.floor(Math.random() * 4);
      const assists = Math.floor(Math.random() * 4);
      const steals = Math.floor(Math.random() * 3);

      playerStatsToInsert.push({
        player_id: player.id,
        match_id: match1.id,
        shots_attempted: shots,
        goals: goals,
        assists: assists,
        steals: steals,
        blocks: Math.floor(Math.random() * 2),
        turnovers: Math.floor(Math.random() * 3),
        rebounds: Math.floor(Math.random() * 2),
        tipped_passes: Math.floor(Math.random() * 2),
        sprints_won: Math.floor(Math.random() * 3),
        sprints_attempted: Math.floor(Math.random() * 5),
        hustles: Math.floor(Math.random() * 4),
        exclusions_committed: Math.floor(Math.random() * 2),
        exclusions_drawn: Math.floor(Math.random() * 2),
        penalty_shots_attempted: Math.floor(Math.random() * 2),
        penalty_shots_made: Math.floor(Math.random() * 2),
        minutes_played: Math.random() * 20 + 10,
      });

      // Generate actions for goals
      for (let i = 0; i < goals; i++) {
        const quarter = Math.floor(Math.random() * 4) + 1;
        const formation = Math.random() > 0.5 ? '4-2' : '3-3';
        actionsToInsert.push({
          match_id: match1.id,
          team_id: ucDavis.id,
          player_id: player.id,
          action_type: 'Goal',
          quarter: quarter,
          game_clock_seconds: Math.random() * 480,
          zone: ['Wing Left', 'Wing Right', 'Point', 'Hole', 'Flat Left'][Math.floor(Math.random() * 5)],
          coordinate_x: Math.random() * 80 + 10,
          coordinate_y: Math.random() * 80 + 10,
          result: 'Made',
          formation: formation,
          is_power_play: Math.random() > 0.7,
          is_counter_attack: Math.random() > 0.8,
        });
      }

      // Generate actions for missed shots
      for (let i = 0; i < shots - goals; i++) {
        const quarter = Math.floor(Math.random() * 4) + 1;
        const formation = Math.random() > 0.5 ? '4-2' : '3-3';
        actionsToInsert.push({
          match_id: match1.id,
          team_id: ucDavis.id,
          player_id: player.id,
          action_type: 'Shot',
          quarter: quarter,
          game_clock_seconds: Math.random() * 480,
          zone: ['Wing Left', 'Wing Right', 'Point'][Math.floor(Math.random() * 3)],
          coordinate_x: Math.random() * 80 + 10,
          coordinate_y: Math.random() * 80 + 10,
          result: 'Missed',
          formation: formation,
        });
      }

      // Generate actions for assists
      for (let i = 0; i < assists; i++) {
        const quarter = Math.floor(Math.random() * 4) + 1;
        const formation = Math.random() > 0.5 ? '4-2' : '3-3';
        actionsToInsert.push({
          match_id: match1.id,
          team_id: ucDavis.id,
          player_id: player.id,
          action_type: 'Assist',
          quarter: quarter,
          game_clock_seconds: Math.random() * 480,
          zone: ['Wing Left', 'Wing Right', 'Point', 'Hole'][Math.floor(Math.random() * 4)],
          coordinate_x: Math.random() * 80 + 10,
          coordinate_y: Math.random() * 80 + 10,
          formation: formation,
        });
      }
    }

    // Generate stats for Stanford players (lighter stats since they lost)
    for (const player of stanfordPlayers.slice(0, 10)) {
      const goals = Math.floor(Math.random() * 3);
      const shots = goals + Math.floor(Math.random() * 3);

      playerStatsToInsert.push({
        player_id: player.id,
        match_id: match1.id,
        shots_attempted: shots,
        goals: goals,
        assists: Math.floor(Math.random() * 2),
        steals: Math.floor(Math.random() * 2),
        blocks: Math.floor(Math.random() * 2),
        turnovers: Math.floor(Math.random() * 3),
        minutes_played: Math.random() * 20 + 8,
      });
    }

    const { error: statsError } = await supabase
      .from('player_match_stats')
      .insert(playerStatsToInsert);

    if (statsError) throw statsError;
    console.log(`  ✓ Created ${playerStatsToInsert.length} player stat records`);

    const { error: actionsError } = await supabase
      .from('actions')
      .insert(actionsToInsert);

    if (actionsError) throw actionsError;
    console.log(`  ✓ Created ${actionsToInsert.length} action records (for heatmaps)\n`);

    // ============ SEED POSSESSIONS ============
    console.log('⏱️  Seeding possessions...');

    const possessionsToInsert = [
      {
        match_id: match1.id,
        team_id: ucDavis.id,
        quarter: 1,
        start_time_seconds: 480,
        end_time_seconds: 450,
        duration_seconds: 30,
        start_reason: 'Sprint Won',
        end_reason: 'Goal',
      },
      {
        match_id: match1.id,
        team_id: stanford.id,
        quarter: 1,
        start_time_seconds: 450,
        end_time_seconds: 425,
        duration_seconds: 25,
        start_reason: 'Goal Against',
        end_reason: 'Turnover',
      },
      {
        match_id: match1.id,
        team_id: ucDavis.id,
        quarter: 1,
        start_time_seconds: 425,
        end_time_seconds: 400,
        duration_seconds: 25,
        start_reason: 'Steal',
        end_reason: 'Shot',
      },
    ];

    const { error: possessionsError } = await supabase
      .from('possessions')
      .insert(possessionsToInsert);

    if (possessionsError) throw possessionsError;
    console.log(`  ✓ Created ${possessionsToInsert.length} possession records\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log('  - 3 teams');
    console.log('  - 26 players (13 per team)');
    console.log('  - 2 matches (1 completed, 1 upcoming)');
    console.log(`  - ${playerStatsToInsert.length} player stat records`);
    console.log(`  - ${actionsToInsert.length} action records`);
    console.log(`  - ${possessionsToInsert.length} possession records`);
    console.log('\n🎉 Ready to go!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    Deno.exit(1);
  }
}

// Run the seed function
seedDatabase();
