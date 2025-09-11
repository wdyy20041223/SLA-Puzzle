import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { createAchievements } from '../data/achievementsData';
import './Achievements.css';

interface AchievementPageProps {
  onBackToMenu: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special' | 'milestone' | 'social' | 'technical';
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

  // 使用新的成就数据系统
  const achievements: Achievement[] = createAchievements(authState.user);

  const categories = [
    { id: 'all', label: '全部', icon: '🏆' },
    { id: 'progress', label: '进度成就', icon: '🧩' },
    { id: 'performance', label: '表现成就', icon: '⚡' },
    { id: 'milestone', label: '里程碑', icon: '🎯' },
    { id: 'special', label: '特殊成就', icon: '⭐' },
    { id: 'social', label: '社交成就', icon: '👥' },
    { id: 'technical', label: '技术成就', icon: '🔧' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: '#6b7280',
      rare: 'var(--primary-pink)',
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
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-count">
                {category.id === 'all' 
                  ? achievements.length 
                  : achievements.filter(a => a.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-header">
                <div className="achievement-icon">
                  {achievement.isUnlocked ? achievement.icon : '🔒'}
                </div>
                <div 
                  className="rarity-badge"
                  style={{ backgroundColor: getRarityColor(achievement.rarity) }}
                >
                  {achievement.rarity}
                </div>
              </div>
              
              <div className="achievement-content">
                <h3 className={`achievement-title ${achievement.isUnlocked ? 'unlocked-text' : 'locked-text'}`}>
                  {achievement.title}
                </h3>
                <p className={`achievement-description ${achievement.isUnlocked ? 'unlocked-text' : 'locked-text'}`}>
                  {achievement.description}
                </p>
                
                {achievement.maxProgress && achievement.maxProgress > 1 && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${Math.min(((achievement.progress || 0) / achievement.maxProgress) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.progress || 0} / {achievement.maxProgress}
                    </span>
                  </div>
                )}
                
                {achievement.reward && (
                  <div className="achievement-reward">
                    <span className="reward-label">奖励：</span>
                    <span className="reward-text">{achievement.reward}</span>
                  </div>
                )}
                
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="unlock-date">
                    解锁于 {formatDate(achievement.unlockedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="no-achievements">
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>暂无成就</h3>
              <p>该分类下还没有成就，继续游戏来解锁更多成就吧！</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
