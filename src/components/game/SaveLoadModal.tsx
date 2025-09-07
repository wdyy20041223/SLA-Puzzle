import React, { useState, useEffect } from 'react';
import { SavedPuzzleGame } from '../../services/puzzleSaveService';
import { Button } from '../common/Button';
import './SaveLoadModal.css';

interface SaveLoadModalProps {
  isVisible: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  savedGames: SavedPuzzleGame[];
  currentGameProgress?: number;
  onSaveGame: (description?: string) => { success: boolean; error?: string };
  onLoadGame: (saveId: string) => { success: boolean; error?: string };
  onDeleteSave: (saveId: string) => { success: boolean; error?: string };
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isVisible,
  onClose,
  mode,
  savedGames,
  currentGameProgress = 0,
  onSaveGame,
  onLoadGame,
  onDeleteSave,
}) => {
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 重置状态
  useEffect(() => {
    if (isVisible) {
      setSaveDescription('');
      setSelectedSaveId(null);
      setMessage(null);
      setShowDeleteConfirm(null);
      setIsProcessing(false);
    }
  }, [isVisible, mode]);

  // 关闭模态框
  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  // 处理保存游戏
  const handleSave = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      const result = onSaveGame(saveDescription.trim() || undefined);
      
      if (result.success) {
        setMessage({ type: 'success', text: '游戏保存成功！' });
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存时发生错误' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理加载游戏
  const handleLoad = async () => {
    if (isProcessing || !selectedSaveId) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      const result = onLoadGame(selectedSaveId);
      
      if (result.success) {
        setMessage({ type: 'success', text: '游戏加载成功！' });
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || '加载失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '加载时发生错误' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理删除保存
  const handleDelete = async (saveId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      const result = onDeleteSave(saveId);
      
      if (result.success) {
        setMessage({ type: 'success', text: '删除成功！' });
        setShowDeleteConfirm(null);
        if (selectedSaveId === saveId) {
          setSelectedSaveId(null);
        }
      } else {
        setMessage({ type: 'error', text: result.error || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除时发生错误' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 格式化日期
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 计算保存游戏的进度
  const calculateSaveProgress = (savedGame: SavedPuzzleGame) => {
    const { answerGrid } = savedGame.gameState;
    if (!answerGrid || answerGrid.length === 0) return 0;
    
    const totalSlots = answerGrid.length;
    const filledSlots = answerGrid.filter(slot => slot !== null).length;
    
    return Math.round((filledSlots / totalSlots) * 100);
  };

  if (!isVisible) return null;

  return (
    <div className="save-load-modal-overlay">
      <div className="save-load-modal">
        <div className="modal-header">
          <h2>{mode === 'save' ? '💾 保存游戏' : '📂 加载游戏'}</h2>
          <button 
            className="close-button"
            onClick={handleClose}
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {mode === 'save' ? (
            <div className="save-section">
              <div className="current-game-info">
                <h3>当前游戏进度</h3>
                <div className="progress-info">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${currentGameProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{currentGameProgress.toFixed(1)}%</span>
                </div>
              </div>

              <div className="save-input-section">
                <label htmlFor="save-description">保存描述（可选）：</label>
                <input
                  id="save-description"
                  type="text"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="为这个保存添加一个描述..."
                  maxLength={100}
                  disabled={isProcessing}
                />
                <div className="char-count">
                  {saveDescription.length}/100
                </div>
              </div>

              <div className="action-buttons">
                <Button 
                  onClick={handleSave}
                  variant="primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? '保存中...' : '保存游戏'}
                </Button>
                <Button 
                  onClick={handleClose}
                  variant="secondary"
                  disabled={isProcessing}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="load-section">
              {savedGames.length === 0 ? (
                <div className="no-saves">
                  <div className="no-saves-icon">📭</div>
                  <p>还没有保存的游戏</p>
                  <p className="no-saves-hint">开始游戏后可以保存进度</p>
                </div>
              ) : (
                <>
                  <div className="saves-list">
                    {savedGames.map((savedGame) => (
                      <div 
                        key={savedGame.id}
                        className={`save-item ${selectedSaveId === savedGame.id ? 'selected' : ''}`}
                        onClick={() => setSelectedSaveId(savedGame.id)}
                      >
                        <div className="save-info">
                          <div className="save-header">
                            <h4>{savedGame.gameState.config.name}</h4>
                            <span className="save-date">
                              {formatDate(savedGame.savedAt)}
                            </span>
                          </div>
                          
                          <div className="save-details">
                            <div className="save-progress">
                              <span>进度: {calculateSaveProgress(savedGame)}%</span>
                              <span>步数: {savedGame.gameState.moves}</span>
                              <span>难度: {savedGame.gameState.config.difficulty}</span>
                            </div>
                            
                            {savedGame.description && (
                              <div className="save-description">
                                {savedGame.description}
                              </div>
                            )}
                          </div>

                          <div className="save-progress-bar">
                            <div 
                              className="save-progress-fill"
                              style={{ width: `${calculateSaveProgress(savedGame)}%` }}
                            />
                          </div>
                        </div>

                        <div className="save-actions">
                          <button
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(savedGame.id);
                            }}
                            disabled={isProcessing}
                            title="删除此保存"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="action-buttons">
                    <Button 
                      onClick={handleLoad}
                      variant="primary"
                      disabled={isProcessing || !selectedSaveId}
                    >
                      {isProcessing ? '加载中...' : '加载游戏'}
                    </Button>
                    <Button 
                      onClick={handleClose}
                      variant="secondary"
                      disabled={isProcessing}
                    >
                      取消
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* 删除确认弹窗 */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <h3>确认删除</h3>
              <p>确定要删除这个保存的游戏吗？此操作无法撤销。</p>
              <div className="delete-confirm-actions">
                <Button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  variant="danger"
                  disabled={isProcessing}
                >
                  确认删除
                </Button>
                <Button 
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="secondary"
                  disabled={isProcessing}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
