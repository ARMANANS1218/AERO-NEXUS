import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause } from 'lucide-react';

export default function ActivityTimer({ isActive = true }) {
  const [activeTime, setActiveTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [todayActive, setTodayActive] = useState(0);
  const [timerRunning, setTimerRunning] = useState(isActive);

  // Main timer that tracks active time
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setActiveTime(prev => prev + 1);
      setTodayActive(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format seconds to readable time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Active Time Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 dark:text-gray-400">Active Time</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatTime(activeTime)}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleTimer}
        className={`p-2 rounded-lg transition-colors ${
          timerRunning
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
        }`}
        title={timerRunning ? 'Go on Break' : 'Resume Work'}
      >
        {timerRunning ? (
          <Play className="w-4 h-4" />
        ) : (
          <Pause className="w-4 h-4" />
        )}
      </button>

      {/* Status Badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        timerRunning
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
      }`}>
        {timerRunning ? 'Working' : 'Break'}
      </div>
    </div>
  );
}
