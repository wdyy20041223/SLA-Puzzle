import React from 'react';
import { Button } from '../common/Button';
import './PreviewModal.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle: string;
  showPuzzleGrid?: boolean;
  gridSize?: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageTitle,
  showPuzzleGrid = false,
  gridSize = '4x4'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderPuzzleGrid = () => {
    if (!showPuzzleGrid) return null;

    const [rows, cols] = gridSize.split('x').map(Number);
    const gridLines = [];

    // 添加垂直线
    for (let i = 1; i < cols; i++) {
      gridLines.push(
        <div
          key={`v-${i}`}
          className="grid-line vertical"
          style={{ left: `${(i / cols) * 100}%` }}
        />
      );
    }

    // 添加水平线
    for (let i = 1; i < rows; i++) {
      gridLines.push(
        <div
          key={`h-${i}`}
          className="grid-line horizontal"
          style={{ top: `${(i / rows) * 100}%` }}
        />
      );
    }

    return (
      <div className="puzzle-grid-overlay">
        <div className="grid-overlay-inner">
          {gridLines}
        </div>
      </div>
    );
  };

  return (
    <div className="preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal">
        <div className="modal-header">
          <h3>{imageTitle}</h3>
          <Button
            onClick={onClose}
            variant="secondary"
            size="medium"
            className="close-btn"
          >
            ✕
          </Button>
        </div>
        
        <div className="modal-content">
          <div className="landscape-hint">
            📱 建议将设备旋转至横屏以获得更好的预览效果
          </div>
          
          <div className="preview-container">
            <img
              src={imageSrc}
              alt={imageTitle}
              className="preview-image"
            />
            {renderPuzzleGrid()}
          </div>
        </div>
        
        {showPuzzleGrid && (
          <div className="preview-info">
            <p>🧩 拼图网格预览 ({gridSize})</p>
            <p>蓝色线条显示图片将如何被分割成 {gridSize.replace('x', '×')} 共 {gridSize.split('x').reduce((a, b) => parseInt(a) * parseInt(b), 1)} 块拼图</p>
          </div>
        )}
        
        <div className="modal-footer">
          <Button
            onClick={onClose}
            variant="primary"
            size="large"
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
};
