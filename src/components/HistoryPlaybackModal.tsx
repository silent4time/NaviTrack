import React, { useState, useEffect, useRef } from 'react';
import { Device } from '../types/tracker';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Gauge,
  Navigation,
  Calendar,
  MapPin,
} from 'lucide-react';

interface HistoryPlaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const HistoryPlaybackModal: React.FC<HistoryPlaybackModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const intervalRef = useRef<number | null>(null);

  if (!isOpen || !device) return null;

  const trail = device.historyTrail;
  const totalPoints = Math.max(trail.length, 1);
  const currentPointIndex = Math.min(
    Math.floor((progress / 100) * (totalPoints - 1)),
    totalPoints - 1
  );
  const currentCoords = trail[currentPointIndex] || [device.telemetry.latitude, device.telemetry.longitude];

  // Simulated timestamp based on progress
  const simulatedMinutesAgo = Math.round((100 - progress) * 1.5);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return Math.min(prev + 1.2 * playbackSpeed, 100);
        });
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">بازپخش سابقه مسیر (History Playback)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {device.name} ({device.plateNumber}) - IMEI: {device.imei}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Trip Summary Metrics */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <div>
              <span className="block text-[10px] text-slate-400">مسافت طی شده</span>
              <span className="text-xs md:text-sm font-black text-cyan-400">۲۴.۸ km</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">میانگین سرعت</span>
              <span className="text-xs md:text-sm font-black text-white">۵۲ km/h</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">حداکثر سرعت</span>
              <span className="text-xs md:text-sm font-black text-amber-400">۹۴ km/h</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">مدت زمان سفر</span>
              <span className="text-xs md:text-sm font-black text-emerald-400">۳۵ دقیقه</span>
            </div>
          </div>

          {/* Current Frame Status */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400">موقعیت نقطه فعلی:</span>
                <span className="font-mono text-slate-200 mr-2 font-bold" dir="ltr">
                  {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{simulatedMinutesAgo === 0 ? 'هم‌اکنون (لحظه‌ای)' : `${simulatedMinutesAgo} دقیقه قبل`}</span>
            </div>
          </div>

          {/* Playback Scrubber Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>شروع مسیر (مبدا)</span>
              <span className="font-mono font-bold text-cyan-400">{Math.round(progress)}%</span>
              <span>پایان مسیر (مقصد)</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Playback Controls Toolbar */}
          <div className="flex items-center justify-between pt-2">
            {/* Speed Options */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play/Pause & Restart */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                title="شروع مجدد از اول"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>توقف موقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>پخش مسیر</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
