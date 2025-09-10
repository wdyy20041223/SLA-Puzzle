// 动态变换拼图块的up/down/left/right/rotation/flipX/flipY属性
function transformPieceProps(piece: any, transform: { rotation?: number; flipX?: boolean; flipY?: boolean }) {
  let { up, down, left, right } = piece;
  let dirs = [up, right, down, left];
  let rot = ((transform.rotation ?? 0) % 360 + 360) % 360;
  let times = Math.round(rot / 90) % 4;
  for (let i = 0; i < times; i++) {
    dirs = [dirs[3], dirs[0], dirs[1], dirs[2]];
  }
  if (transform.flipX) {
    [dirs[1], dirs[3]] = [dirs[3], dirs[1]];
    dirs[1] = dirs[1] === 0 ? 0 : -dirs[1];
    dirs[3] = dirs[3] === 0 ? 0 : -dirs[3];
    dirs[0] = dirs[0] === 0 ? 0 : -dirs[0];
    dirs[2] = dirs[2] === 0 ? 0 : -dirs[2];
  }
  if (transform.flipY) {
    [dirs[0], dirs[2]] = [dirs[2], dirs[0]];
    dirs[0] = dirs[0] === 0 ? 0 : -dirs[0];
    dirs[2] = dirs[2] === 0 ? 0 : -dirs[2];
    dirs[1] = dirs[1] === 0 ? 0 : -dirs[1];
    dirs[3] = dirs[3] === 0 ? 0 : -dirs[3];
  }
  return {
    ...piece,
    up: dirs[0],
    right: dirs[1],
    down: dirs[2],
    left: dirs[3],
    rotation: transform.rotation ?? 0,
    flipX: !!transform.flipX,
    flipY: !!transform.flipY,
  };
}
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { IrregularPuzzlePiece } from '../../utils/puzzleGenerator/irregular';
// 扩展类型，允许答题卡拼图块带有旋转/翻转属性
type IrregularPuzzlePieceWithTransform = IrregularPuzzlePiece & {
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
};
import './AnswerGrid.css';

