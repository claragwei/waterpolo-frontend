# Required packages (install with pip before running):
#   pip install supabase python-dotenv pandas numpy scikit-learn matplotlib seaborn

import json
import math
import sys
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from dotenv import dotenv_values
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
OUTPUT_DIR = SCRIPT_DIR / 'output'
PLOTS_DIR = OUTPUT_DIR / 'plots'

MIN_GAMES = 5

# Stat columns pulled from playermatchstats
STAT_COLS = [
    'goals', 'shots', 'assists', 'steals', 'blocks',
    'turnovers', 'rebounds', 'sprints', 'hustle', 'draws',
    'penalties', 'exclusions',
]

# ---------------------------------------------------------------------------
# Score computation (mirrors compute_and_save_score in main.py)
# ---------------------------------------------------------------------------

def _compute_performance_score(row) -> float:
    shots = max(row['shots'], 0.1)
    MAX = {'conversion': 0.60, 'assists': 3.0, 'steals': 2.5,
           'rebounds': 2.0, 'sprints': 1.5, 'hustle': 3.0, 'draws': 2.0}
    def norm(val, max_val):
        return min(val / max_val * 100, 100)
    return round(
        norm(row['goals'] / shots, MAX['conversion']) * 0.32 +
        norm(row['assists'],       MAX['assists'])     * 0.16 +
        norm(row['steals'],        MAX['steals'])      * 0.16 +
        norm(row['rebounds'],      MAX['rebounds'])    * 0.08 +
        norm(row['sprints'],       MAX['sprints'])     * 0.08 +
        norm(row['hustle'],        MAX['hustle'])      * 0.07 +
        norm(row['draws'],         MAX['draws'])       * 0.05,
        1,
    )


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

def _load_supabase_client():
    # Root .env has VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (frontend convention).
    # backend/.env has DATABASE_URL. We merge both and check all key variants.
    env = {
        **dotenv_values(REPO_ROOT / '.env'),
        **dotenv_values(REPO_ROOT / 'backend' / '.env'),
    }
    url = env.get('SUPABASE_URL') or env.get('VITE_SUPABASE_URL')
    key = (env.get('SUPABASE_SERVICE_ROLE_KEY')
           or env.get('SUPABASE_ANON_KEY')
           or env.get('VITE_SUPABASE_ANON_KEY'))
    if not url or not key:
        print('ERROR: Supabase credentials not found.')
        print('  Expected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) in .env')
        sys.exit(1)
    from supabase import create_client
    client = create_client(url, key)
    print(f'Connected to Supabase at {url[:45]}...')
    return client


# ---------------------------------------------------------------------------
# Step 1 — Data loading
# ---------------------------------------------------------------------------

def load_data(client) -> pd.DataFrame:
    print('\n[Step 1] Loading data from Supabase...')

    match_resp = client.table('match').select('id').eq('status', 'completed').execute()
    completed_ids = [r['id'] for r in match_resp.data]
    if not completed_ids:
        print('  No completed matches found — nothing to analyse.')
        sys.exit(0)
    print(f'  Found {len(completed_ids)} completed match(es).')

    select_cols = ','.join(['id', 'match_id', 'player_id', 'time_in_pool'] + STAT_COLS)
    stats_resp = (
        client.table('playermatchstats')
        .select(select_cols)
        .in_('match_id', completed_ids)
        .gt('time_in_pool', 0)
        .execute()
    )
    if not stats_resp.data:
        print('  No stats rows with time_in_pool > 0 for completed matches.')
        sys.exit(0)

    player_resp = client.table('player').select('id,name').execute()
    player_map = {p['id']: p['name'] for p in player_resp.data}

    df = pd.DataFrame(stats_resp.data)
    df['player_name'] = df['player_id'].map(player_map).fillna('Unknown')
    df['time_in_pool'] = df['time_in_pool'].astype(float)
    for col in STAT_COLS:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    df['performance_score'] = df.apply(_compute_performance_score, axis=1).astype(float)

    n_records = len(df)
    n_players = df['player_id'].nunique()
    n_matches = df['match_id'].nunique()
    game_counts = df.groupby('player_id').size()
    low_ids = game_counts[game_counts < MIN_GAMES].index.tolist()

    print(f'  Loaded {n_records} records — {n_players} unique players, {n_matches} unique matches.')
    if low_ids:
        print(f'  Low-sample players (< {MIN_GAMES} games, excluded from regression):')
        for pid in low_ids:
            print(f'    - {player_map.get(pid, f"Player {pid}")}: {game_counts[pid]} game(s)')

    return df


