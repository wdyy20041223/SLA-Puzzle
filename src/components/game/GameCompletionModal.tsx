import React from 'react';
import { GameCompletionResult } from '../../types';
import { Button } from '../common/Button';
import './GameCompletionModal.css';

interface GameCompletionModalProps {
  result: GameCompletionResult;
  isVisible: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  result,
  isVisible,
  onPlayAgain,
  onBackToMenu,
}) => {
  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyText = (difficulty: string) => {
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    };
    return difficultyMap[difficulty as keyof typeof difficultyMap] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap = {
      easy: '#22c55e',
      medium: '#3b82f6',
      hard: '#f59e0b',
      expert: '#ef4444'
    };
    return colorMap[difficulty as keyof typeof colorMap] || '#6b7280';
  };

  return (
    <div className="game-completion-modal-overlay">
      <div className="game-completion-modal">
        <div className="modal-header">
          <div className="celebration-icon">🎉</div>
          <h2 className="modal-title">恭喜完成！</h2>
          {result.isNewRecord && (
            <div className="new-record-badge">
              🏆 新记录！
            </div>
          )}
        </div>

        <div className="game-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <div className="stat-content">
                <span className="stat-label">完成时间</span>
                <span className="stat-value">{formatTime(result.completionTime)}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👣</span>
              <div className="stat-content">
                <span className="stat-label">总步数</span>
                <span className="stat-value">{result.moves}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <div className="stat-content">
                <span className="stat-label">难度</span>
                <span 
                  className="stat-value difficulty"
                  style={{ color: getDifficultyColor(result.difficulty) }}
                >
                  {getDifficultyText(result.difficulty)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rewards-section">
          <h3 className="rewards-title">🎁 获得奖励</h3>
          <div className="rewards-grid">
            <div className="reward-item coins">
              <span className="reward-icon">💰</span>
              <div className="reward-content">
                <span className="reward-amount">+{result.rewards.coins}</span>
                <span className="reward-label">金币</span>
              </div>
            </div>
            <div className="reward-item experience">
              <span className="reward-icon">⭐</span>
              <div className="reward-content">
                <span className="reward-amount">+{result.rewards.experience}</span>
                <span className="reward-label">经验值</span>
              </div>
            </div>
          </div>
        </div>

        {result.rewards.achievements && result.rewards.achievements.length > 0 && (
          <div className="achievements-section">
            <h3 className="achievements-title">🏆 解锁成就</h3>
            <div className="achievements-list">
              {result.rewards.achievements.map((achievement) => (
                <div key={achievement.id} className="achievement-item">
                  <span className="achievement-icon">{achievement.icon}</span>
                  <div className="achievement-content">
                    <span className="achievement-name">{achievement.name}</span>
                    <span className="achievement-description">{achievement.description}</span>
                  </div>
                  <div className="achievement-new-badge">新获得!</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <Button 
            onClick={onPlayAgain} 
            variant="primary" 
            size="large"
            className="play-again-btn"
          >
            🔄 再玩一次
          </Button>
          <Button 
            onClick={onBackToMenu} 
            variant="secondary" 
            size="large"
            className="back-menu-btn"
          >
            🏠 返回菜单
          </Button>
        </div>
      </div>
    </div>
  );
};
