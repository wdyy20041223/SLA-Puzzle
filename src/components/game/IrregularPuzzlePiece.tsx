import React, { useEffect, useRef } from 'react';
import { IrregularPuzzlePiece as IrregularPuzzlePieceType } from '../../utils/puzzleGenerator/irregular';

interface IrregularPuzzlePieceProps {
  piece: IrregularPuzzlePieceType;
  onMove?: (pieceId: string, x: number, y: number) => void;
  onSnapToTarget?: (pieceId: string) => void;
  isSelected?: boolean;
  scale?: number;
}

export const IrregularPuzzlePiece: React.FC<IrregularPuzzlePieceProps> = ({
  piece,
  onMove,
  onSnapToTarget,
  isSelected = false,
  scale = 1
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const interactRef = useRef<any>(null);

  useEffect(() => {
    if (!pieceRef.current || !piece.isDraggable) return;

    // 动态导入 interact.js
    import('interactjs').then((interactModule) => {
      const interact = interactModule.default;
      
      if (interactRef.current) {
        interactRef.current.unset();
      }

      // 设置拖拽和网格吸附
      interactRef.current = interact(pieceRef.current)
        .draggable({
          modifiers: [
            // 网格吸附
            interact.modifiers.snap({
              targets: piece.snapTargets.map(target => ({
                x: target.position.x,
                y: target.position.y,
                range: target.tolerance
              })),
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }]
            }),
            // 限制在游戏区域内
            interact.modifiers.restrict({
              restriction: 'parent',
              elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
              endOnly: true
            })
          ],
          inertia: true,
          autoScroll: true
        })
        .on('dragstart', (event: any) => {
          // 拖拽开始时的视觉反馈
          event.target.style.zIndex = '1000';
          event.target.style.transform += ' scale(1.05)';
        })
        .on('dragmove', (event: any) => {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          // 更新位置
          target.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          // 通知父组件位置变化
          if (onMove) {
            onMove(piece.id, piece.x + x, piece.y + y);
          }
        })
        .on('dragend', (event: any) => {
          // 拖拽结束时恢复样式
          event.target.style.zIndex = '';
          event.target.style.transform = event.target.style.transform.replace(' scale(1.05)', '');
          
          // 检查是否吸附到目标
          const finalX = parseFloat(event.target.getAttribute('data-x')) || 0;
          const finalY = parseFloat(event.target.getAttribute('data-y')) || 0;
          
          // 检查是否在吸附范围内
          const isSnapped = piece.snapTargets.some(target => {
            const deltaX = Math.abs((piece.x + finalX) - target.position.x);
            const deltaY = Math.abs((piece.y + finalY) - target.position.y);
            return deltaX <= target.tolerance && deltaY <= target.tolerance;
          });
          
          if (isSnapped && onSnapToTarget) {
            onSnapToTarget(piece.id);
          }
        });
    });

    return () => {
      if (interactRef.current) {
        interactRef.current.unset();
      }
    };
  }, [piece, onMove, onSnapToTarget, scale]);

  // 计算实际显示样式
  const pieceStyle: React.CSSProperties = {
    position: 'absolute',
    left: piece.x,
    top: piece.y,
    width: piece.expandedSize.width,
    height: piece.expandedSize.height,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    cursor: piece.isDraggable ? 'grab' : 'default',
    zIndex: isSelected ? 100 : (piece.isDraggable ? 10 : 1),
    transition: piece.isDraggable ? 'none' : 'all 0.3s ease',
    filter: isSelected ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 
            piece.isCorrect ? 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.6))' : 'none',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    clipPath: piece.clipPath,
    userSelect: 'none',
    pointerEvents: 'none',
    objectFit: 'cover'
  };

  return (
    <div
      ref={pieceRef}
      style={pieceStyle}
      className={`irregular-puzzle-piece ${piece.isDraggable ? 'draggable' : 'fixed'} ${
        piece.isCorrect ? 'correct' : ''
      } ${isSelected ? 'selected' : ''}`}
      data-piece-id={piece.id}
      data-x="0"
      data-y="0"
    >
      <img
        src={piece.imageData}
        alt={`拼图块 ${piece.id}`}
        style={imageStyle}
        draggable={false}
      />
      
      {/* 调试信息（开发模式显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            fontSize: '10px',
            color: 'red',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '1px 3px',
            borderRadius: '2px',
            pointerEvents: 'none'
          }}
        >
          {piece.id}
        </div>
      )}
    </div>
  );
};
