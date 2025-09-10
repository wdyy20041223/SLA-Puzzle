import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorage } from '../services/cloudStorage';
import { DailyChallengeGame } from './DailyChallengeGame';
import './DailyChallengeNew.css';

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
  timeLimit: number;
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
  effects: string[]; // 叠加的特效数组
}

export interface DailyEffect {
  id: string;
  name: string;
  description: string;
  star: 3 | 4 | 5;
}

interface ChallengeHistory {
  date: string;
  challenge: Challenge;
  completed: boolean;
  stars: number;
  rewards: string[];
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'rewards'>('today');
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [dailyEffects, setDailyEffects] = useState<{
    star3: DailyEffect[];
    star4: DailyEffect[];
    star5: DailyEffect[];
  }>({ star3: [], star4: [], star5: [] });
  const [challengeHistory, setChallengeHistory] = useState<ChallengeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGame, setCurrentGame] = useState<Challenge | null>(null);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalExperience, setTotalExperience] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState<{name: string, icon: string, date: string}[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 获取所有可用特效
  const getAllEffects = (): { star3: DailyEffect[]; star4: DailyEffect[]; star5: DailyEffect[] } => {
    return {
      star3: [
        { id: 'rotate', name: '天旋地转', description: '本关卡等同于启用翻转模式，拼图块包含旋转与翻转，玩家可通过按键旋转到正确位置', star: 3 as const },
        { id: 'blur', name: '雾里探花', description: '本关卡拼图块在鼠标选中前模糊化', star: 3 as const },
        { id: 'partial', name: '管中窥豹', description: '本关卡答题区最开始只展示一半的拼图块', star: 3 as const },
        { id: 'upside_down', name: '颠倒世界', description: '本关卡中正确答案旋转180°后得到原图', star: 3 as const },
        { id: 'double_steps', name: '举步维艰', description: '每一步统计时算作2步', star: 3 as const }
      ],
      star4: [
        { id: 'corner_start', name: '作茧自缚', description: '本关卡最开始可以放置拼图块的位置只有四个角落', star: 4 as const },
        { id: 'invisible', name: '一手遮天', description: '本关卡放置后的拼图块为纯黑色不可见', star: 4 as const },
        { id: 'no_preview', name: '一叶障目', description: '本关卡不允许查看原图', star: 4 as const },
        { id: 'time_limit', name: '生死时速', description: '本关卡限时126*(拼图块数量/9)秒', star: 4 as const }
      ],
      star5: [
        { id: 'no_mistakes', name: '最终防线', description: '本关卡不允许任何一次放置失误', star: 5 as const },
        { id: 'step_limit', name: '精打细算', description: '本关卡必须在1.5*拼图块数量次步数内完成', star: 5 as const },
        { id: 'brightness', name: '璀璨星河', description: '答题区拼图块亮度随时间呈正弦变化', star: 5 as const }
      ]
    };
  };

  // 基于日期生成每日特效（展示所有特效）
  const generateDailyEffects = (): { star3: DailyEffect[]; star4: DailyEffect[]; star5: DailyEffect[] } => {
    const allEffects = getAllEffects();

    // 直接返回所有特效，不再进行随机选择
    return {
      star3: allEffects.star3, // 显示所有5个3星特效
      star4: allEffects.star4, // 显示所有4个4星特效
      star5: allEffects.star5  // 显示所有3个5星特效
    };
  };

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
    easy: { gridSize: '3x3', timeLimit: 180, perfectMoves: 15, rewards: { completion: 50, perfect: 100, speed: 25 } },
    medium: { gridSize: '4x4', timeLimit: 300, perfectMoves: 25, rewards: { completion: 75, perfect: 150, speed: 40 } },
    hard: { gridSize: '5x5', timeLimit: 450, perfectMoves: 40, rewards: { completion: 100, perfect: 200, speed: 60 } },
    expert: { gridSize: '6x6', timeLimit: 600, perfectMoves: 60, rewards: { completion: 150, perfect: 300, speed: 100 } }
  };

  // 生成今日挑战（单个拼图）
  const generateTodayChallenge = (): Challenge => {
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    
    // 使用日期作为随机种子选择拼图
    const puzzleIndex = seed % puzzleImageLibrary.length;
    const selectedPuzzle = puzzleImageLibrary[puzzleIndex];
    
    // 根据日期确定难度
    const difficulties: Array<'easy' | 'medium' | 'hard' | 'expert'> = ['easy', 'medium', 'hard', 'expert'];
    const difficultyIndex = (seed + 1) % difficulties.length;
    const difficulty = difficulties[difficultyIndex];
    const difficultyConfig = difficultyConfigs[difficulty];
    
    return {
      id: `daily-${today}`,
      date: today,
      title: `每日挑战 - ${selectedPuzzle.title}`,
      description: selectedPuzzle.description,
      difficulty: difficulty,
      puzzleImage: selectedPuzzle.path,
      gridSize: difficultyConfig.gridSize,
      timeLimit: difficultyConfig.timeLimit,
      perfectMoves: difficultyConfig.perfectMoves,
      puzzleType: 'square',
      rewards: {
        completion: `+${difficultyConfig.rewards.completion} 金币`,
        perfect: `+${difficultyConfig.rewards.perfect} 金币 & 经验`,
        speed: `+${difficultyConfig.rewards.speed} 特殊奖励`
      },
      isCompleted: false,
      attempts: 0,
      effects: selectedEffects // 使用选中的特效
    };
  };

  // 处理特效选择
  const handleEffectToggle = (effectId: string) => {
    setSelectedEffects(prev => {
      if (prev.includes(effectId)) {
        return prev.filter(id => id !== effectId);
      } else {
        return [...prev, effectId];
      }
    });
  };

  // 开始挑战
  const handleStartChallenge = () => {
    if (!todayChallenge) return;
    
    const challengeWithEffects = {
      ...todayChallenge,
      effects: selectedEffects
    };
    
    setCurrentGame(challengeWithEffects);
    setIsPlaying(true);
  };

  // 挑战完成回调
  const handleChallengeComplete = (result: any) => {
    // 处理挑战完成逻辑
    setIsPlaying(false);
    setCurrentGame(null);
    
    // 更新挑战状态
    if (todayChallenge) {
      const updatedChallenge = {
        ...todayChallenge,
        isCompleted: true,
        bestTime: result.time,
        bestMoves: result.moves
      };
      setTodayChallenge(updatedChallenge);
    }
  };

  // 初始化
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // 初始化特效数据
        const effects = generateDailyEffects();
        setDailyEffects(effects);
        
        // 生成今日挑战
        const challenge = generateTodayChallenge();
        setTodayChallenge(challenge);
        
        // 如果用户已登录，从云端加载数据
        if (authState.user?.id) {
          try {
            // 这里可以添加云端数据加载逻辑
            // const userData = await cloudStorage.getUserData(authState.user.id);
            // if (userData) {
            //   setDailyStreak(userData.dailyStreak || 0);
            //   setTotalCoins(userData.coins || 0);
            //   setTotalExperience(userData.experience || 0);
            // }
          } catch (error) {
            console.warn('Failed to load cloud data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize daily challenge:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [authState.user?.id]);

  // 计算总星级
  const getTotalStars = () => {
    return selectedEffects.reduce((total, effectId) => {
      const allEffects = [...dailyEffects.star3, ...dailyEffects.star4, ...dailyEffects.star5];
      const effect = allEffects.find(e => e.id === effectId);
      return total + (effect?.star || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="daily-challenge-container loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (isPlaying && currentGame) {
    return (
      <DailyChallengeGame
        challenge={currentGame}
        puzzleType={currentGame.puzzleType}
        onBackToMenu={() => {
          setIsPlaying(false);
          setCurrentGame(null);
        }}
        onRestartChallenge={() => {
          // 重启挑战逻辑
          return true;
        }}
      />
    );
  }

  const renderTodayTab = () => (
    <div className="today-challenges">
      <div className="challenge-stats">
        <div className="stat-item">
          <div className="stat-value">{dailyStreak}</div>
          <div className="stat-label">连续天数</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{getTotalStars()}</div>
          <div className="stat-label">今日星级</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{totalCoins}</div>
          <div className="stat-label">金币</div>
        </div>
      </div>

      {todayChallenge && (
        <div className="daily-puzzle-section">
          <h3>今日拼图</h3>
          <div className="puzzle-preview">
            <img src={todayChallenge.puzzleImage} alt={todayChallenge.title} />
            <div className="puzzle-info">
              <h4>{todayChallenge.title}</h4>
              <p>{todayChallenge.description}</p>
              <div className="puzzle-details">
                <span>难度: {todayChallenge.difficulty}</span>
                <span>网格: {todayChallenge.gridSize}</span>
                <span>时限: {Math.floor(todayChallenge.timeLimit / 60)}分钟</span>
              </div>
            </div>
          </div>

          {/* 3星特效选择 */}
          <div className="effect-selection-section">
            <h4>🌟 3星特效</h4>
            <div className="effect-grid">
              {dailyEffects.star3.map(effect => (
                <div
                  key={effect.id}
                  className={`effect-card ${selectedEffects.includes(effect.id) ? 'selected' : ''}`}
                  onClick={() => handleEffectToggle(effect.id)}
                >
                  <div className="effect-name">{effect.name}</div>
                  <div className="effect-description">{effect.description}</div>
                  <div className="effect-star">{'★'.repeat(effect.star)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4星特效选择 */}
          <div className="effect-selection-section">
            <h4>🌟🌟 4星特效</h4>
            <div className="effect-grid">
              {dailyEffects.star4.map(effect => (
                <div
                  key={effect.id}
                  className={`effect-card ${selectedEffects.includes(effect.id) ? 'selected' : ''}`}
                  onClick={() => handleEffectToggle(effect.id)}
                >
                  <div className="effect-name">{effect.name}</div>
                  <div className="effect-description">{effect.description}</div>
                  <div className="effect-star">{'★'.repeat(effect.star)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5星特效选择 */}
          <div className="effect-selection-section">
            <h4>🌟🌟🌟 5星特效</h4>
            <div className="effect-grid">
              {dailyEffects.star5.map(effect => (
                <div
                  key={effect.id}
                  className={`effect-card ${selectedEffects.includes(effect.id) ? 'selected' : ''}`}
                  onClick={() => handleEffectToggle(effect.id)}
                >
                  <div className="effect-name">{effect.name}</div>
                  <div className="effect-description">{effect.description}</div>
                  <div className="effect-star">{'★'.repeat(effect.star)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 预览和答案显示区域 */}
          {(showPreview || showAnswer) && (
            <div className="helper-section">
              {showPreview && !selectedEffects.includes('no_preview') && (
                <div className="preview-section">
                  <h4>🖼️ 原图预览</h4>
                  <div className="preview-image">
                    <img src={todayChallenge.puzzleImage} alt="原图预览" />
                  </div>
                </div>
              )}
              
              {showAnswer && !selectedEffects.includes('no_mistakes') && (
                <div className="answer-section">
                  <h4>💡 答案提示</h4>
                  <div className="answer-grid">
                    <div className="answer-hint">
                      提示：在无特效模式下，您可以查看完整的解题步骤和最优路径
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="challenge-actions">
            <div className="selected-effects-summary">
              已选择 {selectedEffects.length} 个特效，总星级: {getTotalStars()}
              {selectedEffects.length === 0 && <span className="no-effects-hint">（无特效时享受完整游戏体验）</span>}
            </div>
            
            {/* 基础游戏功能按钮 */}
            <div className="game-controls">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="secondary"
                disabled={selectedEffects.includes('no_preview')}
              >
                {showPreview ? '隐藏' : '查看'}原图
              </Button>
              <Button
                onClick={() => setShowAnswer(!showAnswer)}
                variant="secondary"
                disabled={false}
              >
                {showAnswer ? '隐藏' : '显示'}答案
              </Button>
              <Button
                onClick={() => {
                  // 重置游戏逻辑
                  setSelectedEffects([]);
                  setShowAnswer(false);
                  setShowPreview(false);
                }}
                variant="secondary"
              >
                重置选择
              </Button>
            </div>
            
            <Button
              onClick={handleStartChallenge}
              variant="primary"
              disabled={todayChallenge.isCompleted}
            >
              {todayChallenge.isCompleted ? '已完成今日挑战' : '开始挑战'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="challenge-history">
      <h3>挑战历史</h3>
      {challengeHistory.length === 0 ? (
        <div className="empty-history">
          <p>还没有挑战记录</p>
          <p>完成每日挑战来解锁历史记录！</p>
        </div>
      ) : (
        <div className="history-list">
          {challengeHistory.map((record, index) => (
            <div key={index} className="history-item">
              <div className="history-date">{record.date}</div>
              <div className="history-challenge">{record.challenge.title}</div>
              <div className="history-stars">{'★'.repeat(record.stars)}</div>
              <div className="history-status">
                {record.completed ? '✅ 已完成' : '❌ 未完成'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRewardsTab = () => (
    <div className="rewards-section">
      <h3>成就与奖励</h3>
      <div className="rewards-stats">
        <div className="reward-stat">
          <div className="reward-value">{totalCoins}</div>
          <div className="reward-label">总金币</div>
        </div>
        <div className="reward-stat">
          <div className="reward-value">{totalExperience}</div>
          <div className="reward-label">总经验</div>
        </div>
        <div className="reward-stat">
          <div className="reward-value">{unlockedItems.length}</div>
          <div className="reward-label">解锁物品</div>
        </div>
      </div>
      
      {unlockedItems.length > 0 && (
        <div className="unlocked-items">
          <h4>已解锁物品</h4>
          <div className="items-grid">
            {unlockedItems.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-icon">{item.icon}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-date">{item.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="daily-challenge-container">
      <div className="daily-challenge-header">
        <Button onClick={onBackToMenu} variant="secondary">
          ← 返回主菜单
        </Button>
        <h1>每日挑战</h1>
        <div className="header-stats">
          <span>🔥 {dailyStreak}天</span>
          <span>⭐ {getTotalStars()}星</span>
        </div>
      </div>

      <div className="challenge-tabs">
        <button
          className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          今日挑战
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          挑战历史
        </button>
        <button
          className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          奖励收集
        </button>
      </div>

      <div className="challenge-content">
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
      </div>
    </div>
  );
};
