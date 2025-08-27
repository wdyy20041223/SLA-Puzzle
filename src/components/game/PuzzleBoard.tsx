import React, { useRef } from 'react';
import { PuzzlePiece as PuzzlePieceType } from '../../types';
import { PuzzlePiece } from './PuzzlePiece';
import './PuzzleBoard.css';

interface PuzzleBoardProps {
  pieces: PuzzlePieceType[];
  selectedPieceId: string | null;
  onPieceSelect: (pieceId: string) => void;
  onPieceMove: (pieceId: string, position: { x: number; y: number }) => void;
  onPieceRotate: (pieceId: string, rotation: number) => void;
  backgroundImage?: string;
  boardSize: { width: number; height: number };
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  pieces,
  selectedPieceId,
  onPieceSelect,
  onPieceMove,
  onPieceRotate,
  backgroundImage,
  boardSize,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      className="puzzle-board"
      style={{
        width: `${boardSize.width}px`,
        height: `${boardSize.height}px`,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 网格线（可选） */}
      <div className="puzzle-grid" />
      
      {/* 拼图块 */}
      {pieces.map((piece) => (
        <PuzzlePiece
          key={piece.id}
          piece={piece}
          isSelected={selectedPieceId === piece.id}
          onSelect={onPieceSelect}
          onMove={onPieceMove}
          onRotate={onPieceRotate}
          containerRef={boardRef}
        />
      ))}
    </div>
  );
};