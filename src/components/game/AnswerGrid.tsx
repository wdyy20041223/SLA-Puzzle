import React from 'react';
import { PuzzlePiece } from '../../types';
import './AnswerGrid.css';

interface AnswerGridProps {
  gridSize: { rows: number; cols: number };
  answerGrid: (PuzzlePiece | null)[];
  originalImage: string;
  selectedPieceId: string | null;
  onPlacePiece: (pieceId: string, slotIndex: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onPieceSelect: (pieceId: string) => void;
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({
  gridSize,
  answerGrid,
  originalImage,
  selectedPieceId,
  onPlacePiece,
  onRemovePiece,
  onPieceSelect,
}) => {
  const handleSlotClick = (slotIndex: number) => {
    const existingPiece = answerGrid[slotIndex];
    
    if (existingPiece) {
      // 如果槽位有拼图块，选择或移除它
      if (selectedPieceId === existingPiece.id) {
        // 如果点击的是已选择的拼图块，将其移回处理区
        onRemovePiece(existingPiece.id);
      } else {
        // 否则选择这个拼图块
        onPieceSelect(existingPiece.id);
      }
    } else if (selectedPieceId) {
      // 如果槽位为空且有选中的拼图块，放置拼图块
      onPlacePiece(selectedPieceId, slotIndex);
    }
  };

  const getSlotNumber = (index: number): number => {
    return index + 1;
  };

  return (
    <div className="answer-grid-container">
      {/* 背景参考图 */}
      <div 
        className="background-image"
        style={{
          backgroundImage: `url(${originalImage})`,
          gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
        }}
      />
      
      {/* 网格槽位 */}
      <div 
        className="answer-grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
        }}
      >
        {answerGrid.map((piece, index) => (
          <div
            key={index}
            className={`grid-slot ${piece ? 'occupied' : 'empty'} ${
              selectedPieceId && !piece ? 'highlight' : ''
            } ${
              piece && selectedPieceId === piece.id ? 'selected' : ''
            }`}
            onClick={() => handleSlotClick(index)}
          >
            {/* 槽位编号 */}
            <div className="slot-number">{getSlotNumber(index)}</div>
            
            {/* 拼图块 */}
            {piece && (
              <div 
                className="placed-piece"
                style={{
                  transform: `rotate(${piece.rotation}deg) ${
                    piece.isFlipped ? 'scaleX(-1)' : ''
                  }`,
                }}
              >
                <img
                  src={piece.imageData}
                  alt={`拼图块 ${piece.originalIndex + 1}`}
                  className="piece-image"
                  draggable={false}
                />
                <div className="piece-info">
                  {piece.originalIndex + 1}
                </div>
                
                {/* 正确性指示器 */}
                <div className={`correctness-indicator ${
                  piece.correctSlot === index ? 'correct' : 'incorrect'
                }`}>
                  {piece.correctSlot === index ? '✓' : '✗'}
                </div>
              </div>
            )}
            
            {/* 空槽位提示 */}
            {!piece && selectedPieceId && (
              <div className="drop-hint">
                点击放置
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 网格信息 */}
      <div className="grid-info">
        <div className="completion-status">
          已完成: {answerGrid.filter(slot => slot !== null).length} / {answerGrid.length}
        </div>
        <div className="correctness-status">
          正确: {answerGrid.filter((piece, index) => 
            piece && piece.correctSlot === index && piece.rotation === 0 && !piece.isFlipped
          ).length} / {answerGrid.length}
        </div>
      </div>
    </div>
  );
};
