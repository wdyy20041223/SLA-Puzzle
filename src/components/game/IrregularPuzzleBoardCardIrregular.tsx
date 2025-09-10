import React from 'react';
import './IrregularPuzzleBoardCard.css';

interface IrregularPuzzleBoardCardProps {
  pieces: Array<{
    id: string;
    image: string;
    style: React.CSSProperties;
  }>;
  onPieceDrop?: (pieceId: string, position: number) => void;
}

// 让每个小块的图片显示范围扩大30%，但布局不变，允许重叠
const IrregularPuzzleBoardCard: React.FC<IrregularPuzzleBoardCardProps> = ({ pieces, onPieceDrop }) => {
  return (
    <div className="irregular-puzzle-board-card">
      {pieces.map((piece, idx) => (
        <div
          key={piece.id}
          className="irregular-puzzle-piece-slot"
          style={piece.style}
        >
          <div
            className="irregular-puzzle-piece-image"
            style={{
              backgroundImage: `url(${piece.image})`,
              backgroundSize: '130% 130%', // 扩大30%
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default IrregularPuzzleBoardCard;
