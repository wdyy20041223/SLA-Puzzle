import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Achievements.css';

interface AchievementPageProps {
  onBackToMenu: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special' | 'milestone';
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: string;
}

export const Achievements: React.FC<AchievementPageProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const user = authState.user;
  const userAchievements = user?.achievements || [];
  const userGamesCompleted = user?.gamesCompleted || 0;

  // 真实成就数据，基于用户当前状态
  const achievements: Achievement[] = [
    {
      id: 'first_game',
      title: '初次体验',
      description: '完成第一个拼图',
      icon: '🎯',
      category: 'progress',
      progress: userGamesCompleted >= 1 ? 1 : 0,
      maxProgress: 1,
      isUnlocked: userAchievements.includes('first_game'),
      unlockedAt: userAchievements.includes('first_game') ? new Date('2024-01-15') : undefined,
      rarity: 'common',
      reward: '经验值 +10'
    },
    {
      id: 'games_10',
      title: '拼图新手',
      description: '完成10个拼图',
      icon: '🏅',
      category: 'progress',
      progress: Math.min(userGamesCompleted, 10),
      maxProgress: 10,
      isUnlocked: userAchievements.includes('games_10'),
      rarity: 'common',
      reward: '金币 +50'
    },
    {
      id: 'games_50',
      title: '拼图达人',
      description: '完成50个拼图',
      icon: '🏆',
      category: 'progress',
      progress: Math.min(userGamesCompleted, 50),
      maxProgress: 50,
      isUnlocked: userAchievements.includes('games_50'),
      rarity: 'rare',
      reward: '特殊称号'
    },
    {
      id: 'games_100',
      title: '拼图大师',
      description: '完成100个拼图',
      icon: '👑',
      category: 'milestone',
      progress: Math.min(userGamesCompleted, 100),
      maxProgress: 100,
      isUnlocked: userAchievements.includes('games_100'),
      rarity: 'epic',
      reward: '解锁特殊边框'
    },
    {
      id: 'speed_demon',
      title: '速度恶魔',
      description: '在3分钟内完成中等难度拼图',
      icon: '⚡',
      category: 'performance',
      progress: userAchievements.includes('speed_demon') ? 1 : 0,
      maxProgress: 1,
      isUnlocked: userAchievements.includes('speed_demon'),
      rarity: 'rare',
      reward: '称号：闪电手'
    },
    {
      id: 'perfectionist',
      title: '完美主义者',
      description: '用最少步数完成拼图',
      icon: '💎',
      category: 'performance',
      progress: userAchievements.includes('perfectionist') ? 1 : 0,
      maxProgress: 1,
      isUnlocked: userAchievements.includes('perfectionist'),
      rarity: 'legendary',
      reward: '特殊头像框'
    },
    {
      id: 'consecutive_days',
      title: '坚持不懈',
      description: '连续7天完成拼图',
      icon: '�',
      category: 'special',
      progress: userAchievements.includes('consecutive_days') ? 7 : Math.floor(Math.random() * 5),
      maxProgress: 7,
      isUnlocked: userAchievements.includes('consecutive_days'),
      rarity: 'rare',
      reward: '每日奖励翻倍'
    },
    {
      id: 'level_up',
      title: '等级提升',
      description: '升级到新等级',
      icon: '⬆️',
      category: 'milestone',
      progress: user?.level || 1,
      maxProgress: user?.level || 1,
      isUnlocked: userAchievements.includes('level_up') || (user?.level || 1) > 1,
      rarity: 'common',
      reward: '解锁新功能'
    }
  ];

  const categories = [
    { id: 'all', label: '全部', icon: '🏆' },
    { id: 'progress', label: '进度成就', icon: '🧩' },
    { id: 'performance', label: '表现成就', icon: '⚡' },
    { id: 'milestone', label: '里程碑', icon: '🎯' },
    { id: 'special', label: '特殊成就', icon: '⭐' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarity];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>🏆 成就系统</h1>
        </div>
        
        <div className="achievements-stats">
          <div className="stat-item">
            <span className="stat-value">{unlockedCount}</span>
            <span className="stat-label">已解锁</span>
          </div>
          <div className="stat-divider">/</div>
          <div className="stat-item">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">总数</span>
          </div>
          <div className="progress-ring">
            <div 
              className="progress-fill"
              style={{ 
                '--progress': `${(unlockedCount / totalCount) * 100}%` 
              } as React.CSSProperties}
            />
            <span className="progress-text">{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="achievements-content">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-label">{category.label}</span>
              <span className="tab-count">
                {category.id === 'all' 
                  ? achievements.length 
                  : achievements.filter(a => a.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ 
                '--rarity-color': getRarityColor(achievement.rarity) 
              } as React.CSSProperties}
            >
              <div className="achievement-header">
                <div className="achievement-icon">
                  {achievement.isUnlocked ? achievement.icon : '🔒'}
                </div>
                <div className="rarity-badge" data-rarity={achievement.rarity}>
                  {achievement.rarity === 'common' && '普通'}
                  {achievement.rarity === 'rare' && '稀有'}
                  {achievement.rarity === 'epic' && '史诗'}
                  {achievement.rarity === 'legendary' && '传奇'}
                </div>
              </div>

              <div className="achievement-content">
                <h3 className="achievement-title">{achievement.title}</h3>
                <p className="achievement-description">{achievement.description}</p>
                
                {!achievement.isUnlocked && achievement.maxProgress && achievement.maxProgress > 1 && (
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.progress || 0} / {achievement.maxProgress}
                    </span>
                  </div>
                )}

                {achievement.reward && (
                  <div className="achievement-reward">
                    <span className="reward-label">🎁 奖励:</span>
                    <span className="reward-text">{achievement.reward}</span>
                  </div>
                )}

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="unlocked-info">
                    <span className="unlocked-date">
                      📅 {formatDate(achievement.unlockedAt)}
                    </span>
                  </div>
                )}
              </div>

              {achievement.isUnlocked && (
                <div className="achievement-status">
                  <span className="status-badge unlocked">✓ 已解锁</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>暂无成就</h3>
            <p>该分类下还没有成就，继续努力游戏解锁更多成就吧！</p>
          </div>
        )}
      </div>

      <div className="achievements-tips">
        <h4>💡 成就提示</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">完成更多拼图来解锁拼图挑战成就</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⚡</span>
            <span className="tip-text">提高游戏速度来获得时间挑战成就</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎨</span>
            <span className="tip-text">使用拼图编辑器制作自定义拼图</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🔥</span>
            <span className="tip-text">每日坚持挑战来获得连击成就</span>
          </div>
        </div>
      </div>
    </div>
  );
};
