import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import './Multiplayer.css';

interface MultiplayerProps {
  onBackToMenu: () => void;
}

interface Room {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: 2; // 固定最多2人
  puzzle: {
    title: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    gridSize: string;
    image: string;
  };
  isPrivate: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  shareCode?: string;
}

export const Multiplayer: React.FC<MultiplayerProps> = ({ onBackToMenu }) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'myrooms'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState('random');
  const [isPrivate, setIsPrivate] = useState(false);

  // 模拟房间数据
  const publicRooms: Room[] = [
    {
      id: 'room-001',
      name: '樱花拼图挑战',
      hostName: '拼图达人',
      playerCount: 1,
      maxPlayers: 2,
      puzzle: {
        title: '樱花飞舞',
        difficulty: 'medium',
        gridSize: '4x4',
        image: '/images/puzzles/sakura.jpg'
      },
      isPrivate: false,
      status: 'waiting',
      createdAt: new Date('2024-01-20T10:30:00'),
      shareCode: 'SAKURA123'
    },
    {
      id: 'room-002',
      name: '风景大挑战',
      hostName: '自然爱好者',
      playerCount: 2,
      maxPlayers: 2,
      puzzle: {
        title: '山水如画',
        difficulty: 'hard',
        gridSize: '5x5',
        image: '/images/puzzles/landscape.jpg'
      },
      isPrivate: false,
      status: 'playing',
      createdAt: new Date('2024-01-20T09:15:00')
    }
  ];

  const myRooms: Room[] = [
    {
      id: 'myroom-001',
      name: '我的专属房间',
      hostName: '我',
      playerCount: 1,
      maxPlayers: 2,
      puzzle: {
        title: '星空之夜',
        difficulty: 'expert',
        gridSize: '6x6',
        image: '/images/puzzles/starnight.jpg'
      },
      isPrivate: true,
      status: 'waiting',
      createdAt: new Date('2024-01-20T11:00:00'),
      shareCode: 'STAR2024'
    }
  ];

  const puzzleOptions = [
    { value: 'random', label: '随机拼图', icon: '🎲' },
    { value: 'daily', label: '今日挑战', icon: '📅' },
    { value: 'custom', label: '自定义拼图', icon: '🎨' }
  ];

  const getDifficultyColor = (difficulty: Room['puzzle']['difficulty']) => {
    const colors = {
      easy: '#10b981',
      medium: '#3b82f6',
      hard: '#f59e0b',
      expert: '#ef4444'
    };
    return colors[difficulty];
  };

  const getDifficultyLabel = (difficulty: Room['puzzle']['difficulty']) => {
    const labels = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
      expert: '专家'
    };
    return labels[difficulty];
  };

  const getStatusLabel = (status: Room['status']) => {
    const labels = {
      waiting: '等待中',
      playing: '游戏中',
      finished: '已结束'
    };
    return labels[status];
  };

  const getStatusColor = (status: Room['status']) => {
    const colors = {
      waiting: '#10b981',
      playing: '#f59e0b',
      finished: '#6b7280'
    };
    return colors[status];
  };

  const handleJoinRoom = (roomId: string) => {
    alert(`加入房间功能正在开发中！房间ID: ${roomId}`);
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) {
      alert('请输入房间代码');
      return;
    }
    alert(`通过代码加入房间功能正在开发中！代码: ${joinCode}`);
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert('请输入房间名称');
      return;
    }
    alert('创建房间功能正在开发中！');
  };

  const handleCopyShareCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode).then(() => {
      alert(`分享代码已复制: ${shareCode}`);
    }).catch(() => {
      alert(`分享代码: ${shareCode}`);
    });
  };

  const renderJoinTab = () => (
    <div className="join-room-section">
      <div className="join-by-code">
        <h3>🔗 通过代码加入</h3>
        <div className="code-input-group">
          <input
            type="text"
            placeholder="输入房间分享代码"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="code-input"
            maxLength={10}
          />
          <Button
            onClick={handleJoinByCode}
            variant="primary"
            size="medium"
            disabled={!joinCode.trim()}
          >
            加入房间
          </Button>
        </div>
        <p className="code-hint">💡 向朋友要分享代码，即可快速加入对战</p>
      </div>

      <div className="public-rooms">
        <h3>🌐 公开房间</h3>
        {publicRooms.length > 0 ? (
          <div className="rooms-list">
            {publicRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <div className="room-info">
                    <h4 className="room-name">{room.name}</h4>
                    <div className="room-meta">
                      <span className="host-name">👤 {room.hostName}</span>
                      <span className="player-count">
                        👥 {room.playerCount}/{room.maxPlayers}
                      </span>
                      <span 
                        className="room-status"
                        style={{ color: getStatusColor(room.status) }}
                      >
                        ● {getStatusLabel(room.status)}
                      </span>
                    </div>
                  </div>
                  <div className="room-actions">
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      variant="primary"
                      size="medium"
                      disabled={room.status !== 'waiting' || room.playerCount >= room.maxPlayers}
                    >
                      {room.status === 'waiting' && room.playerCount < room.maxPlayers ? '加入' : 
                       room.status === 'playing' ? '观战' : '已满'}
                    </Button>
                  </div>
                </div>

                <div className="puzzle-info">
                  <div className="puzzle-image">
                    <div className="image-placeholder">
                      <span className="placeholder-icon">🧩</span>
                    </div>
                  </div>
                  <div className="puzzle-details">
                    <h5 className="puzzle-title">{room.puzzle.title}</h5>
                    <div className="puzzle-meta">
                      <span 
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(room.puzzle.difficulty) }}
                      >
                        {getDifficultyLabel(room.puzzle.difficulty)}
                      </span>
                      <span className="grid-size">{room.puzzle.gridSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-rooms">
            <div className="empty-icon">🏠</div>
            <h4>暂无公开房间</h4>
            <p>创建一个房间来开始对战吧！</p>
          </div>
        )}
      </div>
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
          />
        </div>

        <div className="form-group">
          <label>拼图选择</label>
          <div className="puzzle-options">
            {puzzleOptions.map((option) => (
              <button
                key={option.value}
                className={`puzzle-option ${selectedPuzzle === option.value ? 'selected' : ''}`}
                onClick={() => setSelectedPuzzle(option.value)}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">🔒 私密房间（需要分享代码才能加入）</span>
          </label>
        </div>

        <div className="room-settings-summary">
          <h4>📋 房间设置</h4>
          <div className="settings-list">
            <div className="setting-item">
              <span className="setting-label">最大人数:</span>
              <span className="setting-value">2人</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">房间类型:</span>
              <span className="setting-value">{isPrivate ? '私密房间' : '公开房间'}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">拼图类型:</span>
              <span className="setting-value">
                {puzzleOptions.find(p => p.value === selectedPuzzle)?.label}
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button
            onClick={handleCreateRoom}
            variant="primary"
            size="large"
            disabled={!roomName.trim()}
            className="create-btn"
          >
            🎯 创建房间
          </Button>
        </div>
      </div>

      <div className="create-tips">
        <h4>💡 创建提示</h4>
        <div className="tips-list">
          <div className="tip-item">
            <span className="tip-icon">👥</span>
            <span className="tip-text">房间最多支持2人对战</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🔗</span>
            <span className="tip-text">私密房间会生成分享代码，发给朋友即可加入</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎮</span>
            <span className="tip-text">房主可以选择拼图类型和难度</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⏱️</span>
            <span className="tip-text">对战模式以最快完成为胜利条件</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyRoomsTab = () => (
    <div className="my-rooms-section">
      <div className="my-rooms-header">
        <h3>🏠 我的房间</h3>
        <div className="rooms-stats">
          <span className="stat-item">
            <span className="stat-value">{myRooms.length}</span>
            <span className="stat-label">创建的房间</span>
          </span>
        </div>
      </div>

      {myRooms.length > 0 ? (
        <div className="my-rooms-list">
          {myRooms.map((room) => (
            <div key={room.id} className="my-room-card">
              <div className="room-header">
                <div className="room-info">
                  <h4 className="room-name">{room.name}</h4>
                  <div className="room-meta">
                    <span className="player-count">
                      👥 {room.playerCount}/{room.maxPlayers}
                    </span>
                    <span 
                      className="room-status"
                      style={{ color: getStatusColor(room.status) }}
                    >
                      ● {getStatusLabel(room.status)}
                    </span>
                    <span className="created-time">
                      📅 {room.createdAt.toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="room-actions">
                  <Button
                    onClick={() => handleJoinRoom(room.id)}
                    variant="primary"
                    size="medium"
                  >
                    进入房间
                  </Button>
                </div>
              </div>

              <div className="puzzle-info">
                <div className="puzzle-image">
                  <div className="image-placeholder">
                    <span className="placeholder-icon">🧩</span>
                  </div>
                </div>
                <div className="puzzle-details">
                  <h5 className="puzzle-title">{room.puzzle.title}</h5>
                  <div className="puzzle-meta">
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(room.puzzle.difficulty) }}
                    >
                      {getDifficultyLabel(room.puzzle.difficulty)}
                    </span>
                    <span className="grid-size">{room.puzzle.gridSize}</span>
                  </div>
                </div>
              </div>

              {room.shareCode && (
                <div className="share-code-section">
                  <div className="share-code-info">
                    <span className="share-label">分享代码:</span>
                    <span className="share-code">{room.shareCode}</span>
                  </div>
                  <Button
                    onClick={() => handleCopyShareCode(room.shareCode!)}
                    variant="secondary"
                    size="small"
                  >
                    📋 复制
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-my-rooms">
          <div className="empty-icon">🏗️</div>
          <h4>还没有创建房间</h4>
          <p>创建你的第一个对战房间吧！</p>
          <Button
            onClick={() => setActiveTab('create')}
            variant="primary"
            size="large"
          >
            创建房间
          </Button>
        </div>
      )}
    </div>
  );

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
