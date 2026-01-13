from orm import *
from datetime import datetime, timedelta
import random

def seed_data():
    print("Connecting to database...")
    # NOTE: Ensure your database exists or change connection details in orm.py
    # For this seed script to work, we assume the tables are created.
    try:
        initialize_database()
    except Exception as e:
        print(f"Error connecting/initializing: {e}")
        return

    print("Seeding Teams...")
    uc_davis, _ = Team.get_or_create(
        name="UC Davis Aggies",
        defaults={
            'coach_name': "Coach Davis",
            'division': "Division 1",
            'season': "2024-25"
        }
    )

    stanford, _ = Team.get_or_create(
        name="Stanford Cardinal",
        defaults={
            'coach_name': "Coach Cardinal",
            'division': "Division 1",
            'season': "2024-25"
        }
    )

    print("Seeding Players...")
    # UC Davis Players
    uc_davis_players = []
    positions = ['Attacker', 'Center', 'Defender', 'Goalie', 'Utility']
    for i in range(1, 14):
        p, _ = Player.get_or_create(
            team=uc_davis,
            jersey_number=i,
            defaults={
                'first_name': f"Aggie",
                'last_name': f"Player {i}",
                'position': positions[i % len(positions)]
            }
        )
        uc_davis_players.append(p)

    # Stanford Players
    stanford_players = []
    for i in range(1, 14):
        p, _ = Player.get_or_create(
            team=stanford,
            jersey_number=i,
            defaults={
                'first_name': f"Cardinal",
                'last_name': f"Player {i}",
                'position': positions[i % len(positions)]
            }
        )
        stanford_players.append(p)

    print("Seeding Match...")
    match_date = datetime.now() - timedelta(days=1)
    match, created = Match.get_or_create(
        home_team=uc_davis,
        away_team=stanford,
        match_date=match_date,
        defaults={
            'location': "Schaal Aquatics Center",
            'match_type': "Conference",
            'status': "Final",
            'home_score': 12,
            'away_score': 10,
            'quarter_scores': {'q1': [3, 2], 'q2': [3, 3], 'q3': [4, 2], 'q4': [2, 3]}
        }
    )

    if created:
        print(f"Created match: {uc_davis.name} vs {stanford.name}")

        print("Seeding Team Match Stats...")
        TeamMatchStats.create(
            team=uc_davis,
            match=match,
            fco=24, fcd=20, cao=8, cad=6,
            six_on_five_opportunities=8,
            five_on_six_opportunities=6,
            total_possession_time_seconds=950.5
        )
        TeamMatchStats.create(
            team=stanford,
            match=match,
            fco=22, fcd=22, cao=6, cad=8,
            six_on_five_opportunities=6,
            five_on_six_opportunities=8,
            total_possession_time_seconds=890.0
        )

        print("Seeding Player Stats & Actions...")
        # Generate some random stats for UC Davis players
        for player in uc_davis_players:
            # Stats
            goals = random.randint(0, 4)
            shots = goals + random.randint(0, 3)
            pm_stats = PlayerMatchStats.create(
                player=player,
                match=match,
                shots_attempted=shots,
                goals=goals,
                assists=random.randint(0, 3),
                steals=random.randint(0, 2),
                minutes_played=random.uniform(5.0, 28.0)
            )
            
            # Generate Actions (for Heatmaps/Analytics)
            # Goals
            for _ in range(goals):
                Action.create(
                    match=match,
                    team=uc_davis,
                    player=player,
                    action_type='Goal',
                    quarter=random.randint(1, 4),
                    game_clock_seconds=random.randint(10, 400),
                    zone=random.choice(['Wing Left', 'Wing Right', 'Point', 'Hole', 'Flat Left']),
                    coordinate_x=random.uniform(10, 90),
                    coordinate_y=random.uniform(10, 90),
                    result='Made'
                )
            
            # Misses
            for _ in range(shots - goals):
                Action.create(
                    match=match,
                    team=uc_davis,
                    player=player,
                    action_type='Shot',
                    quarter=random.randint(1, 4),
                    game_clock_seconds=random.randint(10, 400),
                    zone=random.choice(['Wing Left', 'Wing Right', 'Point']),
                    coordinate_x=random.uniform(10, 90),
                    coordinate_y=random.uniform(10, 90),
                    result='Missed'
                )

        print("Seeding Possessions...")
        # Create a few dummy possessions to show flow
        Possession.create(
            match=match,
            team=uc_davis,
            quarter=1,
            start_time_seconds=480, # Start of Q1 (assuming 8 min quarters descending)
            end_time_seconds=450,
            duration_seconds=30,
            start_reason="Sprint Won",
            end_reason="Goal"
        )
        
        print("Database seeded successfully!")
    else:
        print("Match already exists, skipping detailed seed.")

    close_database()

if __name__ == '__main__':
    seed_data()
