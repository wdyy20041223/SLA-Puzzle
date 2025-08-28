import React from 'react';
import { PuzzlePiece } from '../../types';
import './PuzzlePieceArea.css';

interface PuzzlePieceAreaProps {
  pieces: PuzzlePiece[];
  selectedPieceId: string | null;
  showAnswers: boolean;
  onPieceSelect: (pieceId: string | null) => void;
  onRotatePiece?: (pieceId: string) => void;
  onFlipPiece?: (pieceId: string) => void;
}

export const PuzzlePieceArea: React.FC<PuzzlePieceAreaProps> = ({
  pieces,
  selectedPieceId,
  showAnswers,
  onPieceSelect,
  onRotatePiece,
  onFlipPiece,
}) => {
  const handlePieceClick = (pieceId: string) => {
    onPieceSelect(pieceId);
  };

  const handlePieceDoubleClick = (pieceId: string) => {
    // 双击旋转（预留功能）
    if (onRotatePiece) {
      onRotatePiece(pieceId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, pieceId: string) => {
    e.preventDefault();
    // 右键翻转（预留功能）
    if (onFlipPiece) {
      onFlipPiece(pieceId);
    }
  };

  return (
    <div className="puzzle-piece-area">
      {pieces.length === 0 ? (
        <div className="empty-area">
          <p>🎉 所有拼图块都已放置！</p>
        </div>
      ) : (
        <div className="pieces-grid">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className={`puzzle-piece-item ${
                selectedPieceId === piece.id ? 'selected' : ''
              }`}
              onClick={() => handlePieceClick(piece.id)}
              onDoubleClick={() => handlePieceDoubleClick(piece.id)}
              onContextMenu={(e) => handleContextMenu(e, piece.id)}
              style={{
                transform: `rotate(${piece.rotation}deg) ${
                  piece.isFlipped ? 'scaleX(-1)' : ''
                }`,
              }}
            >
              {showAnswers && (
                <div className="piece-number">{piece.originalIndex + 1}</div>
              )}
              <img
                src={piece.imageData}
                alt={`拼图块 ${piece.originalIndex + 1}`}
                className="piece-image"
                draggable={false}
              />
              {selectedPieceId === piece.id && (
                <div className="selection-indicator">
                  <span>已选择</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {pieces.length > 0 && (
        <div className="area-tips">
          <p>💡 点击选择拼图块，然后点击答题卡中的目标位置</p>
          <p>🔄 双击可旋转（预留功能）</p>
          <p>🔁 右键可翻转（预留功能）</p>
        </div>
      )}
    </div>
  );
};
