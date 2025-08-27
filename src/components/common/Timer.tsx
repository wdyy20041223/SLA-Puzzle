import React from 'react';
import './Timer.css';

interface TimerProps {
  time: number; // 时间（秒）
  isRunning?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ time, isRunning = false, className = '' }) => {
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`timer ${isRunning ? 'timer-running' : ''} ${className}`}>
      <span className="timer-icon">⏱️</span>
      <span className="timer-text">{formatTime(time)}</span>
    </div>
  );
};