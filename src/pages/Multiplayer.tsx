import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/common/Button';
import { apiService, MultiplayerRoom, PuzzleConfigData } from '../services/apiService';
import { puzzleAssets, difficultyLabels, categoryLabels } from '../data/puzzleAssets';
import { useAuth } from '../contexts/AuthContext';
import './Multiplayer.css';

interface MultiplayerProps {
  onBackToMenu: () => void;
  onStartGame?: (roomData: { room: MultiplayerRoom }) => void;
}

export const Multiplayer: React.FC<MultiplayerProps> = ({ onBackToMenu, onStartGame }) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'myrooms'>('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加入房间相关状态
  const [joinCode, setJoinCode] = useState('');

  // 创建房间相关状态
  const [roomName, setRoomName] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [selectedGridSize, setSelectedGridSize] = useState('4x4');
  const [selectedPuzzle, setSelectedPuzzle] = useState<string>('random');
  const [selectedPieceShape, setSelectedPieceShape] = useState<'square' | 'triangle' | 'irregular' | 'tetris'>('square');

  // 当前房间状态
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [roomPollingInterval, setRoomPollingInterval] = useState<number | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (roomPollingInterval) {
        clearInterval(roomPollingInterval);
      }
    };
  }, [roomPollingInterval]);

  // 开始房间状态轮询
  const startRoomPolling = useCallback((roomCode: string) => {
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await apiService.getRoomInfo(roomCode);
        if (response.success && response.data) {
          setCurrentRoom(response.data.room);
          
          // 如果游戏开始了，跳转到游戏页面
          if (response.data.room.status === 'playing' && onStartGame) {
            clearInterval(interval);
            setRoomPollingInterval(null);
            onStartGame({ room: response.data.room });
          }
        }
      } catch (error) {
        console.error('轮询房间状态失败:', error);
      }
    }, 2000); // 每2秒轮询一次

    setRoomPollingInterval(interval);
  }, [roomPollingInterval, onStartGame]);

  // 停止房间状态轮询
  const stopRoomPolling = useCallback(() => {
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
      setRoomPollingInterval(null);
    }
  }, [roomPollingInterval]);

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setError('请输入房间代码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.joinRoom(joinCode.toUpperCase());
      
      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
        startRoomPolling(response.data.room.roomCode);
        setActiveTab('myrooms'); // 切换到房间管理标签
      } else {
        setError(response.error || '加入房间失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }

    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 构建拼图配置
      const puzzleConfig: PuzzleConfigData = {
        difficulty: selectedDifficulty,
        gridSize: selectedGridSize,
        pieceShape: selectedPieceShape,
      };

      // 如果选择了特定拼图而不是随机
      if (selectedPuzzle !== 'random' && selectedPuzzle !== 'volcanic_journey') {
        const puzzle = puzzleAssets.find(p => p.id === selectedPuzzle);
        if (puzzle) {
          puzzleConfig.imageName = puzzle.name;
          puzzleConfig.imageData = puzzle.imagePath; // 添加图片路径
        }
      } else if (selectedPuzzle === 'volcanic_journey') {
        // 火山旅梦系列：从10张CG中随机选择一张
        const volcanicJourneyPuzzles = puzzleAssets.filter(p => p.category === 'volcanic_journey');
        const randomVolcanicPuzzle = volcanicJourneyPuzzles[Math.floor(Math.random() * volcanicJourneyPuzzles.length)];
        puzzleConfig.imageName = randomVolcanicPuzzle.name;
        puzzleConfig.imageData = randomVolcanicPuzzle.imagePath;
      } else {
        // 随机选择时也要设置图片数据
        const randomPuzzle = puzzleAssets[Math.floor(Math.random() * puzzleAssets.length)];
        puzzleConfig.imageName = randomPuzzle.name;
        puzzleConfig.imageData = randomPuzzle.imagePath;
      }

      const response = await apiService.createMultiplayerRoom({
        roomName: roomName.trim(),
        puzzleConfig,
        maxPlayers: 2
      });

      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
        startRoomPolling(response.data.room.roomCode);
        setActiveTab('myrooms'); // 切换到房间管理标签
        
        // 清空创建表单
        setRoomName('');
        setSelectedPuzzle('random');
      } else {
        setError(response.error || '创建房间失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }

    setLoading(false);
  };

  const handlePlayerReady = async () => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      const response = await apiService.setPlayerReady(currentRoom.roomCode);
      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
      } else {
        setError(response.error || '设置准备状态失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }
    setLoading(false);
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      const response = await apiService.startMultiplayerGame(currentRoom.roomCode);
      if (response.success && response.data) {
        setCurrentRoom(response.data.room);
        // 游戏开始后会通过轮询检测到状态变化并跳转
      } else {
        setError(response.error || '开始游戏失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    }
    setLoading(false);
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      await apiService.leaveRoom(currentRoom.roomCode);
      setCurrentRoom(null);
      stopRoomPolling();
    } catch (error) {
      setError('离开房间失败');
    }
    setLoading(false);
  };

  const handleCopyRoomCode = async () => {
    if (!currentRoom) return;

    try {
      await navigator.clipboard.writeText(currentRoom.roomCode);
      // 可以添加一个临时提示
      setError(null);
      alert(`房间代码已复制: ${currentRoom.roomCode}`);
    } catch (error) {
      // 如果复制失败，显示代码让用户手动复制
      alert(`房间代码: ${currentRoom.roomCode}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: '#10b981',
      medium: 'var(--primary-pink)',
      hard: '#f59e0b',
      expert: '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      waiting: '等待中',
      ready: '准备就绪',
      playing: '游戏中',
      finished: '已结束',
      closed: '已关闭'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: '#f59e0b',
      ready: '#10b981',
      playing: 'var(--primary-pink)',
      finished: '#6b7280',
      closed: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getCurrentUserStatus = () => {
    if (!currentRoom || !authState.user || !currentRoom.players) return null;
    const currentPlayer = currentRoom.players.find(p => p.userId === authState.user!.id);
    return currentPlayer?.status || null;
  };

  const isCurrentUserHost = () => {
    if (!currentRoom || !authState.user) return false;
    return currentRoom.hostUserId === authState.user.id;
  };

  const canStartGame = () => {
    if (!currentRoom || !isCurrentUserHost() || !currentRoom.players) return false;
    // 房主不需要准备，只需要房客都准备好
    const nonHostPlayers = currentRoom.players.filter(p => !p.isHost);
    return currentRoom.status === 'waiting' && 
           currentRoom.players.length >= 2 && 
           nonHostPlayers.length > 0 &&
           nonHostPlayers.every(p => p.status === 'ready');
  };

  const renderJoinTab = () => (
    <div className="join-room-section">
      <div className="join-by-code">
        <h3>🔗 通过代码加入</h3>
        <div className="code-input-group">
          <input
            type="text"
            placeholder="输入8位房间代码"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="code-input"
            maxLength={8}
            disabled={loading}
          />
          <Button
            onClick={handleJoinByCode}
            variant="primary"
            size="medium"
            disabled={!joinCode.trim() || loading}
          >
            {loading ? '加入中...' : '加入房间'}
          </Button>
        </div>
        <p className="code-hint">💡 向朋友要分享代码，即可快速加入对战</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="create-room-section">
      <div className="create-form">
        <h3>🏗️ 创建房间</h3>
        
        <div className="form-group">
          <label htmlFor="roomName">房间名称</label>
          <input
            id="roomName"
            type="text"
            placeholder="为你的房间起个名字"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="form-input"
            maxLength={20}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>拼图难度</label>
          <div className="difficulty-options">
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <button
                key={value}
                className={`difficulty-option ${selectedDifficulty === value ? 'selected' : ''}`}
                onClick={() => setSelectedDifficulty(value as any)}
                style={{ borderColor: selectedDifficulty === value ? getDifficultyColor(value) : undefined }}
                disabled={loading}
              >
                <span className="difficulty-color" style={{ backgroundColor: getDifficultyColor(value) }}></span>
                <span className="difficulty-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>网格大小</label>
          <div className="grid-size-options">
            {['3x3', '4x4', '5x5', '6x6'].map((size) => (
              <button
                key={size}
                className={`grid-size-option ${selectedGridSize === size ? 'selected' : ''}`}
                onClick={() => setSelectedGridSize(size)}
                disabled={loading}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>拼图形状</label>
          <div className="piece-shape-options">
            <button
              className={`piece-shape-option ${selectedPieceShape === 'square' ? 'selected' : ''}`}
              onClick={() => setSelectedPieceShape('square')}
              disabled={loading}
            >
              <span className="shape-icon">⬜</span>
              <span className="shape-label">方形拼图</span>
            </button>
            <button
              className={`piece-shape-option ${selectedPieceShape === 'triangle' ? 'selected' : ''}`}
              onClick={() => setSelectedPieceShape('triangle')}
              disabled={loading}
            >
              <span className="shape-icon">🔺</span>
              <span className="shape-label">三角拼图</span>
            </button>
            <button
              className={`piece-shape-option ${selectedPieceShape === 'irregular' ? 'selected' : ''}`}
              onClick={() => setSelectedPieceShape('irregular')}
              disabled={loading}
            >
              <span className="shape-icon">🧩</span>
              <span className="shape-label">异形拼图</span>
            </button>
            <button
              className={`piece-shape-option ${selectedPieceShape === 'tetris' ? 'selected' : ''}`}
              onClick={() => setSelectedPieceShape('tetris')}
              disabled={loading}
            >
              <span className="shape-icon">🎯</span>
              <span className="shape-label">俄罗斯方块</span>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>拼图选择</label>
          <div className="puzzle-selection">
            <div className="puzzle-option-item">
            <input
                type="radio"
                id="random"
                name="puzzle"
                value="random"
                checked={selectedPuzzle === 'random'}
                onChange={(e) => setSelectedPuzzle(e.target.value)}
                disabled={loading}
              />
              <label htmlFor="random">🎲 随机拼图</label>
        </div>

            <div className="puzzle-option-item">
            <input
                type="radio"
                id="volcanic_journey"
                name="puzzle"
                value="volcanic_journey"
                checked={selectedPuzzle === 'volcanic_journey'}
                onChange={(e) => setSelectedPuzzle(e.target.value)}
                disabled={loading}
              />
              <label htmlFor="volcanic_journey">🌋 火山旅梦</label>
        </div>

            {puzzleAssets.slice(0, 4).map((puzzle) => (
              <div key={puzzle.id} className="puzzle-option-item">
                <input
                  type="radio"
                  id={puzzle.id}
                  name="puzzle"
                  value={puzzle.id}
                  checked={selectedPuzzle === puzzle.id}
                  onChange={(e) => setSelectedPuzzle(e.target.value)}
                  disabled={loading}
                />
                <label htmlFor={puzzle.id}>
                  <span className="puzzle-icon">🧩</span>
                  <span className="puzzle-info">
                    <span className="puzzle-name">{puzzle.name}</span>
                    <span className="puzzle-category">{categoryLabels[puzzle.category]}</span>
              </span>
                </label>
            </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Button
            onClick={handleCreateRoom}
            variant="primary"
            size="large"
            disabled={!roomName.trim() || loading}
            className="create-btn"
          >
            {loading ? '创建中...' : '🎯 创建房间'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
      )}
    </div>
  );

  const renderMyRoomsTab = () => {
    if (!currentRoom) {
      return (
        <div className="empty-my-rooms">
          <div className="empty-icon">🏠</div>
          <h4>当前没有活跃房间</h4>
          <p>创建或加入一个房间来开始对战吧！</p>
          <div className="empty-actions">
            <Button
              onClick={() => setActiveTab('create')}
              variant="primary"
              size="large"
            >
              创建房间
            </Button>
            <Button
              onClick={() => setActiveTab('join')}
              variant="secondary"
              size="large"
            >
              加入房间
            </Button>
        </div>
      </div>
      );
    }

    const currentUserStatus = getCurrentUserStatus();
    // const isHost = isCurrentUserHost();  // 暂时注释掉未使用的变量

    return (
      <div className="current-room-section">
              <div className="room-header">
          <div className="room-title">
            <h3>🏠 {currentRoom.roomName}</h3>
            <div className="room-code-display">
              <span className="room-code-label">房间代码:</span>
              <span className="room-code-value">{currentRoom.roomCode}</span>
                  <Button
                onClick={handleCopyRoomCode}
                variant="secondary"
                size="small"
              >
                📋 复制
                  </Button>
                </div>
              </div>
          <div className="room-status">
            <span 
              className="status-indicator"
              style={{ color: getStatusColor(currentRoom.status) }}
            >
              ● {getStatusLabel(currentRoom.status)}
            </span>
                  </div>
                </div>

        <div className="room-info">
          <div className="puzzle-info">
            <h4>🧩 拼图信息</h4>
                <div className="puzzle-details">
                  <div className="puzzle-meta">
                    <span 
                      className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(currentRoom.puzzleConfig.difficulty) }}
                    >
                  {difficultyLabels[currentRoom.puzzleConfig.difficulty]}
                    </span>
                <span className="grid-size">{currentRoom.puzzleConfig.gridSize}</span>
                  </div>
              {currentRoom.puzzleConfig.imageName && (
                <div className="puzzle-name">{currentRoom.puzzleConfig.imageName}</div>
              )}
                </div>
              </div>

          <div className="players-info">
            <h4>👥 玩家列表 ({currentRoom.currentPlayers}/{currentRoom.maxPlayers})</h4>
            <div className="players-list">
              {currentRoom.players?.map((player) => (
                <div key={player.userId} className="player-item">
                  <div className="player-info">
                    <div className="player-name">
                      <span className="player-name-text">{player.username}</span>
                      <div className="player-badges">
                        {player.isHost && <span className="host-badge">👑</span>}
                        {player.userId === authState.user?.id && <span className="you-badge">你</span>}
                      </div>
                    </div>
                    <span 
                      className="player-status"
                      style={{ color: getStatusColor(player.status) }}
                    >
                      ● {getStatusLabel(player.status)}
                    </span>
                  </div>
                  {player.completionTime && (
                    <div className="player-result">
                      完成时间: {player.completionTime}秒 | 移动: {player.movesCount}次
                </div>
              )}
            </div>
          ))}
        </div>
          </div>
        </div>

        <div className="room-actions">
          {currentRoom.status === 'waiting' && (
            <>
              {/* 非房主玩家显示准备按钮 */}
              {!isCurrentUserHost() && currentUserStatus === 'joined' && (
                <Button
                  onClick={handlePlayerReady}
                  variant="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? '准备中...' : '✅ 准备就绪'}
                </Button>
              )}
              
              {/* 房主显示开始游戏按钮（当有房客且都准备好时） */}
              {isCurrentUserHost() && canStartGame() && (
          <Button
                  onClick={handleStartGame}
            variant="primary"
            size="large"
                  disabled={loading}
                >
                  {loading ? '开始中...' : '🚀 开始游戏'}
                </Button>
              )}

              {/* 房主等待房客准备的提示 */}
              {isCurrentUserHost() && !canStartGame() && currentRoom.players && currentRoom.players.length >= 2 && (
                <div className="waiting-message">
                  等待其他玩家准备...
                </div>
              )}

              {/* 房主等待更多玩家加入的提示 */}
              {isCurrentUserHost() && currentRoom.players && currentRoom.players.length < 2 && (
                <div className="waiting-message">
                  等待更多玩家加入房间...
                </div>
              )}
            </>
          )}

          <Button
            onClick={handleLeaveRoom}
            variant="secondary"
            size="medium"
            disabled={loading}
          >
            🚪 离开房间
          </Button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}
    </div>
  );
  };

  return (
    <div className="multiplayer-page">
      <div className="multiplayer-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>⚔️ 联机对战</h1>
        </div>
        
        <div className="multiplayer-tabs">
          <button
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <span className="tab-icon">🚪</span>
            <span className="tab-label">加入房间</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="tab-icon">🏗️</span>
            <span className="tab-label">创建房间</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'myrooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('myrooms')}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">我的房间</span>
          </button>
        </div>
      </div>

      <div className="multiplayer-content">
        {activeTab === 'join' && renderJoinTab()}
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'myrooms' && renderMyRoomsTab()}
      </div>
    </div>
  );
};
