import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { uploadMatchQuarterVideo } from '../services/matchVideoStorage';

interface FilmEvent {
  id: string;
  type: 'goal' | 'exclusion' | 'penalty-foul' | 'timeout' | 'ejection' | 'referee-call';
  gameTime: number;
  quarter: number;
  team?: 'ucDavis' | 'opponent';
  playerName?: string;
  callType?: string;
}

interface FilmReviewPanelProps {
  replayEvents: FilmEvent[];
  quarterDurationSeconds: number;
  matchId: number | null;
  currentQuarter: number;
}

interface SyncCheckpoint {
  id: string;
  gameSec: number;
  videoSec: number;
  label: string;
}

export default function FilmReviewPanel({
  replayEvents,
  quarterDurationSeconds,
  matchId,
  currentQuarter,
}: FilmReviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { user } = useAuth();

  const [videoSrc, setVideoSrc] = useState('');
  const [videoOffsetSec, setVideoOffsetSec] = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [autoplayOnSeek, setAutoplayOnSeek] = useState(false);
  const [syncCheckpoints, setSyncCheckpoints] = useState<SyncCheckpoint[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);

  const orderedEvents = useMemo(
    () =>
      [...replayEvents].sort((a, b) => {
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        return b.gameTime - a.gameTime;
      }),
    [replayEvents],
  );

  const selectedEvent = useMemo(
    () => orderedEvents.find((ev) => ev.id === selectedEventId) ?? null,
    [orderedEvents, selectedEventId],
  );

  useEffect(() => {
    setSelectedQuarter(currentQuarter);
  }, [currentQuarter]);

  const toAbsoluteGameSeconds = (ev: FilmEvent) =>
    Math.max(0, (ev.quarter - 1) * quarterDurationSeconds + ev.gameTime);

  const mapGameToVideoSeconds = (gameSec: number) => {
    if (syncCheckpoints.length === 0) {
      return Math.max(0, videoOffsetSec + gameSec);
    }
    const ordered = [...syncCheckpoints].sort((a, b) => a.gameSec - b.gameSec);
    const checkpoint =
      [...ordered].reverse().find((cp) => cp.gameSec <= gameSec) ??
      ordered[0];
    return Math.max(0, checkpoint.videoSec + (gameSec - checkpoint.gameSec));
  };

  const toVideoSeconds = (ev: FilmEvent) =>
    mapGameToVideoSeconds(toAbsoluteGameSeconds(ev));

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLoadFile = (file: File | null) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const nextObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextObjectUrl;
    setVideoSrc(nextObjectUrl);
  };

  const handleSeekToEvent = (ev: FilmEvent) => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const seekSec = toVideoSeconds(ev);
    video.currentTime = seekSec;
    if (autoplayOnSeek) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const calibrateOffsetFromSelected = () => {
    const video = videoRef.current;
    if (!video || !selectedEvent) return;
    const eventGameSec = toAbsoluteGameSeconds(selectedEvent);
    setVideoOffsetSec(Math.round(video.currentTime - eventGameSec));
  };

  const addCheckpointFromSelected = () => {
    const video = videoRef.current;
    if (!video || !selectedEvent) {
      toast.error('Select an event first');
      return;
    }
    const gameSec = toAbsoluteGameSeconds(selectedEvent);
    const next: SyncCheckpoint = {
      id: `${Date.now()}-${selectedEvent.id}`,
      gameSec,
      videoSec: video.currentTime,
      label: `Q${selectedEvent.quarter} ${formatClock(selectedEvent.gameTime)}`,
    };
    setSyncCheckpoints((prev) => [...prev.filter((cp) => cp.gameSec !== gameSec), next]);
    toast.success('Sync checkpoint added');
  };

  const loadSavedSync = async (quarter: number) => {
    if (!matchId) return;
    try {
      const rows = await api.getMatchVideoSync(matchId);
      const row = rows.find((r) => r.quarter === quarter);
      if (row) {
        setVideoSrc(row.video_url);
        setVideoOffsetSec(row.video_offset_sec);
      }
    } catch (error) {
      console.error('Failed to load video sync:', error);
    }
  };

  const saveSync = async () => {
    if (!matchId || !videoSrc.trim()) {
      toast.error('Start a match and load a video first');
      return;
    }
    try {
      await api.upsertMatchVideoSync(matchId, {
        quarter: selectedQuarter,
        video_url: videoSrc.trim(),
        video_offset_sec: videoOffsetSec,
      });
      toast.success(`Video sync saved for Q${selectedQuarter}`);
    } catch (error) {
      console.error('Failed to save video sync:', error);
      toast.error('Could not save video sync');
    }
  };

  const handleCloudUpload = async (file: File | null) => {
    if (!file || !matchId) {
      toast.error('Select a video file');
      return;
    }
    if (!supabaseBrowser || !user) {
      toast.error('Sign in and configure Supabase Storage (bucket from VITE_SUPABASE_MATCH_VIDEO_BUCKET)');
      return;
    }
    setCloudBusy(true);
    try {
      const url = await uploadMatchQuarterVideo(matchId, selectedQuarter, file);
      setVideoSrc(url);
      await api.upsertMatchVideoSync(matchId, {
        quarter: selectedQuarter,
        video_url: url,
        video_offset_sec: videoOffsetSec,
      });
      toast.success(`Uploaded to storage and saved for Q${selectedQuarter}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setCloudBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    void loadSavedSync(selectedQuarter);
    setSyncCheckpoints([]);
  }, [matchId, selectedQuarter]);

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-[#022851] text-lg mb-2">Film Review</h3>
      <p className="text-xs text-gray-600 mb-3">
        Load a game clip, select an event, and jump directly to that moment in the video.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={videoSrc}
              onChange={(e) => setVideoSrc(e.target.value)}
              placeholder="Paste video URL or load local file below"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              Load File
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleLoadFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {supabaseBrowser && user && matchId != null && (
              <label className="inline-flex items-center justify-center rounded border border-[#022851] bg-[#022851]/5 px-3 py-2 text-sm cursor-pointer hover:bg-[#022851]/10 disabled:opacity-50">
                {cloudBusy ? 'Uploading…' : 'Upload to cloud'}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={cloudBusy}
                  onChange={(e) => void handleCloudUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-2">
            <label className="text-xs text-gray-700">Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={saveSync}>
              Save Sync
            </Button>
          </div>

          <video
            ref={videoRef}
            src={videoSrc || undefined}
            controls
            className="w-full rounded-lg border border-gray-200 bg-black"
          />

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-2">
            <label className="text-xs text-gray-700">Video Offset (sec)</label>
            <input
              type="number"
              value={videoOffsetSec}
              onChange={(e) => setVideoOffsetSec(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={calibrateOffsetFromSelected}
              disabled={!selectedEvent || !videoSrc}
            >
              Calibrate From Selected Event
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
            <div className="text-xs text-gray-600 self-center">
              Checkpoints improve sync when gameplay has stoppages.
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addCheckpointFromSelected}
              disabled={!selectedEvent || !videoSrc}
            >
              Add Checkpoint
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSyncCheckpoints([])}
              disabled={syncCheckpoints.length === 0}
            >
              Clear Checkpoints
            </Button>
          </div>

          {syncCheckpoints.length > 0 && (
            <div className="rounded border border-gray-200 bg-gray-50 p-2">
              <div className="text-xs font-semibold text-[#022851] mb-1">
                Sync Checkpoints ({syncCheckpoints.length})
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {[...syncCheckpoints]
                  .sort((a, b) => a.gameSec - b.gameSec)
                  .map((cp) => (
                    <div key={cp.id} className="flex items-center justify-between rounded bg-white border border-gray-200 px-2 py-1 text-xs">
                      <span>
                        {cp.label} {'->'} Video {formatClock(Math.floor(cp.videoSec))}
                      </span>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          setSyncCheckpoints((prev) => prev.filter((x) => x.id !== cp.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={autoplayOnSeek}
              onChange={(e) => setAutoplayOnSeek(e.target.checked)}
            />
            Autoplay when seeking
          </label>

          <div className="rounded border border-gray-200 bg-gray-50 p-2">
            <div className="text-xs font-semibold text-[#022851] mb-1">
              Event Queue ({orderedEvents.length})
            </div>
            {orderedEvents.length === 0 ? (
              <div className="text-xs text-gray-500">No events logged yet.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1">
                {orderedEvents.map((ev) => {
                  const isSelected = selectedEventId === ev.id;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        handleSeekToEvent(ev);
                      }}
                      className={`w-full text-left rounded border px-2 py-1 text-xs ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{ev.type}</div>
                    {ev.callType && <div className="text-gray-600">Call: {ev.callType}</div>}
                      <div className="text-gray-600">
                        Q{ev.quarter} {formatClock(ev.gameTime)}
                        {ev.team && ` - ${ev.team === 'ucDavis' ? 'UC Davis' : 'Opponent'}`}
                        {ev.playerName && ` - ${ev.playerName}`}
                      </div>
                      <div className="text-gray-500">
                        Video @ {formatClock(Math.max(0, Math.floor(toVideoSeconds(ev))))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
