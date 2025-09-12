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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 数据状态
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [puzzleLeaderboardData, setPuzzleLeaderboardData] = useState<any[]>([]);
  const [dailyChallengeData, setDailyChallengeData] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [playerDailyStats, setPlayerDailyStats] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 格式化时间显示（毫秒）
  const formatTimeMs = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else if (seconds > 0) {
      return `${seconds}.${Math.floor(ms / 100)}秒`;
    } else {
      return `${ms}毫秒`;
    }
  };

  // 获取难度显示文本
  const getDifficultyDisplay = (difficulty: DifficultyLevel): string => {
    const difficultyMap = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难',
      'expert': '专家'
    };
    return difficultyMap[difficulty];
  };

  // 获取形状显示文本
  const getShapeDisplay = (shape: PieceShape): string => {
    const shapeMap = {
      'square': '方形',
      'triangle': '三角形',
      'irregular': '不规则形'
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
      console.log('开始加载数据，viewMode:', viewMode);
      setLoading(true);
      setError(null);
      
      try {
        switch (viewMode) {
          case 'all':
            console.log('加载全部排行榜...');
            const allData = LeaderboardService.getDifficultyLeaderboard(selectedDifficulty, selectedShape, 50);
            console.log('全部排行榜数据:', allData);
            setLeaderboardData(allData);
            
            const statsData = LeaderboardService.getStats();
            console.log('统计数据:', statsData);
            setStats(statsData);
            break;
          
          case 'puzzle':
            console.log('加载拼图排行榜...');
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
            // 使用新的每日挑战排行榜服务
            try {
              const { DailyChallengeLeaderboardService } = await import('../services/dailyChallengeLeaderboardService');
              const realtimeData = await DailyChallengeLeaderboardService.getRealtimeDailyChallengeLeaderboard(selectedDate, 50);
              console.log('每日挑战数据:', realtimeData);
              setDailyChallengeData(realtimeData.leaderboard);
              
              if (authState.user) {
                const playerStats = await DailyChallengeLeaderboardService.getUserDailyChallengeStats();
                console.log('玩家每日统计:', playerStats);
                setPlayerDailyStats(playerStats);
              }
            } catch (error) {
              console.warn('每日挑战排行榜服务失败，回退到本地数据:', error);
              // 回退到本地数据
              const dailyData = LeaderboardService.getDailyChallengeRanking(selectedDate, 50);
              console.log('本地每日挑战数据:', dailyData);
              setDailyChallengeData(dailyData);
              
              if (authState.user) {
                const playerStats = LeaderboardService.getPlayerDailyChallengeStats(authState.user.username);
                console.log('玩家每日统计:', playerStats);
                setPlayerDailyStats(playerStats);
              }
            }
            break;
        }
      } catch (error) {
        console.error('加载排行榜数据失败:', error);
        setError(`加载数据失败: ${error}`);
      } finally {
        console.log('数据加载完成');
        setLoading(false);
      }
    };

    loadData();
  }, [viewMode, selectedDifficulty, selectedShape, selectedDate, authState.user]);

  console.log('渲染开始，当前状态:', { viewMode, loading, error });

  // 如果有错误，显示错误页面
  if (error) {
    return (
      <div className="leaderboard-page" style={{ padding: '20px' }}>
        <div style={{ color: 'red', textAlign: 'center' }}>
          <h1>❌ 页面加载错误</h1>
          <p>{error}</p>
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

        {/* 加载状态 */}
        {loading && (
          <div className="loading-indicator" style={{ textAlign: 'center', padding: '20px' }}>
            <span>🔄 加载中...</span>
          </div>
        )}

        {/* 全部排行榜 */}
        {viewMode === 'all' && !loading && (
          <div className="leaderboard-section">
            <h2>{getShapeDisplay(selectedShape)} - {getDifficultyDisplay(selectedDifficulty)} 难度排行榜</h2>
            
            {/* 筛选器 */}
            <div className="filters">
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
                  {(['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[]).map((difficulty) => (
                    <button
                      key={difficulty}
                      className={`difficulty-btn ${selectedDifficulty === difficulty ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {getDifficultyDisplay(difficulty)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                <p>🎯 暂无排行榜数据</p>
                <p>完成一些拼图游戏来创建排行榜记录吧！</p>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="table-header">
                  <span className="rank">排名</span>
                  <span className="player">玩家</span>
                  <span className="puzzle">拼图</span>
                  <span className="time">用时</span>
                  <span className="moves">步数</span>
                  <span className="date">完成时间</span>
                </div>
                
                {leaderboardData.map((entry, index) => (
                  <div key={entry.id} className="table-row">
                    <span className="rank">
                      {index + 1 <= 3 ? (
                        <span className={`medal medal-${index + 1}`}>
                          {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="player">{entry.playerName}</span>
                    <span className="puzzle" title={entry.puzzleName}>
                      {entry.puzzleName.length > 15 
                        ? entry.puzzleName.substring(0, 15) + '...' 
                        : entry.puzzleName
                      }
                    </span>
                    <span className="time">{formatTimeMs(entry.completionTime)}</span>
                    <span className="moves">{entry.moves}</span>
                    <span className="date">
                      {new Date(entry.completedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 单拼图排行榜 */}
        {viewMode === 'puzzle' && !loading && (
          <div className="puzzle-leaderboard-section">
            <h2>🧩 单拼图排行榜 - {getShapeDisplay(selectedShape)} {getDifficultyDisplay(selectedDifficulty)}</h2>
            
            <div className="filters">
              <div className="shape-selector">
                <h4>拼图形状</h4>
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
                <h4>难度等级</h4>
                <div className="selector-buttons">
                  {(['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[]).map((difficulty) => (
                    <button
                      key={difficulty}
                      className={`difficulty-btn ${selectedDifficulty === difficulty ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {getDifficultyDisplay(difficulty)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {puzzleLeaderboardData.length === 0 ? (
              <div className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                <p>🎯 暂无单拼图排行榜数据</p>
                <p>选择其他难度或形状查看排行榜！</p>
              </div>
            ) : (
              <div className="puzzle-grid">
                {puzzleLeaderboardData.map((puzzleData) => (
                  <div key={puzzleData.puzzleId} className="puzzle-card">
                    <div className="puzzle-header">
                      <h4>{puzzleData.puzzleName}</h4>
                      <div className="puzzle-meta">
                        <span>👥 {puzzleData.totalPlayers}人参与</span>
                        <span>✅ {puzzleData.totalCompletions}次完成</span>
                      </div>
                    </div>

                    {puzzleData.hasRecords ? (
                      <div className="records">
                        <div className="best-records">
                          <div>⚡ 最快: {formatTimeMs(puzzleData.bestTime)}</div>
                          <div>🎯 最少步数: {puzzleData.bestMoves}步</div>
                        </div>

                        <div className="top3-leaderboard">
                          <h5>🏆 前3名</h5>
                          {puzzleData.leaderboard.slice(0, 3).map((entry: LeaderboardEntry, index: number) => (
                            <div key={entry.id} className="top3-entry">
                              <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                              <span>{entry.playerName}</span>
                              <span>{formatTimeMs(entry.completionTime)}</span>
                              <span>{entry.moves}步</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-records">
                        <p>暂无记录</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 每日挑战排行榜 */}
        {viewMode === 'daily' && !loading && (
          <div className="daily-challenge-section">
            <h2>📅 每日挑战排行榜</h2>
            
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

            {dailyChallengeData.length === 0 ? (
              <div className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                <p>🎯 该日期暂无挑战记录</p>
                <p>选择其他日期或参与每日挑战来创建记录！</p>
              </div>
            ) : (
              <div className="daily-leaderboard-table">
                <div className="table-header">
                  <span className="rank">排名</span>
                  <span className="player">玩家</span>
                  <span className="score">分数</span>
                  <span className="time">用时</span>
                  <span className="moves">步数</span>
                  <span className="perfect">完美</span>
                </div>
                
                {dailyChallengeData.map((entry, index) => (
                  <div key={entry.id} className="table-row">
                    <span className="rank">
                      {index + 1 <= 3 ? (
                        <span>{index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="player">{entry.playerName}</span>
                    <span className="score">{entry.score}</span>
                    <span className="time">{formatTimeMs(entry.completionTime)}</span>
                    <span className="moves">{entry.moves}</span>
                    <span className="perfect">{entry.isPerfect ? '✨' : '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 返回主菜单按钮 */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button onClick={onBackToMenu} variant="primary">
            返回主菜单
          </Button>
        </div>
      </div>
    </div>
  );
};
