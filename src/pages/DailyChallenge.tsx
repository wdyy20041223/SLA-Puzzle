import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Timer } from '../components/common/Timer';
import './DailyChallenge.css';

interface DailyChallengeProps {
  onBackToMenu: () => void;
}

interface Challenge {
  id: string;
  date: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  puzzleImage: string;
  gridSize: string;
  timeLimit: number; // 秒
  perfectMoves: number;
  rewards: {
    completion: string;
    perfect: string;
    speed: string;
  };
  isCompleted: boolean;
  bestTime?: number;
  bestMoves?: number;
  attempts: number;
}

interface ChallengeHistory {
  date: string;
  challenge: Challenge;
  completed: boolean;
  stars: number; // 0-3星
  rewards: string[];
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBackToMenu }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'rewards'>('today');

  // 模拟今日挑战数据
  const todayChallenge: Challenge = {
    id: 'daily-2024-01-20',
    date: '2024-01-20',
    title: '梦幻城堡',
    description: '一座隐藏在云端的神秘城堡，等待着勇敢的冒险者来探索',
    difficulty: 'hard',
    puzzleImage: '/images/daily/castle-dream.jpg',
    gridSize: '5x5',
    timeLimit: 900, // 15分钟
    perfectMoves: 35,
    rewards: {
      completion: '金币 +100',
      perfect: '特殊称号：完美主义者',
      speed: '经验值 +50'
    },
    isCompleted: false,
    attempts: 0
  };

  // 模拟历史挑战数据
  const challengeHistory: ChallengeHistory[] = [
    {
      date: '2024-01-19',
      challenge: {
        id: 'daily-2024-01-19',
        date: '2024-01-19',
        title: '樱花飞舞',
        description: '春日樱花盛开的美景',
        difficulty: 'medium',
        puzzleImage: '/images/daily/sakura.jpg',
        gridSize: '4x4',
        timeLimit: 600,
        perfectMoves: 25,
        rewards: {
          completion: '金币 +80',
          perfect: '樱花头像框',
          speed: '经验值 +40'
        },
        isCompleted: true,
        bestTime: 425,
        bestMoves: 28,
        attempts: 2
      },
      completed: true,
      stars: 2,
      rewards: ['金币 +80', '经验值 +40']
    },
    {
      date: '2024-01-18',
      challenge: {
        id: 'daily-2024-01-18',
        date: '2024-01-18',
        title: '星空之夜',
        description: '浩瀚星空下的宁静夜晚',
        difficulty: 'expert',
        puzzleImage: '/images/daily/starry-night.jpg',
        gridSize: '6x6',
        timeLimit: 1200,
        perfectMoves: 50,
        rewards: {
          completion: '金币 +150',
          perfect: '星空特效',
          speed: '经验值 +75'
        },
        isCompleted: true,
        bestTime: 1050,
        bestMoves: 45,
        attempts: 3
      },
      completed: true,
      stars: 3,
      rewards: ['金币 +150', '星空特效', '经验值 +75']
    }
  ];

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    const colors = {
      easy: '#10b981',
      medium: '#3b82f6',
      hard: '#f59e0b',
      expert: '#ef4444'
    };
    return colors[difficulty];
  };

  const getDifficultyLabel = (difficulty: Challenge['difficulty']) => {
    const labels = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    };
    return labels[difficulty];
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartChallenge = () => {
    alert('开始每日挑战功能正在开发中！');
  };

  const renderTodayTab = () => (
    <div className="today-challenge">
      <div className="challenge-header">
        <div className="challenge-date">
          <span className="date-label">今日挑战</span>
          <span className="date-value">{new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div className="challenge-streak">
          <span className="streak-icon">🔥</span>
          <span className="streak-text">连击: 7天</span>
        </div>
      </div>

      <div className="challenge-card">
        <div className="challenge-image">
          <div className="image-placeholder">
            <span className="placeholder-icon">🏰</span>
            <span className="placeholder-text">预览图片</span>
          </div>
          <div 
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(todayChallenge.difficulty) }}
          >
            {getDifficultyLabel(todayChallenge.difficulty)}
          </div>
        </div>

        <div className="challenge-info">
          <h2 className="challenge-title">{todayChallenge.title}</h2>
          <p className="challenge-description">{todayChallenge.description}</p>

          <div className="challenge-stats">
            <div className="stat-item">
              <span className="stat-icon">🧩</span>
              <span className="stat-label">网格</span>
              <span className="stat-value">{todayChallenge.gridSize}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">时限</span>
              <span className="stat-value">{formatTime(todayChallenge.timeLimit)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">完美步数</span>
              <span className="stat-value">{todayChallenge.perfectMoves}</span>
            </div>
          </div>

          <div className="challenge-rewards">
            <h4>🎁 奖励内容</h4>
            <div className="rewards-grid">
              <div className="reward-item">
                <span className="reward-icon">✅</span>
                <span className="reward-label">完成奖励</span>
                <span className="reward-value">{todayChallenge.rewards.completion}</span>
              </div>
              <div className="reward-item">
                <span className="reward-icon">⭐</span>
                <span className="reward-label">完美奖励</span>
                <span className="reward-value">{todayChallenge.rewards.perfect}</span>
              </div>
              <div className="reward-item">
                <span className="reward-icon">⚡</span>
                <span className="reward-label">速度奖励</span>
                <span className="reward-value">{todayChallenge.rewards.speed}</span>
              </div>
            </div>
          </div>

          <div className="challenge-actions">
            <Button
              onClick={handleStartChallenge}
              variant="primary"
              size="large"
              className="start-challenge-btn"
            >
              🎮 开始挑战
            </Button>
            
            {todayChallenge.isCompleted && (
              <Button
                onClick={handleStartChallenge}
                variant="secondary"
                size="large"
                className="retry-challenge-btn"
              >
                🔄 再次挑战
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="challenge-tips">
        <h4>💡 挑战提示</h4>
        <div className="tips-list">
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">完美步数内完成可获得特殊奖励</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⏰</span>
            <span className="tip-text">每日挑战在午夜12点重置</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🔥</span>
            <span className="tip-text">连续完成挑战可获得连击奖励</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="challenge-history">
      <div className="history-header">
        <h3>📅 挑战历史</h3>
        <div className="history-stats">
          <div className="stat-item">
            <span className="stat-value">{challengeHistory.filter(h => h.completed).length}</span>
            <span className="stat-label">已完成</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{challengeHistory.length}</span>
            <span className="stat-label">总挑战</span>
          </div>
        </div>
      </div>

      <div className="history-list">
        {challengeHistory.map((history, index) => (
          <div key={history.date} className="history-item">
            <div className="history-date">
              <span className="date-text">{new Date(history.date).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>

            <div className="history-content">
              <div className="history-info">
                <h4 className="history-title">{history.challenge.title}</h4>
                <div className="history-meta">
                  <span 
                    className="difficulty-tag"
                    style={{ backgroundColor: getDifficultyColor(history.challenge.difficulty) }}
                  >
                    {getDifficultyLabel(history.challenge.difficulty)}
                  </span>
                  <span className="grid-tag">{history.challenge.gridSize}</span>
                </div>
              </div>

              <div className="history-result">
                {history.completed ? (
                  <>
                    <div className="stars-display">
                      {Array.from({ length: 3 }, (_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < history.stars ? 'filled' : 'empty'}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <div className="result-stats">
                      <span className="result-time">
                        ⏱️ {formatTime(history.challenge.bestTime || 0)}
                      </span>
                      <span className="result-moves">
                        🎯 {history.challenge.bestMoves}步
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="not-completed">
                    <span className="not-completed-text">未完成</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRewardsTab = () => (
    <div className="rewards-summary">
      <div className="rewards-header">
        <h3>🏆 奖励总览</h3>
        <div className="total-rewards">
          <div className="reward-stat">
            <span className="reward-icon">💰</span>
            <span className="reward-amount">2,340</span>
            <span className="reward-label">总金币</span>
          </div>
          <div className="reward-stat">
            <span className="reward-icon">⭐</span>
            <span className="reward-amount">165</span>
            <span className="reward-label">总经验</span>
          </div>
        </div>
      </div>

      <div className="rewards-categories">
        <div className="reward-category">
          <h4>🎨 解锁内容</h4>
          <div className="unlocked-items">
            <div className="unlocked-item">
              <span className="item-icon">🖼️</span>
              <span className="item-name">樱花头像框</span>
              <span className="item-date">1月19日</span>
            </div>
            <div className="unlocked-item">
              <span className="item-icon">✨</span>
              <span className="item-name">星空特效</span>
              <span className="item-date">1月18日</span>
            </div>
            <div className="unlocked-item">
              <span className="item-icon">👑</span>
              <span className="item-name">完美主义者</span>
              <span className="item-date">1月17日</span>
            </div>
          </div>
        </div>

        <div className="reward-category">
          <h4>🎯 成就进度</h4>
          <div className="achievement-progress">
            <div className="progress-item">
              <span className="progress-label">连续挑战</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '70%' }} />
              </div>
              <span className="progress-text">7/10天</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">完美挑战</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '40%' }} />
              </div>
              <span className="progress-text">2/5次</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">速度挑战</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }} />
              </div>
              <span className="progress-text">3/5次</span>
            </div>
          </div>
        </div>
      </div>

      <div className="next-rewards">
        <h4>🎁 即将获得</h4>
        <div className="upcoming-rewards">
          <div className="upcoming-item">
            <span className="upcoming-icon">🏆</span>
            <span className="upcoming-name">挑战大师</span>
            <span className="upcoming-requirement">完成30个每日挑战</span>
            <span className="upcoming-progress">23/30</span>
          </div>
          <div className="upcoming-item">
            <span className="upcoming-icon">💎</span>
            <span className="upcoming-name">钻石边框</span>
            <span className="upcoming-requirement">连续15天挑战</span>
            <span className="upcoming-progress">7/15</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="daily-challenge-page">
      <div className="challenge-header-main">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>📅 每日挑战</h1>
        </div>
        
        <div className="challenge-tabs">
          <button
            className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <span className="tab-icon">🎯</span>
            <span className="tab-label">今日挑战</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-label">历史记录</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-label">奖励总览</span>
          </button>
        </div>
      </div>

      <div className="challenge-content">
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
      </div>
    </div>
  );
};
