import React, { useState, useEffect } from 'react';
import { DailyChallengeLeaderboardEntry, PuzzleLeaderboardEntry, LeaderboardEntry, DifficultyLevel, PieceShape } from '../types';
import { LeaderboardService } from '../services/leaderboardService';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Leaderboard.css';

interface LeaderboardProps {
  onBackToMenu: () => void;
}

type ViewMode = 'all' | 'puzzle' | 'daily';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
  const [selectedShape, setSelectedShape] = useState<PieceShape>('square');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // 今天
  
  // 数据状态
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [puzzleLeaderboardData, setPuzzleLeaderboardData] = useState<PuzzleLeaderboardEntry[]>([]);
  const [dailyChallengeData, setDailyChallengeData] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [playerDailyStats, setPlayerDailyStats] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 获取排名显示
  const getRankDisplay = (index: number): string => {
    const rank = index + 1;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  // 获取难度显示
  const getDifficultyDisplay = (difficulty: DifficultyLevel): string => {
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    };
    return difficultyMap[difficulty];
  };

  // 获取形状显示
  const getShapeDisplay = (shape: PieceShape): string => {
    const shapeMap = {
      square: '方形',
      triangle: '三角形',
      irregular: '异形'
    };
    return shapeMap[shape];
  };

  // 获取可用日期列表（最近7天）
  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 加载数据
  useEffect(() => {
    const loadData = () => {
      switch (viewMode) {
        case 'all':
          // 加载全部排行榜
          const allData = LeaderboardService.getDifficultyLeaderboard(selectedDifficulty, selectedShape, 50);
          setLeaderboardData(allData);
          
          // 加载统计数据
          const statsData = LeaderboardService.getStats();
          setStats(statsData);
          break;
        
        case 'puzzle':
          // 加载单拼图排行榜（合并同一拼图的所有关卡）
          const puzzleData = LeaderboardService.getPuzzleConsolidatedLeaderboard(50);
          setPuzzleLeaderboardData(puzzleData);
          break;
        
        case 'daily':
          // 加载每日挑战排行榜
          const dailyData = LeaderboardService.getDailyChallengeRanking(selectedDate, 50);
          setDailyChallengeData(dailyData);
          
          // 如果用户已登录，加载个人每日挑战统计
          if (authState.user) {
            const playerStats = LeaderboardService.getPlayerDailyChallengeStats(authState.user.username);
            setPlayerDailyStats(playerStats);
          }
          break;
      }
    };

    loadData();
  }, [viewMode, selectedDifficulty, selectedShape, selectedDate, authState.user]);

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 全球排行榜</h1>
        <p>查看各类排行榜和统计数据</p>
      </div>

      <div className="leaderboard-content">
        {/* 视图切换 */}
        <div className="view-tabs">
          <button
            className={`tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            全部排行
          </button>
          <button
            className={`tab ${viewMode === 'puzzle' ? 'active' : ''}`}
            onClick={() => setViewMode('puzzle')}
          >
            单拼图排行
          </button>
          <button
            className={`tab ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            每日挑战排行
          </button>
        </div>

        {/* 全部排行榜的筛选器 */}
        {viewMode === 'all' && (
          <>
            <div className="shape-selector">
              <h3>拼图形状</h3>
              <div className="selector-buttons">
                {(['square', 'triangle', 'irregular'] as PieceShape[]).map((shape) => (
                  <button
                    key={shape}
                    className={`shape-btn ${selectedShape === shape ? 'active' : ''}`}
                    onClick={() => setSelectedShape(shape)}
                  >
                    {getShapeDisplay(shape)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="difficulty-selector">
              <h3>难度等级</h3>
              <div className="selector-buttons">
                {(['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[]).map((diff) => (
                  <button
                    key={diff}
                    className={`difficulty-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {getDifficultyDisplay(diff)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 每日挑战的日期选择器 */}
        {viewMode === 'daily' && (
          <div className="date-selector">
            <h3>选择日期</h3>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-select"
            >
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
        )}

        {/* 全部排行榜 */}
        {viewMode === 'all' && (
          <div className="leaderboard-section">
            <h2>{getShapeDisplay(selectedShape)} - {getDifficultyDisplay(selectedDifficulty)} 难度排行榜</h2>
            {leaderboardData.length === 0 ? (
              <div className="empty-state">
                <p>暂无{getShapeDisplay(selectedShape)}-{getDifficultyDisplay(selectedDifficulty)}难度记录</p>
                <p>开始游戏来创建第一个记录吧！</p>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="rank-col">排名</div>
                  <div className="player-col">玩家</div>
                  <div className="moves-col">步数</div>
                  <div className="time-col">用时</div>
                  <div className="date-col">完成时间</div>
                </div>
                
                {leaderboardData.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`table-row ${entry.playerName === authState.user?.username ? 'current-player' : ''}`}
                  >
                    <div className="rank-col">{getRankDisplay(index)}</div>
                    <div className="player-col">
                      {entry.playerName}
                      {entry.playerName === authState.user?.username && (
                        <span className="you-badge">你</span>
                      )}
                    </div>
                    <div className="moves-col">{entry.moves}</div>
                    <div className="time-col">{formatTime(entry.completionTime)}</div>
                    <div className="date-col">
                      {entry.completedAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 单拼图排行榜 */}
        {viewMode === 'puzzle' && (
          <div className="puzzle-leaderboard-section">
            <h2>🧩 单拼图排行榜</h2>
            <p className="section-description">同一张拼图的所有成绩合并显示，展示每个拼图的最佳记录持有者</p>
            
            {puzzleLeaderboardData.length === 0 ? (
              <div className="empty-state">
                <p>暂无拼图记录</p>
                <p>开始游戏来创建第一个记录吧！</p>
              </div>
            ) : (
              <div className="puzzle-cards-grid">
                {puzzleLeaderboardData.map((entry, index) => (
                  <div key={entry.id} className="puzzle-card">
                    <div className="puzzle-card-header">
                      <div className="puzzle-rank">{getRankDisplay(index)}</div>
                      <div className="puzzle-info">
                        <h4 className="puzzle-name">{entry.puzzleName}</h4>
                        <span className="puzzle-shape">{getShapeDisplay(entry.pieceShape)}</span>
                      </div>
                    </div>
                    
                    <div className="puzzle-stats">
                      <div className="best-record">
                        <h5>🏆 最佳记录</h5>
                        <div className="record-holder">
                          <span className="player-name">{entry.playerName}</span>
                          {entry.playerName === authState.user?.username && (
                            <span className="you-badge">你</span>
                          )}
                        </div>
                        <div className="record-details">
                          <span className="time">⏱️ {formatTime(entry.bestTime)}</span>
                          <span className="moves">🎯 {entry.bestMoves}步</span>
                        </div>
                      </div>
                      
                      <div className="puzzle-meta">
                        <div className="meta-item">
                          <span className="label">总完成次数</span>
                          <span className="value">{entry.totalCompletions}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">平均用时</span>
                          <span className="value">{formatTime(entry.averageTime)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">平均步数</span>
                          <span className="value">{entry.averageMoves}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">完成难度</span>
                          <span className="value">
                            {entry.difficulties.map(d => getDifficultyDisplay(d)).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 每日挑战排行榜 */}
        {viewMode === 'daily' && (
          <div className="daily-challenge-section">
            <h2>📅 每日挑战排行榜</h2>
            <p className="section-description">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? '今日挑战排行榜' 
                : `${new Date(selectedDate).toLocaleDateString('zh-CN')} 挑战排行榜`}
            </p>

            {/* 玩家个人统计 */}
            {authState.user && playerDailyStats && (
              <div className="player-daily-stats">
                <h3>📊 我的每日挑战统计</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{playerDailyStats.totalChallenges}</div>
                    <div className="stat-label">总参与次数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{playerDailyStats.consecutiveDays}</div>
                    <div className="stat-label">连续挑战天数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{playerDailyStats.averageScore}</div>
                    <div className="stat-label">平均得分</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{playerDailyStats.bestScore}</div>
                    <div className="stat-label">最高得分</div>
                  </div>
                </div>
              </div>
            )}

            {dailyChallengeData.length === 0 ? (
              <div className="empty-state">
                <p>该日期暂无挑战记录</p>
                <p>参与每日挑战来创建记录吧！</p>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="rank-col">排名</div>
                  <div className="player-col">玩家</div>
                  <div className="score-col">得分</div>
                  <div className="time-col">用时</div>
                  <div className="moves-col">步数</div>
                  <div className="difficulty-col">难度</div>
                  <div className="perfect-col">完美</div>
                  <div className="streak-col">连续天数</div>
                </div>
                
                {dailyChallengeData.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`table-row ${entry.playerName === authState.user?.username ? 'current-player' : ''}`}
                  >
                    <div className="rank-col">{getRankDisplay(index)}</div>
                    <div className="player-col">
                      {entry.playerName}
                      {entry.playerName === authState.user?.username && (
                        <span className="you-badge">你</span>
                      )}
                    </div>
                    <div className="score-col">{entry.score}</div>
                    <div className="time-col">{formatTime(entry.completionTime)}</div>
                    <div className="moves-col">{entry.moves}</div>
                    <div className="difficulty-col">
                      <span className="difficulty-badge">{getDifficultyDisplay(entry.difficulty)}</span>
                    </div>
                    <div className="perfect-col">
                      {entry.isPerfect ? '⭐' : '-'}
                    </div>
                    <div className="streak-col">{entry.consecutiveDays}天</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 统计信息 */}
        {viewMode === 'all' && stats && (
          <div className="stats-section">
            <h2>📊 统计信息</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.uniquePlayers}</div>
                <div className="stat-label">玩家总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">游戏总数</div>
              </div>
              {stats.difficultyStats.map((diffStat: any) => (
                <div key={diffStat.difficulty} className="stat-card">
                  <div className="stat-value">{diffStat.count}</div>
                  <div className="stat-label">{getDifficultyDisplay(diffStat.difficulty)}</div>
                </div>
              ))}
            </div>
            
            <div className="difficulty-details">
              <h3>各难度详情</h3>
              <div className="difficulty-stats">
                {stats.difficultyStats.map((diffStat: any) => (
                  <div key={diffStat.difficulty} className="difficulty-stat">
                    <h4>{getDifficultyDisplay(diffStat.difficulty)}</h4>
                    <p>游戏数: {diffStat.count}</p>
                    <p>平均用时: {formatTime(diffStat.averageTime)}</p>
                    <p>平均步数: {diffStat.averageMoves}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="page-footer">
        <Button onClick={onBackToMenu} variant="primary">
          返回主菜单
        </Button>
      </div>
    </div>
  );
};
