import React, { useState, useEffect, useCallback } from 'react';
import { PuzzleGame } from '../components/game/PuzzleGame';
import { IrregularPuzzleGame } from './IrregularPuzzleGame';
import { TetrisPuzzleGame } from './TetrisPuzzleGame';
import { Button } from '../components/common/Button';
import { apiService, MultiplayerRoom } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { PuzzleConfig } from '../types';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import './MultiplayerGame.css';

interface MultiplayerGameProps {
  room: MultiplayerRoom;
  onBackToRoom: () => void;
  onGameComplete: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  room,
  onBackToRoom,
  onGameComplete
}) => {
  const { authState } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom>(room);
  const [, setGameStartTime] = useState<number>(Date.now());
  const [gameCompleted, setGameCompleted] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [roomPollingInterval, setRoomPollingInterval] = useState<number | null>(null);
  const [puzzleConfig, setPuzzleConfig] = useState<PuzzleConfig | null>(null);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(true);
  const [gameResult, setGameResult] = useState<{
    isWinner: boolean;
    myTime: number;
    myMoves: number;
    opponentTime?: number | null;
    opponentMoves?: number | null;
    opponentName?: string;
    opponentFinished?: boolean;
  } | null>(null);

  // 生成拼图配置
  const generatePuzzleConfig = useCallback(async () => {
    try {
      setIsGeneratingPuzzle(true);
      
      const imageUrl = room.puzzleConfig.imageData || '/images/nature/landscape1.svg';
      const gridSizeParts = room.puzzleConfig.gridSize.split('x');
      const rows = parseInt(gridSizeParts[0]);
      const cols = parseInt(gridSizeParts[1]);
      const pieceShape = room.puzzleConfig.pieceShape || 'square';
      
      console.log('生成拼图配置:', { imageUrl, rows, cols, pieceShape });
      
      let generatedConfig: PuzzleConfig;

      if (pieceShape === 'irregular') {
        // 异形拼图需要使用特殊的生成器
        const { IrregularPuzzleGenerator } = await import('../utils/puzzleGenerator/irregular/IrregularPuzzleGenerator');
        const irregularConfig = await IrregularPuzzleGenerator.generateIrregularPuzzle({
          imageData: imageUrl,
          gridSize: { rows, cols },
          name: room.puzzleConfig.imageName || '联机对战拼图',
          pieceShape: 'irregular'
        });
        
        // 转换为标准的 PuzzleConfig 格式
        generatedConfig = {
          id: irregularConfig.id,
          name: irregularConfig.name,
          originalImage: irregularConfig.originalImage,
          gridSize: irregularConfig.gridSize,
          pieceShape: 'irregular',
          difficulty: irregularConfig.difficulty,
          pieces: irregularConfig.pieces.map(piece => ({
            ...piece,
            shape: 'irregular' as const,
            currentSlot: null, // 异形拼图不使用 slot 概念
            correctSlot: 0,    // 异形拼图不使用 slot 概念
            isFlipped: piece.flipX || false
          })),
          createdAt: irregularConfig.createdAt,
          updatedAt: irregularConfig.updatedAt
        };
      } else {
        // 其他形状使用标准生成器
        generatedConfig = await PuzzleGenerator.generatePuzzle({
          imageData: imageUrl,
          gridSize: { rows, cols },
          pieceShape: pieceShape,
          name: room.puzzleConfig.imageName || '联机对战拼图',
          allowRotation: false
        });
      }

      const config: PuzzleConfig = {
        ...generatedConfig,
        id: `multiplayer_${room.id}`,
        name: room.puzzleConfig.imageName || '联机对战拼图',
        difficulty: room.puzzleConfig.difficulty.charAt(0).toUpperCase() + room.puzzleConfig.difficulty.slice(1) as any
      };

      console.log('生成的拼图配置:', config);
      setPuzzleConfig(config);
    } catch (error) {
      console.error('生成拼图配置失败:', error);
      // 使用默认配置并重新生成拼图
      try {
        const defaultGeneratedConfig = await PuzzleGenerator.generatePuzzle({
          imageData: '/images/nature/landscape1.svg',
          gridSize: { rows: 3, cols: 3 },
          pieceShape: 'square',
          name: '联机对战拼图（默认）',
          allowRotation: false
        });

        const defaultConfig: PuzzleConfig = {
          ...defaultGeneratedConfig,
          id: `multiplayer_${room.id}`,
          name: room.puzzleConfig.imageName || '联机对战拼图',
          difficulty: 'Medium' as any
        };
        setPuzzleConfig(defaultConfig);
      } catch (fallbackError) {
        console.error('默认拼图生成也失败:', fallbackError);
        // 最后的兜底：创建一个基本的配置，但标记为错误状态
        const emergencyConfig: PuzzleConfig = {
          id: `multiplayer_${room.id}`,
          name: '拼图加载失败',
          originalImage: '/images/nature/landscape1.svg',
          gridSize: { rows: 3, cols: 3 },
          pieceShape: 'square' as const,
          difficulty: 'Medium' as any,
          pieces: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPuzzleConfig(emergencyConfig);
      }
    } finally {
      setIsGeneratingPuzzle(false);
    }
  }, [room]);

  // 组件挂载时生成拼图配置
  useEffect(() => {
    generatePuzzleConfig();
  }, [generatePuzzleConfig]);

  // 开始房间状态轮询
  const startRoomPolling = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiService.getRoomInfo(currentRoom.roomCode);
        if (response.success && response.data) {
          const updatedRoom = response.data.room;
          setCurrentRoom(updatedRoom);
          
          console.log('轮询获取房间状态:', {
            roomStatus: updatedRoom.status,
            players: updatedRoom.players.map(p => ({
              userId: p.userId,
              username: p.username,
              status: p.status,
              completionTime: p.completionTime,
              movesCount: p.movesCount,
              finishedAt: p.finishedAt
            }))
          });
          
          // 检查对手是否完成游戏
          const opponent = updatedRoom.players.find(
            p => p.userId !== authState.user?.id
          );
          
          if (opponent && opponent.status === 'finished' && !opponentFinished) {
            console.log('检测到对手完成游戏:', opponent);
            setOpponentFinished(true);
          }

          // 如果当前玩家已完成游戏，需要计算并显示结果
          if (gameCompleted) {
            // 无论房间状态如何，都重新计算结果以获取最新的对手数据
            calculateGameResult(updatedRoom);
          }
          
          // 如果房间状态为finished且还没有游戏结果，计算结果
          if (updatedRoom.status === 'finished' && !gameResult) {
            console.log('房间游戏结束，计算最终结果');
            clearInterval(interval);
            setRoomPollingInterval(null);
            calculateGameResult(updatedRoom);
          }
        }
      } catch (error) {
        console.error('轮询房间状态失败:', error);
        // 即使轮询失败，也不要卡住界面
        // 如果已经完成游戏但还没有结果，显示本地结果
        if (gameCompleted && !gameResult) {
          console.log('轮询失败，但游戏已完成，显示本地结果');
          // 从当前房间状态获取用户数据
          const currentUser = currentRoom.players.find(p => p.userId === authState.user?.id);
          const time = currentUser?.completionTime || 0;
          const moves = currentUser?.movesCount || 0;
          createLocalGameResult(time, moves); // time已经是秒数，无需转换
        }
      }
    }, 1000); // 每秒轮询一次

    setRoomPollingInterval(interval);
  }, [currentRoom.roomCode, authState.user?.id, opponentFinished, gameResult, gameCompleted]);

  // 计算游戏结果
  const calculateGameResult = (finalRoom: MultiplayerRoom) => {
    const currentUser = finalRoom.players.find(p => p.userId === authState.user?.id);
    const opponent = finalRoom.players.find(p => p.userId !== authState.user?.id);

    if (currentUser && opponent) {
      const currentTime = currentUser.completionTime || 0;
      const opponentTime = opponent.completionTime || null;
      
      // 检查对手是否完成：状态为finished且有完成时间
      const isOpponentFinished = opponent.status === 'finished' && opponentTime !== null && opponentTime > 0;
      
      let isWinner = false;
      if (isOpponentFinished) {
        // 双方都完成了，比较时间（时间越短越好）
        isWinner = currentTime < opponentTime;
      } else {
        // 对手还没完成，当前玩家暂时领先
        isWinner = true;
      }

      const result = {
        isWinner,
        myTime: currentTime,
        myMoves: currentUser.movesCount || 0,
        opponentTime: isOpponentFinished ? opponentTime : null,
        opponentMoves: isOpponentFinished ? (opponent.movesCount || 0) : null,
        opponentName: opponent.username,
        opponentFinished: isOpponentFinished
      };
      
      console.log('计算游戏结果:', {
        房间状态: finalRoom.status,
        currentUser: {
          userId: currentUser.userId,
          time: currentTime,
          moves: currentUser.movesCount,
          status: currentUser.status,
          finishedAt: currentUser.finishedAt
        },
        opponent: {
          userId: opponent.userId,
          time: opponentTime,
          moves: opponent.movesCount,
          status: opponent.status,
          finished: isOpponentFinished,
          finishedAt: opponent.finishedAt
        },
        计算结果: result
      });
      
      setGameResult(result);
    } else {
      console.error('计算游戏结果失败：无法找到当前用户或对手信息', {
        currentUser: currentUser?.userId,
        opponent: opponent?.userId,
        finalRoom
      });
    }
  };

  // 处理返回房间
  const handleBackToRoom = async () => {
    try {
      // 重置房间状态
      const response = await apiService.resetRoom(currentRoom.roomCode);
      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
        setGameResult(null);
        onBackToRoom();
      } else {
        console.error('重置房间失败:', response.error);
        // 即使重置失败，也返回房间
        onBackToRoom();
      }
    } catch (error) {
      console.error('重置房间时出错:', error);
      // 出错时也返回房间
      onBackToRoom();
    }
  };

  // 组件挂载时开始轮询
  useEffect(() => {
    setGameStartTime(Date.now());
    startRoomPolling();

    return () => {
      if (roomPollingInterval) {
        clearInterval(roomPollingInterval);
      }
    };
  }, [startRoomPolling]);

  // 处理游戏完成
  const handleGameComplete = async (completionTime: number, moves: number) => {
    if (gameCompleted) return; // 防止重复提交

    setGameCompleted(true);
    
    console.log('游戏完成，接收到的参数:', { completionTime, moves, type: 'PuzzleGame传入的是秒数' });
    
    try {
      const response = await apiService.finishMultiplayerGame(currentRoom.roomCode, {
        completionTime: completionTime, // completionTime已经是秒数，无需转换
        movesCount: moves
      });

      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
        
        // 立即计算并显示结果，不等待所有人完成
        calculateGameResult(response.data.room);
      } else {
        console.error('API返回失败:', response.error);
        // API失败时，创建本地结果显示
        createLocalGameResult(completionTime, moves);
      }
    } catch (error) {
      console.error('提交游戏结果失败:', error);
      // 网络错误时，创建本地结果显示
      createLocalGameResult(completionTime, moves);
    }
  };

  // 创建本地游戏结果（当API失败时的兜底方案）
  const createLocalGameResult = (completionTime: number, moves: number) => {
    console.log('创建本地游戏结果，API调用失败时的兜底，completionTime已经是秒数:', { completionTime, moves });
    
    const opponent = getOpponentInfo();
    const result = {
      isWinner: true, // 暂时标记为领先，等待后续更新
      myTime: completionTime, // completionTime已经是秒数
      myMoves: moves,
      opponentTime: null,
      opponentMoves: null,
      opponentName: opponent?.username || '对手',
      opponentFinished: false
    };
    
    setGameResult(result);
    
    // 继续轮询以获取最终结果
    if (!roomPollingInterval) {
      startRoomPolling();
    }
  };

  // 获取当前用户状态
  const getCurrentUserStatus = () => {
    const currentUser = currentRoom.players.find(p => p.userId === authState.user?.id);
    return currentUser?.status || 'playing';
  };

  // 获取对手信息
  const getOpponentInfo = () => {
    return currentRoom.players.find(p => p.userId !== authState.user?.id);
  };

  const opponent = getOpponentInfo();
  const currentUserStatus = getCurrentUserStatus();

  // 如果正在生成拼图配置，显示加载状态
  if (isGeneratingPuzzle || !puzzleConfig) {
    return (
      <div className="multiplayer-game-page">
        <div className="game-info-panel">
          <div className="room-info">
            <span className="room-code">房间: {currentRoom.roomCode}</span>
            <span className="game-mode">⚔️ 联机对战</span>
          </div>
        </div>
        
        <div className="game-loading">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2>正在生成拼图...</h2>
            <p>请稍候，正在为您准备专属拼图</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果显示游戏结果
  if (gameResult) {
    return (
      <div className="multiplayer-game-result">
        <div className="result-container">
          <div className="result-header">
            <h1 className={`result-title ${gameResult.isWinner ? 'winner' : 'loser'}`}>
              {gameResult.opponentFinished 
                ? (gameResult.isWinner ? '🎉 胜利！' : '😔 失败')
                : '⏳ 领先中！'
              }
            </h1>
            <p className="result-subtitle">
              {gameResult.opponentFinished 
                ? (gameResult.isWinner ? '恭喜你赢得了这场对战！' : '下次再接再厉！')
                : '你已完成拼图，等待对手完成...'
              }
            </p>
          </div>

          <div className="result-stats">
            <div className="player-stats">
              <div className="stats-header">
                <span className="player-avatar">👤</span>
                <span className="player-name">{authState.user?.username} (你)</span>
                {gameResult.isWinner && <span className="winner-crown">👑</span>}
              </div>
              <div className="stats-details">
                <div className="stat-item">
                  <span className="stat-label">完成时间:</span>
                  <span className="stat-value">{gameResult.myTime}秒</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">移动次数:</span>
                  <span className="stat-value">{gameResult.myMoves}次</span>
                </div>
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div className="player-stats">
              <div className="stats-header">
                <span className="player-avatar">👤</span>
                <span className="player-name">{gameResult.opponentName}</span>
                {gameResult.opponentFinished && !gameResult.isWinner && <span className="winner-crown">👑</span>}
              </div>
              <div className="stats-details">
                {gameResult.opponentFinished ? (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">完成时间:</span>
                      <span className="stat-value">{gameResult.opponentTime}秒</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">移动次数:</span>
                      <span className="stat-value">{gameResult.opponentMoves}次</span>
                    </div>
                  </>
                ) : (
                  <div className="stat-item">
                    <span className="stat-label">状态:</span>
                    <span className="stat-value waiting">🎮 游戏中...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="result-actions">
            <Button
              onClick={handleBackToRoom}
              variant="primary"
              size="large"
            >
              🏠 返回房间
            </Button>
            <Button
              onClick={onGameComplete}
              variant="secondary"
              size="large"
            >
              🚪 退出联机
            </Button>
            {!gameResult.opponentFinished && (
              <Button
                onClick={async () => {
                  // 立即获取最新房间状态
                  try {
                    console.log('手动刷新房间状态...');
                    const response = await apiService.getRoomInfo(currentRoom.roomCode);
                    if (response.success && response.data) {
                      console.log('手动刷新获取到房间数据:', response.data.room);
                      setCurrentRoom(response.data.room);
                      calculateGameResult(response.data.room);
                    }
                  } catch (error) {
                    console.error('手动刷新房间状态失败:', error);
                  }
                }}
                variant="secondary"
                size="small"
              >
                🔄 刷新状态
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="multiplayer-game-page">
      {/* 游戏信息面板 */}
      <div className="game-info-panel">
        <div className="room-info">
          <span className="room-code">房间: {currentRoom.roomCode}</span>
          <span className="game-mode">⚔️ 联机对战</span>
        </div>

        <div className="players-status">
          <div className="player-status">
            <span className="player-name">👤 {authState.user?.username} (你)</span>
            <span className={`status-indicator ${currentUserStatus}`}>
              {currentUserStatus === 'playing' ? '🎮 游戏中' : 
               currentUserStatus === 'finished' ? '✅ 已完成' : '⏳ 等待中'}
            </span>
          </div>

          <div className="player-status">
            <span className="player-name">👤 {opponent?.username || '等待对手'}</span>
            <span className={`status-indicator ${opponent?.status || 'waiting'}`}>
              {opponent?.status === 'playing' ? '🎮 游戏中' : 
               opponent?.status === 'finished' ? '✅ 已完成' : '⏳ 等待中'}
            </span>
          </div>
        </div>

        <div className="game-controls">
          <Button
            onClick={onBackToRoom}
            variant="secondary"
            size="small"
          >
            ← 返回房间
          </Button>
        </div>
      </div>

      {/* 对手完成提示 */}
      {opponentFinished && !gameCompleted && (
        <div className="opponent-finished-notice">
          <span className="notice-icon">⚡</span>
          <span className="notice-text">{opponent?.username} 已完成拼图！加油追赶！</span>
        </div>
      )}

      {/* 拼图游戏区域 */}
      <div className="game-area">
        {puzzleConfig.pieceShape === 'irregular' ? (
          <IrregularPuzzleGame
            imageData={puzzleConfig.originalImage}
            gridSize={`${puzzleConfig.gridSize.rows}x${puzzleConfig.gridSize.cols}` as '3x3' | '4x4' | '5x5' | '6x6'}
            onBackToMenu={onBackToRoom}
          />
        ) : puzzleConfig.pieceShape === 'tetris' ? (
          <TetrisPuzzleGame
            puzzleConfig={puzzleConfig}
            onGameComplete={handleGameComplete}
            onBackToMenu={onBackToRoom}
            isMultiplayer={true}
          />
        ) : (
          <PuzzleGame
            puzzleConfig={puzzleConfig}
            onGameComplete={handleGameComplete}
            onBackToMenu={onBackToRoom}
            isMultiplayer={true}
          />
        )}
      </div>
    </div>
  );
};
