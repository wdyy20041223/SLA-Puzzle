import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, DifficultyLevel, PieceShape } from '../types';
import { LeaderboardService } from '../services/leaderboardService';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Leaderboard.css';

interface LeaderboardProps {
  onBackToMenu: () => void;
}

type ViewMode = 'all' | 'player' | 'puzzle';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
  const [selectedShape, setSelectedShape] = useState<PieceShape>('square');
  const [selectedPuzzle, setSelectedPuzzle] = useState<string>('');
  const [availablePuzzles, setAvailablePuzzles] = useState<Array<{id: string, name: string, pieceShape: PieceShape}>>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [puzzleLeaderboardData, setPuzzleLeaderboardData] = useState<Record<DifficultyLevel, LeaderboardEntry[]>>({} as any);
  const [playerStats, setPlayerStats] = useState<LeaderboardEntry[]>([]);
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

  // 加载可用拼图列表
  useEffect(() => {
    const puzzles = LeaderboardService.getUniquePuzzles();
    setAvailablePuzzles(puzzles);
    
    // 设置默认选中的拼图
    if (puzzles.length > 0 && !selectedPuzzle) {
      setSelectedPuzzle(puzzles[0].id);
    }
  }, []);

  // 加载数据
  useEffect(() => {
    const loadData = () => {
      switch (viewMode) {
        case 'all':
          const allData = LeaderboardService.getDifficultyLeaderboard(selectedDifficulty, selectedShape, 50);
          setLeaderboardData(allData);
          break;
        
        case 'puzzle':
          if (selectedPuzzle) {
            const selectedPuzzleInfo = availablePuzzles.find(p => p.id === selectedPuzzle);
            if (selectedPuzzleInfo) {
              const puzzleData = LeaderboardService.getPuzzleAllDifficultiesLeaderboard(
                selectedPuzzle, 
                selectedPuzzleInfo.pieceShape
              );
              setPuzzleLeaderboardData(puzzleData);
            }
          }
          break;
        
        case 'player':
          if (authState.user) {
            const playerData = LeaderboardService.getPlayerBestRecords(authState.user.username);
            setPlayerStats(playerData);
          }
          break;
      }
    };

    loadData();

    // 加载统计数据
    if (viewMode === 'all') {
      const statsData = LeaderboardService.getStats();
      setStats(statsData);
    }
    }, [viewMode, selectedDifficulty, selectedShape, selectedPuzzle, availablePuzzles, authState.user]);

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 全球排行榜</h1>
        <p>按拼图形状、难度等级分类统计玩家成绩</p>
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
            分拼图排行
          </button>
          {authState.user && (
            <button
              className={`tab ${viewMode === 'player' ? 'active' : ''}`}
              onClick={() => setViewMode('player')}
            >
              我的记录
            </button>
          )}
        </div>

        {/* 拼图选择 */}
        {viewMode === 'puzzle' && (
          <div className="puzzle-selector">
            <h3>选择拼图</h3>
            <select
              value={selectedPuzzle}
              onChange={(e) => setSelectedPuzzle(e.target.value)}
              className="puzzle-select"
            >
              {availablePuzzles.map((puzzle) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.name} ({getShapeDisplay(puzzle.pieceShape)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 难度和形状选择 */}
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

        {/* 分拼图排行榜 */}
        {viewMode === 'puzzle' && selectedPuzzle && (
          <div className="puzzle-leaderboard-section">
            {availablePuzzles.find(p => p.id === selectedPuzzle) && (
              <h2>
                {availablePuzzles.find(p => p.id === selectedPuzzle)?.name} 
                ({getShapeDisplay(availablePuzzles.find(p => p.id === selectedPuzzle)?.pieceShape || 'square')}) 
                排行榜
              </h2>
            )}
            
            <div className="difficulty-sections">
              {(['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[]).map((difficulty) => (
                <div key={difficulty} className="difficulty-section">
                  <h3>{getDifficultyDisplay(difficulty)} 难度</h3>
                  {puzzleLeaderboardData[difficulty]?.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无{getDifficultyDisplay(difficulty)}难度记录</p>
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
                      
                      {puzzleLeaderboardData[difficulty]?.map((entry, index) => (
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
              ))}
            </div>
          </div>
        )}

        {/* 排行榜列表 */}
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

        {/* 玩家记录 */}
        {viewMode === 'player' && (
          <div className="player-records">
            <h2>我的记录</h2>
            {playerStats.length === 0 ? (
              <div className="empty-state">
                <p>暂无个人记录</p>
                <p>开始游戏来创建你的第一个记录吧！</p>
              </div>
            ) : (
              <div className="records-grid">
                  {playerStats.map((entry) => {
                    const rank = LeaderboardService.getPlayerRank(entry.puzzleId, entry.difficulty, entry.pieceShape, entry.playerName);
                  
                  return (
                    <div key={entry.id} className="record-card">
                      <div className="record-header">
                        <div className="record-badges">
                          <span className="shape-badge">{getShapeDisplay(entry.pieceShape)}</span>
                          <span className="difficulty-badge">{getDifficultyDisplay(entry.difficulty)}</span>
                        </div>
                        {rank && <span className="rank-badge">第 {rank} 名</span>}
                      </div>
                      <div className="record-title">
                        <h4>{entry.puzzleName || '未知拼图'}</h4>
                        <span className="grid-size">{entry.gridSize}</span>
                      </div>
                      <div className="record-stats">
                        <div className="stat">
                          <span className="label">步数:</span>
                          <span className="value">{entry.moves}</span>
                        </div>
                        <div className="stat">
                          <span className="label">用时:</span>
                          <span className="value">{formatTime(entry.completionTime)}</span>
                        </div>
                        <div className="stat">
                          <span className="label">完成:</span>
                          <span className="value">{entry.completedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
