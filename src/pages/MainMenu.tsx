import React, { useState } from 'react';
import { Asset, PuzzleConfig, DifficultyLevel, PieceShape } from '../types';
import { AssetLibrary } from '../components/game/AssetLibrary';
import { Button } from '../components/common/Button';
import { GameHelpButton } from '../components/common/GameHelp';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: (puzzleConfig: PuzzleConfig) => void;
  onOpenEditor: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenEditor,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [pieceShape, setPieceShape] = useState<PieceShape>('square');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleStartGame = async () => {
    if (!selectedAsset) return;

    setIsGenerating(true);
    try {
      // 使用真实的图片数据
      const imageData = selectedAsset.filePath;
      
      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
      
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: imageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
      });

      onStartGame(puzzleConfig);
    } catch (error) {
      console.error('生成拼图失败:', error);
      // 如果图片加载失败，使用备用的色块
      const fallbackImageData = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#${Math.floor(Math.random()*16777215).toString(16)}"/>
          <text x="200" y="200" text-anchor="middle" fill="white" font-size="24">${selectedAsset.name}</text>
        </svg>
      `)}`;
      
      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: fallbackImageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
      });
      
      onStartGame(puzzleConfig);
    } finally {
      setIsGenerating(false);
    }
  };

  const canStartGame = selectedAsset !== null && !isGenerating;

  return (
    <div className="main-menu">
      <div className="menu-header">
        <div className="header-content">
          <h1>🧩 拼图大师</h1>
          <p>选择素材，开始你的拼图之旅</p>
        </div>
        <div className="header-actions">
          <GameHelpButton />
        </div>
      </div>

      <div className="menu-content">
        {/* 素材选择区域 */}
        <div className="asset-section">
          <AssetLibrary
            onAssetSelect={handleAssetSelect}
            showUpload={true}
          />
        </div>

        {/* 游戏配置区域 */}
        <div className="config-section">
          <div className="config-panel">
            <h3>游戏设置</h3>
            
            {/* 选中素材预览 */}
            {selectedAsset && (
              <div className="selected-asset">
                <h4>已选择素材</h4>
                <div className="asset-preview">
                  <div className="preview-image">
                    <img 
                      src={selectedAsset.thumbnail} 
                      alt={selectedAsset.name}
                      className="selected-asset-image"
                      onError={(e) => {
                        // 如果图片加载失败，显示占位符
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                    <div className="placeholder-preview" style={{ display: 'none' }}>
                      <span>{selectedAsset.name}</span>
                    </div>
                  </div>
                  <div className="asset-details">
                    <p><strong>名称:</strong> {selectedAsset.name}</p>
                    <p><strong>分类:</strong> {selectedAsset.category}</p>
                    <p><strong>尺寸:</strong> {selectedAsset.width} × {selectedAsset.height}</p>
                    <p><strong>标签:</strong> {selectedAsset.tags.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 难度选择 */}
            <div className="difficulty-selector">
              <h4>难度等级</h4>
              <div className="difficulty-options">
                {[
                  { value: 'easy', label: '简单 (3×3)', color: '#10B981' },
                  { value: 'medium', label: '中等 (4×4)', color: '#3B82F6' },
                  { value: 'hard', label: '困难 (5×5)', color: '#F59E0B' },
                  { value: 'expert', label: '专家 (6×6)', color: '#EF4444' },
                ].map(option => (
                  <button
                    key={option.value}
                    className={`difficulty-btn ${difficulty === option.value ? 'active' : ''}`}
                    onClick={() => setDifficulty(option.value as DifficultyLevel)}
                    style={{ '--active-color': option.color } as React.CSSProperties}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 拼图形状选择 */}
            <div className="shape-selector">
              <h4>拼图形状</h4>
              <div className="shape-options">
                {[
                  { value: 'square', label: '方形', icon: '⬜' },
                  { value: 'triangle', label: '三角形', icon: '🔺' },
                  { value: 'irregular', label: '异形', icon: '🧩' },
                ].map(option => (
                  <button
                    key={option.value}
                    className={`shape-btn ${pieceShape === option.value ? 'active' : ''}`}
                    onClick={() => setPieceShape(option.value as PieceShape)}
                  >
                    <span className="shape-icon">{option.icon}</span>
                    <span className="shape-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              <Button
                onClick={handleStartGame}
                variant="primary"
                size="large"
                disabled={!canStartGame}
                className="start-btn"
              >
                {isGenerating ? '生成中...' : '开始游戏'}
              </Button>
              
              <Button
                onClick={onOpenEditor}
                variant="secondary"
                size="large"
                className="editor-btn"
              >
                🎨 拼图编辑器
              </Button>
            </div>

            {!selectedAsset && (
              <div className="selection-hint">
                <p>💡 请先从左侧素材库选择一个素材</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="menu-footer">
        <p>🎮 点击选择拼图块，再点击答题卡槽位放置 | R键旋转 | F键翻转 | Ctrl+Z 撤销</p>
        <p>💡 详细游戏说明请查看项目目录下的 <code>GAME_GUIDE.md</code> 文件</p>
        <p>© 2024 拼图大师 - Tauri + React + TypeScript</p>
      </div>
    </div>
  );
};