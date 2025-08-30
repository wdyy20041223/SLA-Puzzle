import React, { useState, useCallback, useEffect } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzlePiece as PieceType } from '../../utils/puzzleGenerator/irregular';
import { IrregularPuzzlePiece } from './IrregularPuzzlePiece';

interface IrregularPuzzleWorkspaceProps {
  config: IrregularPuzzleConfig;
  onPieceMove?: (pieceId: string, x: number, y: number) => void;
  onPuzzleComplete?: () => void;
  onProgressChange?: (progress: { correct: number; total: number; percentage: number }) => void;
  scale?: number;
  showDebugInfo?: boolean;
}

export const IrregularPuzzleWorkspace: React.FC<IrregularPuzzleWorkspaceProps> = ({
  config,
  onPieceMove,
  onPuzzleComplete,
  onProgressChange,
  scale = 1,
  showDebugInfo = false
}) => {
  const [pieces, setPieces] = useState<PieceType[]>(config.pieces);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState({
    isComplete: false,
    correctPieces: 0,
    totalPieces: config.pieces.length,
    completionRate: 0
  });

  // 更新拼图块位置
  const handlePieceMove = useCallback((pieceId: string, x: number, y: number) => {
    setPieces(prevPieces => {
      const newPieces = prevPieces.map(piece => 
        piece.id === pieceId ? { ...piece, x, y } : piece
      );
      
      // 通知外部组件
      if (onPieceMove) {
        onPieceMove(pieceId, x, y);
      }
      
      return newPieces;
    });
  }, [onPieceMove]);

  // 处理拼图块吸附到目标位置
  const handleSnapToTarget = useCallback((pieceId: string) => {
    setPieces(prevPieces => {
      const newPieces = prevPieces.map(piece => {
        if (piece.id !== pieceId) return piece;
        
        // 检查是否吸附到正确位置
        const targetX = piece.basePosition.x;
        const targetY = piece.basePosition.y;
        const tolerance = 20;
        
        const deltaX = Math.abs(piece.x - targetX);
        const deltaY = Math.abs(piece.y - targetY);
        
        if (deltaX <= tolerance && deltaY <= tolerance) {
          // 吸附到正确位置
          return {
            ...piece,
            x: targetX,
            y: targetY,
            isCorrect: true
          };
        }
        
        return piece;
      });
      
      return newPieces;
    });
  }, []);

  // 检查拼图完成状态
  useEffect(() => {
    const correctPieces = pieces.filter(piece => piece.isCorrect).length;
    const totalPieces = pieces.length;
    const completionRate = Math.round((correctPieces / totalPieces) * 100);
    const isComplete = correctPieces === totalPieces;
    
    const newStatus = {
      isComplete,
      correctPieces,
      totalPieces,
      completionRate
    };
    
    setCompletionStatus(newStatus);
    
    // 通知进度变化
    if (onProgressChange) {
      onProgressChange({
        correct: correctPieces,
        total: totalPieces,
        percentage: completionRate
      });
    }
    
    // 检查是否完成
    if (isComplete && !completionStatus.isComplete && onPuzzleComplete) {
      onPuzzleComplete();
    }
  }, [pieces, onProgressChange, onPuzzleComplete, completionStatus.isComplete]);

  // 处理拼图块选择
  const handlePieceClick = useCallback((pieceId: string) => {
    if (pieces.find(p => p.id === pieceId)?.isDraggable) {
      setSelectedPieceId(selectedPieceId === pieceId ? null : pieceId);
    }
  }, [selectedPieceId, pieces]);

  // 重置拼图
  const resetPuzzle = useCallback(() => {
    setPieces(config.pieces.map(piece => ({ ...piece })));
    setSelectedPieceId(null);
  }, [config.pieces]);

  // 获取提示（显示一个正确位置）
  const getHint = useCallback(() => {
    const incorrectPieces = pieces.filter(piece => !piece.isCorrect && piece.isDraggable);
    if (incorrectPieces.length === 0) return;
    
    const randomPiece = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)];
    
    setPieces(prevPieces => 
      prevPieces.map(piece => 
        piece.id === randomPiece.id 
          ? {
              ...piece,
              x: piece.basePosition.x,
              y: piece.basePosition.y,
              isCorrect: true
            }
          : piece
      )
    );
  }, [pieces]);

  const workspaceStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const gameAreaStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #e2e8f0',
    borderRadius: '4px'
  };

  const pieceAreaStyle: React.CSSProperties = {
    position: 'absolute',
    left: 820,
    top: 0,
    width: 300,
    height: 600,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '10px'
  };

  return (
    <div style={workspaceStyle} onClick={() => setSelectedPieceId(null)}>
      {/* 主拼图区域 */}
      <div style={gameAreaStyle}>
        {/* 网格参考线（可选） */}
        {showDebugInfo && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: 0.3
            }}
          >
            {/* 绘制网格线 */}
            {Array.from({ length: config.gridSize.cols + 1 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * config.gridLayout.baseSize.width}
                y1={0}
                x2={i * config.gridLayout.baseSize.width}
                y2={600}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: config.gridSize.rows + 1 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * config.gridLayout.baseSize.height}
                x2={800}
                y2={i * config.gridLayout.baseSize.height}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            ))}
          </svg>
        )}
        
        {/* 固定块区域标识 */}
        <div
          style={{
            position: 'absolute',
            left: config.gridLayout.fixedPosition.x - 5,
            top: config.gridLayout.fixedPosition.y - 5,
            width: config.gridLayout.baseSize.width + 10,
            height: config.gridLayout.baseSize.height + 10,
            border: '2px dashed #10b981',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* 拼图块区域 */}
      <div style={pieceAreaStyle}>
        <div className="text-sm text-gray-600 mb-2">
          待拼接块: {pieces.filter(p => p.isDraggable && !p.isCorrect).length}
        </div>
      </div>

      {/* 渲染所有拼图块 */}
      {pieces.map(piece => (
        <div key={piece.id} onClick={(e) => {
          e.stopPropagation();
          handlePieceClick(piece.id);
        }}>
          <IrregularPuzzlePiece
            piece={piece}
            onMove={handlePieceMove}
            onSnapToTarget={handleSnapToTarget}
            isSelected={selectedPieceId === piece.id}
            scale={scale}
          />
        </div>
      ))}

      {/* 游戏控制面板 */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          display: 'flex',
          gap: '8px',
          zIndex: 200
        }}
      >
        <button
          onClick={getHint}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          disabled={completionStatus.isComplete}
        >
          提示
        </button>
        <button
          onClick={resetPuzzle}
          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
        >
          重置
        </button>
      </div>

      {/* 完成庆祝效果 */}
      {completionStatus.isComplete && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(34, 197, 94, 0.95)',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '12px',
            textAlign: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.5s ease'
          }}
        >
          <div className="text-2xl font-bold mb-2">🎉 恭喜完成！</div>
          <div className="text-lg">异形拼图已成功拼接</div>
        </div>
      )}

      {/* 调试信息 */}
      {showDebugInfo && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 200
          }}
        >
          <div>总块数: {completionStatus.totalPieces}</div>
          <div>正确: {completionStatus.correctPieces}</div>
          <div>进度: {completionStatus.completionRate}%</div>
          <div>选中: {selectedPieceId || '无'}</div>
        </div>
      )}
    </div>
  );
};
