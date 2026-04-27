import { useEffect, useRef } from 'react';

interface HeatmapCanvasProps {
  points: Array<{ x: number; y: number }> | null;
  width?: number;
}

function drawHeatmapLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: Array<{ x: number; y: number }>
) {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d')!;

  const radius = Math.min(w, h) * 0.08;
  octx.globalCompositeOperation = 'screen';

  for (const pt of points) {
    const cx = (pt.x / 100) * w;
    const cy = (pt.y / 100) * h;
    const grad = octx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(cx, cy, radius, 0, Math.PI * 2);
    octx.fill();
  }

  const imgData = octx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const brightness = d[i];
    if (brightness < 8) {
      d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0;
    } else if (brightness < 85) {
      const t = brightness / 85;
      d[i] = 255; d[i + 1] = Math.round(215 * t); d[i + 2] = 0;
      d[i + 3] = Math.round(160 * t);
    } else if (brightness < 170) {
      const t = (brightness - 85) / 85;
      d[i] = 255; d[i + 1] = Math.round(215 * (1 - t * 0.7)); d[i + 2] = 0;
      d[i + 3] = Math.round(160 + 60 * t);
    } else {
      const t = (brightness - 170) / 85;
      d[i] = 255; d[i + 1] = Math.round(65 * (1 - t)); d[i + 2] = 0;
      d[i + 3] = Math.min(255, Math.round(220 + 35 * t));
    }
  }
  octx.putImageData(imgData, 0, 0);

  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(offscreen, 0, 0);
}

export default function HeatmapCanvas({ points, width }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pool = poolRef.current;
    if (!canvas || !pool) return;

    function render() {
      const w = pool!.clientWidth;
      const h = pool!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;

      const ctx = canvas!.getContext('2d');
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
        drawHeatmapLayer(ctx, w, h, safePoints);
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
