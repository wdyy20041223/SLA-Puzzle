import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { LeaderboardService } from '../services/leaderboardService';
import { DailyChallengeLeaderboardEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './DailyChallengeHistory.css';

interface DailyChallengeHistoryProps {
  onBackToMenu: () => void;
}

export const DailyChallengeHistory: React.FC<DailyChallengeHistoryProps> = ({
  onBackToMenu,
}) => {
  const { authState } = useAuth();
  const [historyData, setHistoryData] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'time' | 'moves'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);

  // 加载历史数据
  useEffect(() => {
    setLoading(true);
    try {
      const allData = LeaderboardService.getDailyChallengeLeaderboard();
      setHistoryData(allData);
    } catch (error) {
      console.error('加载每日挑战历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 获取难度显示
  const getDifficultyDisplay = (difficulty: string): string => {
    const difficultyMap: { [key: string]: string } = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string): string => {
    const colorMap: { [key: string]: string } = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#F44336',
      expert: '#9C27B0'
    };
    return colorMap[difficulty] || '#757575';
  };

  // 获取唯一的日期列表
  const getAvailableDates = (): string[] => {
    const dates = [...new Set(historyData.map(entry => entry.date))];
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  // 过滤和排序数据
  const getFilteredAndSortedData = (): DailyChallengeLeaderboardEntry[] => {
    let filtered = [...historyData];

    // 筛选个人记录
    if (showPersonalOnly && authState.user) {
      filtered = filtered.filter(entry => entry.playerName === authState.user!.username);
    }

    // 按日期筛选
    if (filterDate) {
      filtered = filtered.filter(entry => entry.date === filterDate);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'time':
          aValue = a.completionTime;
          bValue = b.completionTime;
          break;
        case 'moves':
          aValue = a.moves;
          bValue = b.moves;
          break;
        default:
          aValue = new Date(a.completedAt).getTime();
          bValue = new Date(b.completedAt).getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === 'asc' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
    });

    return filtered;
  };

  // 获取统计数据
  const getStats = () => {
    const personalData = authState.user 
      ? historyData.filter(entry => entry.playerName === authState.user!.username)
      : [];
    
    const totalGames = personalData.length;
    const perfectGames = personalData.filter(entry => entry.isPerfect).length;
    const avgScore = totalGames > 0 
      ? Math.round(personalData.reduce((sum, entry) => sum + entry.score, 0) / totalGames * 10) / 10
      : 0;
    const bestScore = totalGames > 0 
      ? Math.max(...personalData.map(entry => entry.score))
      : 0;
    const maxConsecutiveDays = personalData.length > 0 
      ? Math.max(...personalData.map(entry => entry.consecutiveDays))
      : 0;

    return {
      totalGames,
      perfectGames,
      avgScore,
      bestScore,
      maxConsecutiveDays,
      perfectRate: totalGames > 0 ? Math.round((perfectGames / totalGames) * 100) : 0
    };
  };

  const handleSort = (field: 'date' | 'score' | 'time' | 'moves') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const filteredData = getFilteredAndSortedData();
  const stats = getStats();

  return (
    <div className="daily-challenge-history-page">
      {/* 页面头部 */}
      <div className="history-header">
        <div className="header-content">
          <div className="header-left">
            <Button onClick={onBackToMenu} variant="secondary" size="small">
              ← 返回
            </Button>
            <div>
              <h1>📊 每日挑战历史记录</h1>
              <p>查看所有每日挑战游玩记录</p>
            </div>
          </div>
          
          {/* 个人统计卡片 */}
          {authState.user && (
            <div className="personal-stats">
              <h3>🏆 个人统计</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{stats.totalGames}</span>
                  <span className="stat-label">总游戏数</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.perfectGames}</span>
                  <span className="stat-label">完美游戏</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.avgScore}</span>
                  <span className="stat-label">平均得分</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.bestScore}</span>
                  <span className="stat-label">最高得分</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.maxConsecutiveDays}</span>
                  <span className="stat-label">最长连击</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.perfectRate}%</span>
                  <span className="stat-label">完美率</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 筛选和排序控制 */}
      <div className="controls-section">
        <div className="filter-controls">
          {/* 日期筛选 */}
          <div className="filter-group">
            <label>📅 筛选日期：</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-filter"
            >
              <option value="">所有日期</option>
              {getAvailableDates().map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                  {date === new Date().toISOString().split('T')[0] && ' (今天)'}
                </option>
              ))}
            </select>
          </div>

          {/* 个人记录筛选 */}
          {authState.user && (
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPersonalOnly}
                  onChange={(e) => setShowPersonalOnly(e.target.checked)}
                />
                只显示我的记录
              </label>
            </div>
          )}
        </div>

        <div className="sort-controls">
          <span className="sort-label">排序方式：</span>
          <div className="sort-buttons">
            {[
              { key: 'date', label: '日期' },
              { key: 'score', label: '得分' },
              { key: 'time', label: '用时' },
              { key: 'moves', label: '步数' }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`sort-btn ${sortBy === key ? 'active' : ''}`}
                onClick={() => handleSort(key as any)}
              >
                {label}
                {sortBy === key && (
                  <span className="sort-arrow">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="history-content">
        {loading ? (
          <div className="loading-state">
            <span>🔄 加载中...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>暂无记录</h3>
            <p>
              {showPersonalOnly 
                ? '您还没有每日挑战记录' 
                : filterDate 
                  ? '该日期没有挑战记录' 
                  : '还没有任何每日挑战记录'
              }
            </p>
            <p>开始每日挑战来创建记录吧！</p>
          </div>
        ) : (
          <div className="history-table">
            {/* 表头 */}
            <div className="table-header">
              <div className="col-rank">序号</div>
              <div className="col-date">日期</div>
              <div className="col-player">玩家</div>
              <div className="col-score">得分</div>
              <div className="col-time">用时</div>
              <div className="col-moves">步数</div>
              <div className="col-difficulty">难度</div>
              <div className="col-stars">星级</div>
              <div className="col-streak">连击</div>
              <div className="col-perfect">完美</div>
              <div className="col-completed">完成时间</div>
            </div>

            {/* 数据行 */}
            {filteredData.map((entry, index) => (
              <div 
                key={`${entry.id}-${entry.date}-${entry.completedAt}`} 
                className={`table-row ${entry.playerName === authState.user?.username ? 'personal-record' : ''}`}
              >
                <div className="col-rank">#{index + 1}</div>
                <div className="col-date">
                  {new Date(entry.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="col-player">
                  <span className="player-name">{entry.playerName}</span>
                  {entry.playerName === authState.user?.username && (
                    <span className="you-badge">你</span>
                  )}
                </div>
                <div className="col-score">
                  <span className="score-value">{Math.round(entry.score)}</span>
                </div>
                <div className="col-time">
                  {formatTime(entry.completionTime)}
                </div>
                <div className="col-moves">
                  {entry.moves}步
                </div>
                <div className="col-difficulty">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(entry.difficulty) }}
                  >
                    {getDifficultyDisplay(entry.difficulty)}
                  </span>
                </div>
                <div className="col-stars">
                  <span className="stars-display">
                    {'★'.repeat(entry.totalStars)}
                  </span>
                </div>
                <div className="col-streak">
                  <span className="streak-value">
                    {entry.consecutiveDays > 0 && `🔥${entry.consecutiveDays}`}
                  </span>
                </div>
                <div className="col-perfect">
                  {entry.isPerfect && (
                    <span className="perfect-badge">👑</span>
                  )}
                </div>
                <div className="col-completed">
                  {entry.completedAt.toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 数据统计底部 */}
      <div className="summary-footer">
        <div className="summary-stats">
          <span>📊 总记录数: {filteredData.length}</span>
          {filterDate && (
            <span>📅 当前日期: {new Date(filterDate).toLocaleDateString('zh-CN')}</span>
          )}
          {showPersonalOnly && authState.user && (
            <span>👤 仅显示: {authState.user.username}</span>
          )}
        </div>
      </div>
    </div>
  );
};