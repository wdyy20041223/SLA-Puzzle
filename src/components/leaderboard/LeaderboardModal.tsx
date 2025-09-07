import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, DifficultyLevel, PieceShape } from '../../types';
import { LeaderboardService } from '../../services/leaderboardService';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import './LeaderboardModal.css';

interface LeaderboardModalProps {
  isVisible: boolean;
  onClose: () => void;
  puzzleId?: string;
  puzzleName?: string;
  difficulty?: DifficultyLevel;
  pieceShape?: PieceShape;
  showPlayerStats?: boolean;
}

type ViewMode = 'current' | 'all' | 'player';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isVisible,
  onClose,
  puzzleId,
  puzzleName,
  difficulty,
  pieceShape,
  showPlayerStats = false
}) => {
  const { authState } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(difficulty || 'easy');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
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

  // 加载数据
  useEffect(() => {
    if (!isVisible) return;

    const loadData = () => {
      switch (viewMode) {
        case 'current':
          if (puzzleId) {
            const data = LeaderboardService.getPuzzleLeaderboard(puzzleId, selectedDifficulty, pieceShape);
            setLeaderboardData(data);
          }
          break;
        
        case 'all':
          const allData = LeaderboardService.getDifficultyLeaderboard(selectedDifficulty, pieceShape);
          setLeaderboardData(allData);
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
  }, [isVisible, viewMode, selectedDifficulty, puzzleId, authState.user]);

  if (!isVisible) return null;

  return (
    <div className="leaderboard-modal-overlay">
      <div className="leaderboard-modal">
        <div className="modal-header">
          <h2>🏆 排行榜</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 视图切换 */}
          <div className="view-tabs">
            {puzzleId && (
              <button
                className={`tab ${viewMode === 'current' ? 'active' : ''}`}
                onClick={() => setViewMode('current')}
              >
                本关排行
              </button>
            )}
            <button
              className={`tab ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              全部排行
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

          {/* 难度选择 */}
          {(viewMode === 'current' || viewMode === 'all') && (
            <div className="difficulty-selector">
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
          )}

          {/* 当前拼图信息 */}
          {viewMode === 'current' && puzzleName && (
            <div className="puzzle-info">
              <h3>{puzzleName}</h3>
              <p>形状: {pieceShape ? getShapeDisplay(pieceShape) : '未知'} | 难度: {getDifficultyDisplay(selectedDifficulty)}</p>
            </div>
          )}

          {/* 排行榜列表 */}
          {(viewMode === 'current' || viewMode === 'all') && (
            <div className="leaderboard-list">
              {leaderboardData.length === 0 ? (
                <div className="empty-state">
                  <p>暂无记录</p>
                  <p>完成游戏后将显示排行榜</p>
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
              {playerStats.length === 0 ? (
                <div className="empty-state">
                  <p>暂无个人记录</p>
                  <p>开始游戏来创建你的第一个记录吧！</p>
                </div>
              ) : (
                <div className="records-list">
                  {playerStats.map((entry) => {
                    const rank = puzzleId === entry.puzzleId ? 
                      LeaderboardService.getPlayerRank(entry.puzzleId, entry.difficulty, entry.pieceShape, entry.playerName) : 
                      null;
                    
                    return (
                      <div key={entry.id} className="record-card">
                        <div className="record-header">
                          <span className="difficulty-badge">{getDifficultyDisplay(entry.difficulty)}</span>
                          {rank && <span className="rank-badge">第 {rank} 名</span>}
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
              <h3>📊 统计信息</h3>
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
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button onClick={onClose} variant="primary">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
};
