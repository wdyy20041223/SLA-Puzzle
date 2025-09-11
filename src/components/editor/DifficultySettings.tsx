import React, { useState } from 'react';
import { Button } from '../common/Button';
import { DifficultyLevel, PieceShape } from '../../types';
import './DifficultySettings.css';

interface DifficultySettingsProps {
  onComplete: (difficulty: DifficultyLevel, pieceShape: PieceShape) => void;
  onBack: () => void;
  onPreviewClick?: () => void;
  hasPreviewImage?: boolean;
}

export const DifficultySettings: React.FC<DifficultySettingsProps> = ({
  onComplete,
  onBack,
  onPreviewClick,
  hasPreviewImage
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedShape, setSelectedShape] = useState<PieceShape>('square');

  const difficultyOptions = [
    {
      value: 'easy' as DifficultyLevel,
      label: '简单',
      grid: '3×3',
      pieces: 9,
      color: '#10b981',
      icon: '😊'
    },
    {
      value: 'medium' as DifficultyLevel,
      label: '中等',
      grid: '4×4',
      pieces: 16,
      color: '#3b82f6',
      icon: '🤔'
    },
    {
      value: 'hard' as DifficultyLevel,
      label: '困难',
      grid: '5×5',
      pieces: 25,
      color: '#f59e0b',
      icon: '😤'
    },
    {
      value: 'expert' as DifficultyLevel,
      label: '专家',
      grid: '6×6',
      pieces: 36,
      color: '#ef4444',
      icon: '🔥'
    }
  ];

  const shapeOptions = [
    {
      value: 'square' as PieceShape,
      label: '方形拼块',
      icon: '⬜',
      description: '经典方形，简单直观',
      preview: '/images/shapes/square-preview.svg',
      difficulty: '简单'
    },
    {
      value: 'triangle' as PieceShape,
      label: '三角拼块',
      icon: '🔺',
      description: '三角形状，增加趣味性',
      preview: '/images/shapes/triangle-preview.svg',
      difficulty: '中等',
      comingSoon: true
    },
    {
      value: 'irregular' as PieceShape,
      label: '异形拼块',
      icon: '🧩',
      description: '传统拼图形状，更有挑战',
      preview: '/images/shapes/irregular-preview.svg',
      difficulty: '困难',
      comingSoon: true
    }
  ];

  const handleComplete = () => {
    onComplete(selectedDifficulty, selectedShape);
  };

  return (
    <div className="difficulty-settings">
      <div className="settings-section">
        <h3>🎯 选择难度等级</h3>
        <p className="section-description">
          选择适合您的拼图难度，不同难度将生成不同数量的拼块
        </p>
        
        <div className="difficulty-grid">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              className={`difficulty-card ${selectedDifficulty === option.value ? 'selected' : ''}`}
              onClick={() => setSelectedDifficulty(option.value)}
              style={{ '--accent-color': option.color } as React.CSSProperties}
            >
              <div className="card-header">
                <span className="difficulty-icon">{option.icon}</span>
                <div className="difficulty-info">
                  <h4>{option.label}</h4>
                  <span className="grid-size">{option.grid} 网格</span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="difficulty-stats">
                  <div className="stat-item">
                    <span className="stat-label">拼块数量</span>
                    <span className="stat-value">{option.pieces}块</span>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <div className={`selection-indicator ${selectedDifficulty === option.value ? 'active' : ''}`}>
                  {selectedDifficulty === option.value ? '✓ 已选择' : '点击选择'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>🎨 选择拼块形状</h3>
        <p className="section-description">
          不同的拼块形状将带来不同的游戏体验和视觉效果
        </p>
        
        <div className="shape-grid">
          {shapeOptions.map((option) => (
            <button
              key={option.value}
              className={`shape-card ${selectedShape === option.value ? 'selected' : ''} ${option.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => !option.comingSoon && setSelectedShape(option.value)}
              disabled={option.comingSoon}
            >
              <div className="shape-header">
                <span className="shape-icon">{option.icon}</span>
                <h4>{option.label}</h4>
                {option.comingSoon && (
                  <span className="coming-soon-badge">即将推出</span>
                )}
              </div>
              
              <div className="shape-preview">
                {/* 这里可以放置形状预览图 */}
                <div className="preview-placeholder">
                  <span className="preview-icon">{option.icon}</span>
                  <span className="preview-text">形状预览</span>
                </div>
              </div>
              
              <div className="shape-details">
                <p className="shape-description">{option.description}</p>
                <div className="shape-meta">
                  <span className="difficulty-badge" data-difficulty={option.difficulty.toLowerCase()}>
                    难度: {option.difficulty}
                  </span>
                </div>
              </div>
              
              {!option.comingSoon && (
                <div className={`selection-indicator ${selectedShape === option.value ? 'active' : ''}`}>
                  {selectedShape === option.value ? '✓ 已选择' : '点击选择'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-summary">
        <h3>📋 当前配置</h3>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">难度等级:</span>
            <span className="summary-value">
              {difficultyOptions.find(d => d.value === selectedDifficulty)?.label}
              ({difficultyOptions.find(d => d.value === selectedDifficulty)?.grid})
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">拼块形状:</span>
            <span className="summary-value">
              {shapeOptions.find(s => s.value === selectedShape)?.label}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">拼块总数:</span>
            <span className="summary-value">
              {difficultyOptions.find(d => d.value === selectedDifficulty)?.pieces}块
            </span>
          </div>

        </div>
      </div>

      <div className="settings-actions">
        <div className="action-left">
          <Button
            onClick={onBack}
            variant="secondary"
            size="medium"
          >
            ← 返回裁剪
          </Button>
          
          {hasPreviewImage && onPreviewClick && (
            <Button
              onClick={onPreviewClick}
              variant="secondary"
              size="medium"
              className="preview-btn"
            >
              🔍 预览拼图效果
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleComplete}
          variant="primary"
          size="large"
          className="confirm-btn"
        >
          ✅ 确认设置
        </Button>
      </div>

      <div className="settings-tips">
        <h4>💡 设置建议</h4>
        <ul>
          <li><strong>初次体验:</strong> 建议选择简单或中等难度</li>
          <li><strong>图片细节:</strong> 细节丰富的图片适合更高难度</li>
          <li><strong>游戏时间:</strong> 根据可用时间选择合适难度</li>
          <li><strong>拼块形状:</strong> 方形拼块最适合初学者</li>
        </ul>
      </div>
    </div>
  );
};
