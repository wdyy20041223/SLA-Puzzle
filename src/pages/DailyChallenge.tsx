import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorage } from '../services/cloudStorage';
import { DailyChallengeGame } from './DailyChallengeGame';
import './DailyChallenge.css';

interface DailyChallengeProps {
  onBackToMenu: () => void;
}

export interface Challenge {
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
  puzzleType: 'square' | 'irregular';
}

interface ChallengeHistory {
  date: string;
  challenge: Challenge;
  completed: boolean;
  stars: number; // 0-3星
  rewards: string[];
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'rewards'>('today');
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [challengeHistory, setChallengeHistory] = useState<ChallengeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalExperience, setTotalExperience] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState<{name: string, icon: string, date: string}[]>([]);

  // 拼图图片库
  const puzzleImageLibrary = [
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '梦幻城堡', description: '一座隐藏在云端的神秘城堡，等待着勇敢的冒险者来探索' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '樱花飞舞', description: '春日樱花盛开的美景' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '星空之夜', description: '浩瀚星空下的宁静夜晚' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '草原之王', description: '非洲草原上的雄狮，展现王者风范' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '高山流水', description: '壮丽的山脉与清澈的溪流' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '动漫角色', description: '来自异世界的神秘角色' },
    { path: '/src-tauri/icons/Square284x284Logo.png', title: '城市之巅', description: '现代化都市的摩天大楼' }
  ];

  // 难度配置
  const difficultyConfigs = {
    easy: { gridSize: '3x3', timeLimit: 600, perfectMoves: 15, completionReward: '金币 +50', speedReward: '经验值 +30' },
    medium: { gridSize: '4x4', timeLimit: 900, perfectMoves: 25, completionReward: '金币 +80', speedReward: '经验值 +40' },
    hard: { gridSize: '5x5', timeLimit: 1200, perfectMoves: 40, completionReward: '金币 +120', speedReward: '经验值 +60' },
    expert: { gridSize: '6x6', timeLimit: 1800, perfectMoves: 60, completionReward: '金币 +200', speedReward: '经验值 +100' }
  };

  // 初始化挑战数据
  useEffect(() => {
    function initializeChallenge() {
      setIsLoading(true);
      try {
        // 检查是否需要午夜重置
        const wasReset = checkMidnightReset();

        // 从localStorage获取用户数据（代替云服务）
        const userId = authState.user?.id || 'default';
        const userDataKey = `user_data_${userId}`;
        const savedUserData = localStorage.getItem(userDataKey);
        const userData = savedUserData ? JSON.parse(savedUserData) : {
          dailyStreak: 0,
          coins: 0,
          experience: 0,
          achievements: [],
          challengeHistory: []
        };

        // 更新用户统计数据
        setDailyStreak(userData.dailyStreak || 0);
        setTotalCoins(userData.coins || 0);
        setTotalExperience(userData.experience || 0);
        setUnlockedItems(userData.achievements ? userData.achievements.map((achievement: string, index: number) => ({
          name: achievement,
          icon: achievement === '完美主义者' ? '👑' : '🏆',
          date: new Date().toLocaleDateString('zh-CN')
        })) : []);

        // 加载历史挑战记录
        if (userData.challengeHistory) {
          // 转换用户挑战记录为ChallengeHistory格式
          const history: ChallengeHistory[] = userData.challengeHistory
            .filter((record: any) => record.date !== getTodayDate())
            .map((record: any) => {
              const difficulty = difficultyConfigs[record.difficulty as keyof typeof difficultyConfigs] || difficultyConfigs.easy;
              return {
                date: record.date,
                challenge: {
                  id: record.id,
                  date: record.date,
                  title: record.title || '未知挑战',
                  description: record.description || '未知描述',
                  difficulty: record.difficulty || 'medium',
                  puzzleImage: record.puzzleImage,
                  gridSize: record.gridSize || '4x4',
                  timeLimit: difficulty.timeLimit,
                  perfectMoves: difficulty.perfectMoves,
                  rewards: {
                    completion: difficulty.completionReward,
                    perfect: '特殊称号：完美主义者',
                    speed: difficulty.speedReward
                  },
                  isCompleted: record.completed,
                  bestTime: record.time,
                  bestMoves: record.moves,
                  attempts: record.attempts || 0
                },
                completed: record.completed,
                stars: record.completed ? (record.isPerfect ? 3 : 2) : 0,
                rewards: record.completed ? [
                  difficulty.completionReward,
                  difficulty.speedReward,
                  record.isPerfect ? '特殊称号：完美主义者' : ''
                ].filter(Boolean) : []
              };
            });

          setChallengeHistory(history);
        }

        // 生成今日挑战
        const challenge = generateTodayChallenge(userId);
        setTodayChallenge(challenge);

      } catch (error) {
        console.error('初始化挑战数据失败:', error);
        // 生成默认挑战
        const defaultChallenge = generateTodayChallenge("1");
        setTodayChallenge(defaultChallenge);
      } finally {
        setIsLoading(false);
      }
    }

    initializeChallenge();
  }, [authState]);

  // 获取今天的日期字符串
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 生成基于日期的固定随机数种子
  const getDateSeed = (dateString: string): number => {
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
      seed = (seed * 31 + dateString.charCodeAt(i)) % 1000000;
    }
    return seed;
  };

  // 基于种子的伪随机数生成
  const pseudoRandom = (seed: number): () => number => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };

  // 检查是否需要重置每日挑战（午夜12点）
  const checkMidnightReset = (): boolean => {
    const today = getTodayDate();
    const lastResetDate = localStorage.getItem('daily_challenge_last_reset');

    // 如果最后重置日期不是今天，需要重置
    if (lastResetDate !== today) {
      // 清除所有每日挑战相关数据
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('daily_challenge_') && key !== 'daily_challenge_last_reset') {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('daily_challenge_last_reset', today);
      return true;
    }
    return false;
  };

  // 生成今日挑战（基于日期的固定挑战）
  const generateTodayChallenge = (userId: string): Challenge => {
    const today = getTodayDate();
    const seed = getDateSeed(today);
    const random = pseudoRandom(seed);

    // 基于种子选择图片（确保所有用户同一天选择相同图片）
    const imageIndex = Math.floor(random() * puzzleImageLibrary.length);
    const selectedImage = puzzleImageLibrary[imageIndex];

    // 基于种子选择难度（确保所有用户同一天难度相同）
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
    const difficultyIndex = Math.floor(random() * difficulties.length);
    const selectedDifficulty = difficulties[difficultyIndex];

    // 随机选择拼图类型（方形普通或异形）
    const puzzleTypes = ['square', 'irregular'] as const;
    
    const puzzleTypeIndex = Math.floor(random()*puzzleTypes.length);
    const selectedPuzzleType = puzzleTypes[puzzleTypeIndex];
    
    // 为测试方形拼图，暂时固定选择方形
    //const selectedPuzzleType = puzzleTypes[0]; // 0对应'square'

    const config = difficultyConfigs[selectedDifficulty];

    // 从localStorage获取今日挑战记录
    const challengeRecordKey = `daily_challenge_${userId}_${today}`;
    const savedRecord = localStorage.getItem(challengeRecordKey);
    const record = savedRecord ? JSON.parse(savedRecord) : {};

    // 确保attempts在合理范围内，默认为0（新用户有3次挑战机会）
    const attempts = Math.max(0, Math.min(3, typeof record.attempts === 'number' ? record.attempts : 0));

    return {
      id: `daily-${today}`,
      date: today,
      title: selectedImage.title,
      description: selectedImage.description,
      difficulty: selectedDifficulty,
      puzzleImage: selectedImage.path,
      gridSize: config.gridSize,
      timeLimit: config.timeLimit,
      perfectMoves: config.perfectMoves,
      rewards: {
        completion: config.completionReward,
        perfect: '特殊称号：完美主义者',
        speed: config.speedReward
      },
      isCompleted: record.isCompleted || false,
      bestTime: record.bestTime,
      bestMoves: record.bestMoves,
      attempts: attempts,
      puzzleType: selectedPuzzleType
    };
  };

  // 初始化时检查是否需要午夜重置

  // 开始挑战
  const handleStartChallenge = () => { const userId = authState.user?.id || 'default';
  if (!todayChallenge) return;
  
  // 检查是否已经达到每日挑战次数限制
  if (todayChallenge.attempts >= 3) {
    alert('您今天已经挑战了3次，明天再来吧！');
    return;
  }
  
  // 更新挑战次数，确保不超过3次
  const updatedAttempts = Math.min(todayChallenge.attempts + 1, 3);
  const updatedChallenge = {
    ...todayChallenge,
    attempts: updatedAttempts
  };
  setTodayChallenge(updatedChallenge);
  
  // 保存挑战次数到本地存储
  localStorage.setItem(`daily_challenge_${userId}_${getTodayDate()}`, JSON.stringify({
    attempts: updatedAttempts,
    isCompleted: updatedChallenge.isCompleted,
    bestTime: updatedChallenge.bestTime,
    bestMoves: updatedChallenge.bestMoves
  }));
  
  setIsPlaying(true);
};

