import React, { useState, useEffect, useRef } from 'react';
import { Device } from '../types/tracker';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Gauge,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';

interface ProtrackPlaybackBarProps {
  device: Device | null;
  onClose: () => void;
  onFrameUpdate?: (lat: number, lng: number) => void;
}

export const ProtrackPlaybackBar: React.FC<ProtrackPlaybackBarProps> = ({
  device,
  onClose,
  onFrameUpdate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(2);
  const intervalRef = useRef<number | null>(null);

  if (!device) return null;

  const trail = device.historyTrail;
  const totalPoints = Math.max(trail.length, 1);
  const currentPointIndex = Math.min(
    Math.floor((progress / 100) * (totalPoints - 1)),
    totalPoints - 1
  );
  const currentCoords = trail[currentPointIndex] || [device.telemetry.latitude, device.telemetry.longitude];

  useEffect(() => {
    if (onFrameUpdate) {
      onFrameUpdate(currentCoords[0], currentCoords[1]);
    }
  }, [progress]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return Math.min(prev + 1.2 * speedMultiplier, 100);
        });
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-20 md:right-20 z-[450] animate-in slide-in-from-bottom-3 select-none">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-xs text-white flex flex-col gap-2.5">
        {/* Top Header of Playback dock */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-bold">بازپخش سابقه مسیر: {device.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">({device.plateNumber})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span dir="ltr">
                {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrubber slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono">00:00</span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="text-[10px] text-cyan-400 font-mono font-bold">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Speed Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
            {[1, 2, 4, 8].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                  speedMultiplier === spd ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Playback action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              title="شروع مجدد"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer shadow-md"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'توقف' : 'پخش حرکت'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
