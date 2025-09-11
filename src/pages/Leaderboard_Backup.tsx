import React, { useState, useEffect } from 'react';
import { DailyChallengeLeaderboardEntry, LeaderboardEntry, DifficultyLevel, PieceShape } from '../types';
import { LeaderboardService } from '../services/leaderboardService';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Leaderboard.css';

interface LeaderboardProps {
  onBackToMenu: () => void;
}

type ViewMode = 'all' | 'puzzle' | 'daily';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBackToMenu }) => {
  console.log('排行榜组件开始渲染...');
  
  const { authState } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
  const [selectedShape, setSelectedShape] = useState<PieceShape>('square');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // 今天
  
  // 数据状态
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [puzzleLeaderboardData, setPuzzleLeaderboardData] = useState<any[]>([]);
  const [dailyChallengeData, setDailyChallengeData] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [playerDailyStats, setPlayerDailyStats] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

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

  // 初始化排行榜服务
  useEffect(() => {
    console.log('排行榜页面初始化完成');
  }, []);

  // 加载数据
  useEffect(() => {
    const loadData = () => {
      console.log('开始加载数据，viewMode:', viewMode);
      setLoading(true);
      try {
        // 移除服务状态，因为使用的是本地服务
        setServiceStatus(null);

        switch (viewMode) {
          case 'all':
            console.log('加载全部排行榜...');
            // 加载全部排行榜
            const allData = LeaderboardService.getDifficultyLeaderboard(selectedDifficulty, selectedShape, 50);
            console.log('全部排行榜数据:', allData);
            setLeaderboardData(allData);
            
            // 加载统计数据
            const statsData = LeaderboardService.getStats();
            console.log('统计数据:', statsData);
            setStats(statsData);
            break;
          
          case 'puzzle':
            console.log('加载拼图排行榜...');
            // 加载所有拼图排行榜（包含前3名）
            try {
              const allPuzzleData = LeaderboardService.getAllPuzzleFilteredLeaderboards(selectedDifficulty, selectedShape);
              console.log('拼图排行榜数据:', allPuzzleData);
              setPuzzleLeaderboardData(allPuzzleData);
            } catch (error) {
              console.error('加载拼图排行榜失败:', error);
              setPuzzleLeaderboardData([]);
            }
            break;
          
          case 'daily':
            console.log('加载每日挑战排行榜...');
            // 加载每日挑战排行榜
            const dailyData = LeaderboardService.getDailyChallengeRanking(selectedDate, 50);
            console.log('每日挑战数据:', dailyData);
            setDailyChallengeData(dailyData);
            
            // 如果用户已登录，加载个人每日挑战统计
            if (authState.user) {
              const playerStats = LeaderboardService.getPlayerDailyChallengeStats(authState.user.username);
              console.log('玩家每日统计:', playerStats);
              setPlayerDailyStats(playerStats);
            }
            break;
        }
      } catch (error) {
        console.error('加载排行榜数据失败:', error);
      } finally {
        console.log('数据加载完成');
        setLoading(false);
      }
    };

    loadData();
  }, [viewMode, selectedDifficulty, selectedShape, selectedDate, authState.user]);

  console.log('渲染开始，当前状态:', { viewMode, loading });

  // 早期测试返回
  if (false) {
    return (
      <div className="leaderboard-page" style={{ minHeight: '100vh', background: 'var(--background-main)', padding: '20px' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h1>🏆 排行榜测试页面</h1>
          <p>当前视图模式: {viewMode}</p>
          <p>加载状态: {loading ? '加载中' : '已完成'}</p>
          <button onClick={onBackToMenu} style={{ padding: '10px 20px', marginTop: '20px' }}>
            返回主菜单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 全球排行榜</h1>
        <p>查看各类排行榜和统计数据</p>
        
        {/* 调试信息 */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          <p>Debug: viewMode = {viewMode}, loading = {loading.toString()}</p>
          <p>数据状态: leaderboard({leaderboardData.length}), puzzle({puzzleLeaderboardData.length}), daily({dailyChallengeData.length})</p>
        </div>
        
        {/* 服务状态指示器 */}
        {serviceStatus && (
          <div className="service-status">
            <span className={`status-indicator ${serviceStatus.mode}`}>
              {serviceStatus.mode === 'api' ? '🌐 在线模式' : '📱 本地模式'}
            </span>
            {serviceStatus.mode === 'api' && serviceStatus.lastSync && (
              <span className="last-sync">
                最后同步: {new Date(serviceStatus.lastSync).toLocaleString()}
              </span>
            )}
          </div>
        )}
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
            
            {/* 加载状态 */}
            {loading && (
              <div className="loading-indicator">
                <span>🔄 加载中...</span>
              </div>
            )}
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
            <h2>🧩 所有拼图排行榜</h2>
            <p className="section-description">展示所有拼图的前3快成绩，没有成绩的拼图显示"暂无成绩"</p>
            
            {puzzleLeaderboardData.length === 0 ? (
              <div className="empty-state">
                <p>正在加载拼图数据...</p>
              </div>
            ) : (
              <div className="puzzle-cards-grid">
                {puzzleLeaderboardData.map((entry, index) => {
                  // 安全检查
                  if (!entry || !entry.id) {
                    console.warn(`拼图数据项 ${index} 无效:`, entry);
                    return null;
                  }

                  return (
                    <div key={entry.id} className="puzzle-card-with-top3">
                      <div className="puzzle-card-header">
                        <div className="puzzle-info">
                          <h4 className="puzzle-name">{entry.puzzleName || '未知拼图'}</h4>
                          <span className="puzzle-shape">{getShapeDisplay(entry.pieceShape)}</span>
                          {!entry.hasRecords && (
                            <span className="no-records-badge">暂无成绩</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="top-players-section">
                        <h5>🏆 前三名</h5>
                        <div className="top-players-list">
                          {entry.hasRecords && entry.topPlayers && entry.topPlayers.length > 0 ? (
                            // 有成绩时显示实际排行
                            <>
                              {entry.topPlayers.map((player: any, playerIndex: number) => {
                                // 安全检查
                                if (!player) {
                                  return null;
                                }

                                // 计算同一玩家在前三名中的序号
                                const samePlayerRecords = entry.topPlayers.filter((p: any) => p && p.playerName === player.playerName);
                                const recordNumber = samePlayerRecords.length > 1 ? 
                                  samePlayerRecords.findIndex((p: any) => 
                                    p && p.time === player.time && p.moves === player.moves && 
                                    p.completedAt === player.completedAt) + 1 : 0;
                                
                                return (
                                  <div key={`${player.playerName || 'unknown'}-${playerIndex}-${player.time || 0}-${player.moves || 0}`} 
                                       className={`top-player-card rank-${playerIndex + 1} ${(player.playerName === authState.user?.username) ? 'current-user' : ''}`}>
                                    <div className="player-rank">
                                      {getRankDisplay(playerIndex)}
                                    </div>
                                    <div className="player-info">
                                      <div className="player-name">
                                        {player.playerName || '未知玩家'}
                                        {recordNumber > 0 && (
                                          <span className="record-number">#{recordNumber}</span>
                                        )}
                                        {player.playerName === authState.user?.username && (
                                          <span className="you-badge">你</span>
                                        )}
                                      </div>
                                      <div className="player-stats">
                                        <span className="time">⏱️ {formatTime(player.time || 0)}</span>
                                        <span className="moves">🎯 {player.moves || 0}步</span>
                                        <span className="difficulty">
                                          {getDifficultyDisplay(player.difficulty || 'easy')}
                                        </span>
                                      </div>
                                      <div className="completion-date">
                                        {player.completedAt ? new Date(player.completedAt).toLocaleDateString() : '未知日期'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* 填充空位（如果不足3名） */}
                              {Array.from({ length: 3 - (entry.topPlayers?.length || 0) }, (_, emptyIndex) => (
                                <div key={`empty-${emptyIndex}`} className="top-player-card empty-slot">
                                  <div className="player-rank">
                                    {getRankDisplay((entry.topPlayers?.length || 0) + emptyIndex)}
                                  </div>
                                  <div className="player-info empty">
                                    <div className="empty-text">暂无记录</div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            // 没有成绩时显示"暂无成绩"
                            Array.from({ length: 3 }, (_, emptyIndex) => (
                              <div key={`no-record-${emptyIndex}`} className="top-player-card empty-slot no-records">
                                <div className="player-rank">
                                  {getRankDisplay(emptyIndex)}
                                </div>
                                <div className="player-info empty">
                                  <div className="empty-text">暂无成绩</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
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