# ---------------------------------------------------------------------------
# Step 2 — Correlation analysis
# ---------------------------------------------------------------------------

def correlation_analysis(df: pd.DataFrame) -> float:
    print('\n[Step 2] Exploratory correlation analysis...')
    r = float(df['time_in_pool'].corr(df['performance_score']))
    print(f'  Pearson r (time_in_pool vs performance_score): {r:.4f}')
    return r


# ---------------------------------------------------------------------------
# Plots
# ---------------------------------------------------------------------------

def _save_plots(df: pd.DataFrame, fitted: dict):
    print('\n  Generating plots...')
    sns.set_theme(style='whitegrid')

    # 1. scatter_overall.png
    fig, ax = plt.subplots(figsize=(11, 6))
    player_names = sorted(df['player_name'].unique())
    palette = sns.color_palette('tab20', len(player_names))
    for i, name in enumerate(player_names):
        sub = df[df['player_name'] == name]
        ax.scatter(sub['time_in_pool'], sub['performance_score'],
                   label=name, color=palette[i], alpha=0.75, s=55, edgecolors='none')
    X_all = df['time_in_pool'].values.reshape(-1, 1)
    y_all = df['performance_score'].values
    lr_global = LinearRegression().fit(X_all, y_all)
    x_line = np.linspace(float(X_all.min()), float(X_all.max()), 200).reshape(-1, 1)
    ax.plot(x_line, lr_global.predict(x_line), 'k--', lw=2, label='Global OLS')
    ax.set_xlabel('Time in Pool (seconds)')
    ax.set_ylabel('Performance Score')
    ax.set_title('Time in Pool vs Performance Score — All Players')
    ax.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=7)
    plt.tight_layout()
    fig.savefig(PLOTS_DIR / 'scatter_overall.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print('    scatter_overall.png')

    # 2. scatter_by_player.png
    eligible_names = sorted([m['player_name'] for m in fitted.values()])
    if eligible_names:
        n = len(eligible_names)
        ncols = min(3, n)
        nrows = math.ceil(n / ncols)
        fig, axes = plt.subplots(nrows, ncols, figsize=(5 * ncols, 4 * nrows), squeeze=False)
        for idx, name in enumerate(eligible_names):
            ax = axes[idx // ncols][idx % ncols]
            sub = df[df['player_name'] == name]
            ax.scatter(sub['time_in_pool'], sub['performance_score'], s=40, alpha=0.75)
            Xp = sub['time_in_pool'].values.reshape(-1, 1)
            yp = sub['performance_score'].values
            lr_p = LinearRegression().fit(Xp, yp)
            r2 = r2_score(yp, lr_p.predict(Xp))
            xr = np.linspace(float(Xp.min()), float(Xp.max()), 100).reshape(-1, 1)
            ax.plot(xr, lr_p.predict(xr), 'r-', lw=1.5)
            ax.annotate(f'R²={r2:.2f}', xy=(0.05, 0.88), xycoords='axes fraction', fontsize=9)
            ax.set_title(name, fontsize=9)
            ax.set_xlabel('Time (s)', fontsize=8)
            ax.set_ylabel('Score', fontsize=8)
        for idx in range(n, nrows * ncols):
            axes[idx // ncols][idx % ncols].set_visible(False)
        fig.suptitle('Per-Player: Time in Pool vs Performance Score', fontsize=12, y=1.01)
        plt.tight_layout()
        fig.savefig(PLOTS_DIR / 'scatter_by_player.png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        print('    scatter_by_player.png')

    # 3. score_distribution.png
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.histplot(df['performance_score'], bins=20, kde=True, ax=ax, color='steelblue')
    ax.set_xlabel('Performance Score')
    ax.set_ylabel('Count')
    ax.set_title('Distribution of Performance Scores')
    plt.tight_layout()
    fig.savefig(PLOTS_DIR / 'score_distribution.png', dpi=150)
    plt.close(fig)
    print('    score_distribution.png')

    # 4. playtime_distribution.png
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.histplot(df['time_in_pool'], bins=20, kde=True, ax=ax, color='teal')
    ax.set_xlabel('Time in Pool (seconds)')
    ax.set_ylabel('Count')
    ax.set_title('Distribution of Time in Pool')
    plt.tight_layout()
    fig.savefig(PLOTS_DIR / 'playtime_distribution.png', dpi=150)
    plt.close(fig)
    print('    playtime_distribution.png')

    # 5. residuals_by_player.png
    records = []
    for pid, m in fitted.items():
        sub = df[df['player_id'] == pid]
        Xp = sub['time_in_pool'].values.reshape(-1, 1)
        yp = sub['performance_score'].values
        preds = m['_model'].predict(Xp)
        for res in (yp - preds):
            records.append({'player_name': m['player_name'], 'residual': float(res)})
    if records:
        res_df = pd.DataFrame(records)
        order = res_df.groupby('player_name')['residual'].std().sort_values().index.tolist()
        fig, ax = plt.subplots(figsize=(max(8, len(order) * 1.5), 5))
        sns.boxplot(data=res_df, x='player_name', y='residual', order=order, ax=ax)
        ax.axhline(0, color='r', linestyle='--', lw=1.2)
        ax.set_xlabel('Player (sorted by residual std — most consistent left)')
        ax.set_ylabel('Residual (Actual − Predicted)')
        ax.set_title('Residuals by Player')
        plt.xticks(rotation=30, ha='right')
        plt.tight_layout()
        fig.savefig(PLOTS_DIR / 'residuals_by_player.png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        print('    residuals_by_player.png')


# ---------------------------------------------------------------------------
# Step 3 — Per-player regression
# ---------------------------------------------------------------------------

def fit_models(df: pd.DataFrame) -> dict:
    print(f'\n[Step 3] Fitting per-player regression models (min {MIN_GAMES} games)...')
    fitted = {}

    for pid in sorted(df['player_id'].unique()):
        sub = df[df['player_id'] == pid]
        name = sub['player_name'].iloc[0]
        n = len(sub)

        if n < MIN_GAMES:
            print(f'  Skipping {name} — only {n} game(s) (need {MIN_GAMES})')
            continue

        print(f'  Fitting model for {name} ({n} games)...')
        X = sub['time_in_pool'].values.reshape(-1, 1)
        y = sub['performance_score'].values

        lr = LinearRegression().fit(X, y)
        preds = lr.predict(X)
        residuals = y - preds

        fitted[pid] = {
            '_model': lr,
            'player_id': int(pid),
            'player_name': name,
            'slope': round(float(lr.coef_[0]), 6),
            'intercept': round(float(lr.intercept_), 4),
            'r_squared': round(float(r2_score(y, preds)), 4),
            'rmse': round(float(math.sqrt(mean_squared_error(y, preds))), 4),
            'games_used': int(n),
            'std_dev_residuals': round(float(residuals.std()), 4),
            'mean_score': round(float(y.mean()), 4),
            'mean_residual': round(float(residuals.mean()), 6),
            'min_time_in_pool': round(float(X.min()), 1),
            'max_time_in_pool': round(float(X.max()), 1),
        }

    return fitted


# ---------------------------------------------------------------------------
# Step 4 — Thresholds
# ---------------------------------------------------------------------------

def compute_thresholds(fitted: dict) -> list:
    print('\n[Step 4] Computing classification thresholds...')
    baselines = []
    for m in fitted.values():
        above = round(m['mean_residual'] + 1.0 * m['std_dev_residuals'], 4)
        below = round(m['mean_residual'] - 1.0 * m['std_dev_residuals'], 4)
        baselines.append({
            'player_id': m['player_id'],
            'player_name': m['player_name'],
            'slope': m['slope'],
            'intercept': m['intercept'],
            'r_squared': m['r_squared'],
            'rmse': m['rmse'],
            'std_dev_residuals': m['std_dev_residuals'],
            'mean_score': m['mean_score'],
            'games_used': m['games_used'],
            'above_threshold': above,
            'below_threshold': below,
            'min_time_in_pool': m['min_time_in_pool'],
            'max_time_in_pool': m['max_time_in_pool'],
        })
        print(f'  {m["player_name"]}: above={above:+.2f}, below={below:+.2f}')
    return baselines


# ---------------------------------------------------------------------------
# Step 5 — Export
# ---------------------------------------------------------------------------

def export_results(df: pd.DataFrame, baselines: list, pearson_r: float):
    print('\n[Step 5] Exporting results...')

    with open(OUTPUT_DIR / 'player_baselines.json', 'w') as f:
        json.dump(baselines, f, indent=2)
    print(f'  Saved player_baselines.json ({len(baselines)} player(s))')

    df.drop(columns=['id'], errors='ignore').to_csv(OUTPUT_DIR / 'raw_data.csv', index=False)
    print(f'  Saved raw_data.csv ({len(df)} rows)')

    game_counts = df.groupby('player_id').size()
    pid_to_name = df.set_index('player_id')['player_name'].to_dict()
    excluded = {pid: cnt for pid, cnt in game_counts.items() if cnt < MIN_GAMES}

    lines = [
        '=' * 62,
        'WATER POLO PERFORMANCE ANALYSIS SUMMARY',
        '=' * 62,
        '',
        f'Pearson r (time_in_pool vs performance_score): {pearson_r:.4f}',
        f'Total records: {len(df)}',
        f'Unique players: {df["player_id"].nunique()}',
        f'Unique matches: {df["match_id"].nunique()}',
        '',
        '--- Per-Player Models (ranked by R²) ---',
    ]
    for b in sorted(baselines, key=lambda x: x['r_squared'], reverse=True):
        flag = '  ⚠ POOR FIT' if b['r_squared'] < 0.3 else ''
        lines.append(
            f"  {b['player_name']:<22}  R²={b['r_squared']:.3f}  "
            f"RMSE={b['rmse']:.2f}  games={b['games_used']}{flag}"
        )

    if excluded:
        lines += ['', '--- Excluded (insufficient data) ---']
        for pid, cnt in sorted(excluded.items(), key=lambda x: x[1]):
            lines.append(f"  {pid_to_name.get(pid, f'Player {pid}'):<22}  {cnt} game(s)")

    poor = [b for b in baselines if b['r_squared'] < 0.3]
    if poor:
        lines += ['', '--- Poor Fit Players (R² < 0.3) — high variance ---']
        for b in poor:
            lines.append(f"  {b['player_name']}: R²={b['r_squared']:.3f}")

    lines += ['', '=' * 62]

    with open(OUTPUT_DIR / 'analysis_summary.txt', 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('  Saved analysis_summary.txt')


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)

    client = _load_supabase_client()

    df = load_data(client)
    pearson_r = correlation_analysis(df)
    fitted = fit_models(df)

    if not fitted:
        print(f'\nNo players have {MIN_GAMES}+ completed games yet — skipping model fitting.')
        print('Run again after more match data is recorded.')
        sys.exit(0)

    baselines = compute_thresholds(fitted)
    _save_plots(df, fitted)
    export_results(df, baselines, pearson_r)

    print(f'\nDone. Outputs in {OUTPUT_DIR}:')
    print(f'  player_baselines.json  ← Phase 3 dashboard input')
    print(f'  raw_data.csv')
    print(f'  analysis_summary.txt')
    print(f'  plots/scatter_overall.png')
    print(f'  plots/scatter_by_player.png')
    print(f'  plots/score_distribution.png')
    print(f'  plots/playtime_distribution.png')
    print(f'  plots/residuals_by_player.png')
