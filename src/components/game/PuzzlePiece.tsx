import React, { useRef, useEffect } from 'react';
import { PuzzlePiece as PuzzlePieceType } from '../../types';
import './PuzzlePiece.css';

interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  isSelected: boolean;
  onSelect: (pieceId: string) => void;
  onMove: (pieceId: string, position: { x: number; y: number }) => void;
  onRotate: (pieceId: string, rotation: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  isSelected,
  onSelect,
  onMove,
  onRotate,
  containerRef,
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const pieceElement = pieceRef.current;
    if (!pieceElement) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      onSelect(piece.id);

      const rect = pieceElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.current.x;
      const newY = e.clientY - containerRect.top - dragOffset.current.y;

      onMove(piece.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = () => {
      const newRotation = (piece.rotation + 90) % 360;
      onRotate(piece.id, newRotation);
    };

    pieceElement.addEventListener('mousedown', handleMouseDown);
    pieceElement.addEventListener('dblclick', handleDoubleClick);

    return () => {
      pieceElement.removeEventListener('mousedown', handleMouseDown);
      pieceElement.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [piece.id, onSelect, onMove, onRotate, containerRef]);

  const transform = `translate(${piece.currentPosition.x}px, ${piece.currentPosition.y}px) rotate(${piece.rotation}deg) scale(${piece.isFlipped ? -1 : 1})`;

  return (
    <div
      ref={pieceRef}
      className={`puzzle-piece ${isSelected ? 'selected' : ''}`}
      style={{
        transform,
        width: `${piece.width}px`,
        height: `${piece.height}px`,
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
    >
      <img
        src={piece.imageData}
        alt={`Puzzle piece ${piece.id}`}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
};