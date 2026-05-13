import { useEffect, useRef } from 'react';

interface HeatmapCanvasProps {
  points: Array<{ x: number; y: number }> | null;
  width?: number;
}

const GRID_COLS = 72;

function buildDensityGrid(
  points: Array<{ x: number; y: number }>,
  cols: number,
  rows: number,
): Float32Array {
  const grid = new Float32Array(cols * rows);
  for (const pt of points) {
    const gx = Math.min(cols - 1, Math.max(0, Math.floor((pt.x / 100) * cols)));
    const gy = Math.min(rows - 1, Math.max(0, Math.floor((pt.y / 100) * rows)));
    grid[gy * cols + gx] += 1;
  }
  return grid;
}

function boxBlur2D(src: Float32Array, cols: number, rows: number): Float32Array {
  const dst = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0;
      let c = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            sum += src[ny * cols + nx];
            c++;
          }
        }
      }
      dst[y * cols + x] = sum / c;
    }
  }
  return dst;
}

/** Normalize by max density so sparse vs busy games both use the color scale. */
function colorForNormalizedT(t: number): [number, number, number, number] {
  if (t <= 0.02) return [0, 0, 0, 0];
  // Cool (sparse) → yellow → red (dense)
  if (t < 0.35) {
    const u = t / 0.35;
    return [30, 100 + 100 * u, 200 - 80 * u, Math.round(25 + 90 * u)];
  }
  if (t < 0.65) {
    const u = (t - 0.35) / 0.3;
    return [200 + 55 * u, 200 - 80 * u, 30, Math.round(115 + 90 * u)];
  }
  const u = (t - 0.65) / 0.35;
  return [255, Math.round(120 - 90 * u), Math.round(30 - 15 * u), Math.round(205 + 50 * u)];
}

function drawDensityHeatmap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: Array<{ x: number; y: number }>,
) {
  const rows = Math.max(36, Math.round(GRID_COLS * (h / w)));
  let grid = buildDensityGrid(points, GRID_COLS, rows);
  grid = boxBlur2D(grid, GRID_COLS, rows);
  grid = boxBlur2D(grid, GRID_COLS, rows);

  let max = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > max) max = grid[i];
  }
  if (max < 1e-9) max = 1;

  const small = document.createElement('canvas');
  small.width = GRID_COLS;
  small.height = rows;
  const sctx = small.getContext('2d');
  if (!sctx) return;

  const img = sctx.createImageData(GRID_COLS, rows);
  const d = img.data;
  for (let i = 0; i < grid.length; i++) {
    const t = grid[i] / max;
    const [r, g, b, a] = colorForNormalizedT(t);
    const o = i * 4;
    d[o] = r;
    d[o + 1] = g;
    d[o + 2] = b;
    d[o + 3] = a;
  }
  sctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(small, 0, 0, w, h);
  ctx.restore();
}

export default function HeatmapCanvas({ points, width }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pool = poolRef.current;
    if (!canvas || !pool) return;

    function render() {
      const w = pool.clientWidth;
      const h = pool.clientHeight;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);

      const safePoints = points ?? [];
      if (safePoints.length === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(14, Math.round(w * 0.03))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data available for this selection.', w / 2, h / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      } else {
        drawDensityHeatmap(ctx, w, h, safePoints);
      }
    }

    render();

    const observer = new ResizeObserver(render);
    observer.observe(pool);
    return () => observer.disconnect();
  }, [points]);

  return (
    <div style={{ width: width ? `${width}px` : '100%' }}>
      {/* Opponent Goal */}
      <div className="text-center mb-3">
        <div className="inline-block">
          <div className="w-48 h-12 bg-white/90 border-4 border-white rounded-t-lg mx-auto relative overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border border-gray-300" />
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-1">Opponent Goal</div>
        </div>
      </div>

      {/* Pool */}
      <div
        ref={poolRef}
        className="relative border-4 border-yellow-400 border-dashed rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500"
        style={{ height: '600px' }}
      >
        {/* Goal Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-white/60 border-b-2 border-white pointer-events-none">
          <span className="absolute right-2 top-0 text-xs text-white font-bold">Goal Line</span>
        </div>

        {/* 2m Line */}
        <div
          className="absolute left-0 right-0 h-1 bg-red-500 pointer-events-none"
          style={{ top: '15%' }}
        >
          <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">2m</span>
        </div>

        {/* 5m Line */}
        <div
          className="absolute left-0 right-0 h-1 bg-yellow-400 pointer-events-none"
          style={{ top: '50%' }}
        >
          <span className="absolute right-2 -top-1 text-xs text-white font-bold drop-shadow">5m</span>
        </div>

        {/* 7m Line */}
        <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/60 pointer-events-none">
          <span className="absolute right-2 -top-1 text-xs text-white font-bold">7m</span>
        </div>

        {/* Heatmap canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* UC Davis Goal */}
      <div className="text-center mt-3">
        <div className="text-xs text-gray-600 mb-1">UC Davis Goal</div>
        <div className="inline-block">
          <div className="w-48 h-12 bg-gradient-to-b from-[#FFBF00] to-[#ffcc33] border-4 border-[#FFBF00] rounded-b-lg mx-auto relative overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-[2px] p-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border border-[#022851]/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