interface IrregularAnswerGridIrregularProps {
  gridSize: { rows: number; cols: number };
  answerGrid: (IrregularPuzzlePieceWithTransform | null)[];
  originalImage: string;
  selectedPieceId: string | null;
  showAnswers: boolean;
  onPlacePiece: (pieceId: string, slotIndex: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onPieceSelect: (pieceId: string | null) => void;
  draggedPiece?: string | null;
  dragOverSlot?: number | null;
  onDragStart?: (pieceId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (slotIndex: number) => void;
  onDragLeave?: () => void;
  onDropToSlot?: (targetSlot: number) => void;
}

// 让每个小块的图片显示范围扩大30%，但布局不变，允许重叠
export const IrregularAnswerGridIrregular: React.FC<IrregularAnswerGridIrregularProps & { pieceTransforms?: Record<string, { rotation: number; flipX: boolean; flipY: boolean }> }> = (props) => {
  const {
    gridSize,
    answerGrid,
    originalImage: _originalImage,
    selectedPieceId,
    showAnswers,
    onPlacePiece,
    onRemovePiece,
    onPieceSelect,
    draggedPiece,
    dragOverSlot,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDropToSlot,
    pieceTransforms = {},
  } = props;

  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(80);

  // 计算合适的单元格大小
  const calculateCellSize = useCallback(() => {
    if (!gridRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const gridInfoElement = containerRef.current.querySelector('.grid-info');
    const gridInfoHeight = gridInfoElement?.clientHeight || 60;
    const horizontalPadding = 40;
    const verticalPadding = 40;
    const availableWidth = containerWidth - horizontalPadding;
    const availableHeight = containerHeight - verticalPadding - gridInfoHeight;
    const maxCellWidth = Math.floor(availableWidth / gridSize.cols);
    const maxCellHeight = Math.floor(availableHeight / gridSize.rows);
    const newSize = Math.min(maxCellWidth, maxCellHeight, 160);
    const finalSize = Math.max(120, newSize);
    setCellSize(finalSize);
  }, [gridSize.cols, gridSize.rows]);

  useEffect(() => {
    calculateCellSize();
    const handleResize = () => calculateCellSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCellSize]);
  useEffect(() => { calculateCellSize(); }, [gridSize, calculateCellSize]);

  const handleSlotClick = (slotIndex: number) => {
    const existingPiece = answerGrid[slotIndex];
    if (existingPiece) {
      if (selectedPieceId === existingPiece.id) {
        onPieceSelect(null);
        onRemovePiece(existingPiece.id);
      } else if (selectedPieceId && selectedPieceId !== existingPiece.id) {
        onPlacePiece(selectedPieceId, slotIndex);
      } else {
        onRemovePiece(existingPiece.id);
      }
    } else if (selectedPieceId) {
      onPlacePiece(selectedPieceId, slotIndex);
    }
  };

  // 拖拽事件处理函数
  const handlePieceDragStart = (e: React.DragEvent, pieceId: string) => {
    e.dataTransfer.setData('text/plain', pieceId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(pieceId);
  };
  const handlePieceDragEnd = () => { if (onDragEnd) onDragEnd(); };
  const handleSlotDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(slotIndex);
  };
  const handleSlotDragLeave = () => { if (onDragLeave) onDragLeave(); };
  const handleSlotDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (onDropToSlot) onDropToSlot(slotIndex);
  };

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize}px)`,
  };

  // 让图片显示范围扩大30%，允许重叠
  const imageStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    left: 0,
    top: 0,
    objectFit: 'cover' as const,
    pointerEvents: 'none' as const,
    transform: 'scale(1.3)',
    transformOrigin: '50% 50%',
  };

  // clipPath 同步缩放和平移
  function scaleAndTranslateClipPath(clipPath: string) {
    // 只处理 polygon 百分比格式
    if (!clipPath.startsWith('polygon(')) return clipPath;
    const percent = (v: number) => Math.round(v * 1000) / 10 + '%';
    // 以中心(50,50)为基准缩放1.3倍
    const scale = 1.3;
    const cx = 50, cy = 50;
    return clipPath.replace(/polygon\((.*)\)/, (_match, points: string) => {
      const newPoints = points.split(',').map((pt: string) => {
        const match = pt.trim().match(/^([\d.]+)%\s+([\d.]+)%$/);
        if (!match) return pt;
        let [x, y] = [parseFloat(match[1]), parseFloat(match[2])];
        // 以中心缩放
        x = (x - cx) * scale + cx;
        y = (y - cy) * scale + cy;
        return `${percent(x)} ${percent(y)}`;
      });
      return `polygon(${newPoints.join(', ')})`;
    });
  }

  return (
    <div className="answer-grid-container" ref={containerRef}>
      <div ref={gridRef} className="answer-grid" style={{...gridStyle, position: 'relative'}}>
        {/* 拼图块图片单独渲染一层，绝对定位，保证溢出不被遮挡 */}
        {answerGrid.map((piece, index) => {
          if (!piece) return null;
          // 计算拼图块在网格中的位置
          const row = Math.floor(index / gridSize.cols);
          const col = index % gridSize.cols;
          // 用pieceTransforms动态变换属性
          const t = pieceTransforms[piece.id] || {};
          const transformed = transformPieceProps(piece, t);
          const rot = transformed.rotation;
          const scaleX = transformed.flipX ? -1 : 1;
          const scaleY = transformed.flipY ? -1 : 1;
          const transform = `scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rot}deg) scale(1.3)`;
          return (
            <div
              key={`piece-img-${index}-${piece.id}`}
              className="placed-piece"
              draggable={true}
              onDragStart={(e) => handlePieceDragStart(e, piece.id)}
              onDragEnd={handlePieceDragEnd}
              style={{
                position: 'absolute',
                left: `${col * cellSize}px`,
                top: `${row * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                zIndex: 2,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
              }}
            >
              <img
                src={piece.imageData}
                alt={`拼图块 ${piece.id}`}
                className="piece-image"
                style={{ ...imageStyle, clipPath: scaleAndTranslateClipPath(piece.clipPath), transform }}
                draggable={false}
              />
            </div>
          );
        })}
        {/* 网格槽位，z-index:1，保证拼图块图片在上层 */}
        {answerGrid.map((piece, index) => (
          <div
            key={`slot-${index}-${piece?.id || 'empty'}`}
            className={`grid-slot ${piece ? 'occupied' : 'empty'} ${selectedPieceId && !piece ? 'highlight' : ''} ${piece && selectedPieceId === piece.id ? 'selected' : ''} ${dragOverSlot === index ? 'drag-over' : ''} ${draggedPiece === piece?.id ? 'dragging' : ''}`}
            onClick={() => handleSlotClick(index)}
            onDragOver={(e) => handleSlotDragOver(e, index)}
            onDragLeave={handleSlotDragLeave}
            onDrop={(e) => handleSlotDrop(e, index)}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              position: 'absolute',
              left: `${(index % gridSize.cols) * cellSize}px`,
              top: `${Math.floor(index / gridSize.cols) * cellSize}px`,
              zIndex: 1,
              overflow: 'visible',
            }}
          >
            {/* 空槽位提示 */}
            {!piece && selectedPieceId && (
              <div className="drop-hint">点击放置</div>
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
          正确: {answerGrid.filter((piece, idx) => piece && (piece.gridRow * gridSize.cols + piece.gridCol) === idx).length} / {answerGrid.length}
        </div>
      </div>
    </div>
  );
};

export default IrregularAnswerGridIrregular;
