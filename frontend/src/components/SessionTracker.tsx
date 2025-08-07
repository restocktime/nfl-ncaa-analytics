import React from 'react';
import { GamblingSession, GamblingLimits } from '../types/gambling';

interface SessionTrackerProps {
  session: GamblingSession | null;
  limits: GamblingLimits;
  isBreakTime: boolean;
  onTakeBreak: () => void;
  onEndBreak: () => void;
  onEndSession: () => void;
}

export const SessionTracker: React.FC<SessionTrackerProps> = ({
  session,
  limits,
  isBreakTime,
  onTakeBreak,
  onEndBreak,
  onEndSession
}) => {
  if (!session || !limits.enabled) {
    return null;
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTimeProgress = () => {
    return Math.min((session.duration / limits.sessionTimeLimit) * 100, 100);
  };

  const getActivityProgress = () => {
    return Math.min((session.activityCount / limits.dailyActivityLimit) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isBreakTime) {
    return (
      <div className="session-tracker break-mode">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Taking a Break</h3>
          <p className="text-gray-400 mb-4">
            Great choice! Taking breaks helps maintain healthy gambling habits.
          </p>
          <div className="space-y-2">
            <button
              onClick={onEndBreak}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Resume Session
            </button>
            <button
              onClick={onEndSession}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-tracker">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Session Tracker</h3>
        </div>
        
        <div className="space-y-4">
          {/* Session Time */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Session Time</span>
              <span>
                {formatDuration(session.duration)} / {formatDuration(limits.sessionTimeLimit)}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${getProgressColor(getTimeProgress())}`}
                style={{ width: `${getTimeProgress()}%` }}
              />
            </div>
          </div>

          {/* Activity Count */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Daily Activities</span>
              <span>
                {session.activityCount} / {limits.dailyActivityLimit}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${getProgressColor(getActivityProgress())}`}
                style={{ width: `${getActivityProgress()}%` }}
              />
            </div>
          </div>

          {/* Session Info */}
          <div className="text-xs text-gray-400 space-y-1">
            <div>Started: {new Date(session.startTime).toLocaleTimeString()}</div>
            <div>Last Activity: {new Date(session.lastActivity).toLocaleTimeString()}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onTakeBreak}
              className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              Take Break
            </button>
            <button
              onClick={onEndSession}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};