const handleRestartChallenge = (): boolean => {
  const userId = authState.user?.id || 'default';
  if (!todayChallenge) return false;
  
  // 检查是否已经达到每日挑战次数限制
  if (todayChallenge.attempts >= 3) {
    alert('您今天已经挑战了3次，无法重新开始！');
    return false;
  }
  
  // 更新挑战次数，确保不超过3次
  const updatedAttempts = Math.min(todayChallenge.attempts + 1, 3);
  const updatedChallenge = {
    ...todayChallenge,
    attempts: updatedAttempts
  };
  setTodayChallenge(updatedChallenge);
  
  // 保存挑战次数到本地存储
  localStorage.setItem(`daily_challenge_${userId}_${getTodayDate()}`, JSON.stringify({
    attempts: updatedAttempts,
    isCompleted: updatedChallenge.isCompleted,
    bestTime: updatedChallenge.bestTime,
    bestMoves: updatedChallenge.bestMoves
  }));
  
  return true;
};

  // 挑战完成后返回
  const handleChallengeReturn = () => {
    setIsPlaying(false);
    // 重新加载挑战数据
    initializeChallenge();
  };

  // 辅助函数：初始化挑战数据
  const initializeChallenge = () => {
    const userId = authState.user?.id || 'guest';
    const challenge = generateTodayChallenge(userId);
    setTodayChallenge(challenge);
  };

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

  const renderTodayTab = () => {
    if (isLoading || !todayChallenge) {
      return (
        <div className="loading-container">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      );
    }

    return (
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
            <span className="streak-text">连击: {dailyStreak}天</span>
          </div>
        </div>

        <div className="challenge-card">
          <div className="challenge-image">
            <img src={todayChallenge.puzzleImage} alt={todayChallenge.title} className="preview-image" />
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
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span className="stat-label">今日剩余挑战次数</span>
                <span className="stat-value">{3 - todayChallenge.attempts}/3</span>
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
                disabled={todayChallenge.attempts >= 3}
              >
                🎮 开始挑战
              </Button>
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
  };

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
        {challengeHistory.map((history) => (
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
            <span className="reward-amount">{totalCoins}</span>
            <span className="reward-label">总金币</span>
          </div>
          <div className="reward-stat">
            <span className="reward-icon">⭐</span>
            <span className="reward-amount">{totalExperience}</span>
            <span className="reward-label">总经验</span>
          </div>
        </div>
      </div>

      <div className="rewards-categories">
        <div className="reward-category">
          <h4>🎨 解锁内容</h4>
          <div className="unlocked-items">
            {unlockedItems.map((item, index) => (
              <div key={index} className="unlocked-item">
                <span className="item-icon">{item.icon}</span>
                <span className="item-name">{item.name}</span>
                <span className="item-date">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reward-category">
          <h4>🎯 成就进度</h4>
          <div className="achievement-progress">
            <div className="progress-item">
              <span className="progress-label">连续挑战</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min((dailyStreak / 15) * 100, 100)}%` }} />
              </div>
              <span className="progress-text">{dailyStreak}/15天</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">完美挑战</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min((unlockedItems.filter(i => i.name === '完美主义者').length / 5) * 100, 100)}%` }} />
              </div>
              <span className="progress-text">{unlockedItems.filter(i => i.name === '完美主义者').length}/5次</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 如果正在进行挑战，显示挑战游戏页面
  if (isPlaying && todayChallenge) {
    return (
      <DailyChallengeGame
    onBackToMenu={handleChallengeReturn}
    challenge={todayChallenge}
    puzzleType={todayChallenge.puzzleType}
    onRestartChallenge={handleRestartChallenge}
  />
    );
  }

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
