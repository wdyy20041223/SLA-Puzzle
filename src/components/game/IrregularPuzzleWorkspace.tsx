import React, { useState, useCallback, useEffect } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzlePiece as PieceType } from '../../utils/puzzleGenerator/irregular';


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
  scale: _scale = 1,
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

  // 计算网格参数（提前计算避免在useEffect中使用）
  const gridSize = config.gridLayout.baseSize.width / 5;

  // 初始化interactjs拖拽
  useEffect(() => {
    // 动态导入interactjs
    import('interactjs').then((interactModule) => {
      const interact = interactModule.default;
      
      // 清理之前的interactjs实例
      interact('.puzzle-piece').unset();
      
      // 设置拖拽
      interact('.puzzle-piece')
        .draggable({
          modifiers: [
            interact.modifiers.snap({
              targets: [
                interact.snappers.grid({ x: gridSize, y: gridSize })
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }]
            }),
            interact.modifiers.restrict({
              restriction: '#puzzle-board',
              elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
              endOnly: true
            })
          ],
          inertia: true
        })
        .on('dragstart', function (event: any) {
          event.target.style.zIndex = '1000';
          event.target.style.cursor = 'grabbing';
        })
        .on('dragmove', function (event: any) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          // 通知父组件位置变化
          const pieceId = target.getAttribute('data-piece-id');
          if (pieceId && onPieceMove) {
            const piece = pieces.find(p => p.id === pieceId);
            if (piece) {
              onPieceMove(pieceId, piece.x + x, piece.y + y);
            }
          }
        })
        .on('dragend', function (event: any) {
          event.target.style.zIndex = '';
          event.target.style.cursor = 'grab';
          
          // 检查是否吸附到正确位置
          const pieceId = event.target.getAttribute('data-piece-id');
          const piece = pieces.find(p => p.id === pieceId);
          if (piece && handleSnapToTarget) {
            const finalX = parseFloat(event.target.getAttribute('data-x')) || 0;
            const finalY = parseFloat(event.target.getAttribute('data-y')) || 0;
            
            const targetX = 50 + piece.expandedPosition.x;
            const targetY = 50 + piece.expandedPosition.y;
            const currentX = piece.x + finalX;
            const currentY = piece.y + finalY;
            
            const deltaX = Math.abs(currentX - targetX);
            const deltaY = Math.abs(currentY - targetY);
            const tolerance = gridSize * 2;
            
            if (deltaX <= tolerance && deltaY <= tolerance) {
              handleSnapToTarget(pieceId);
            }
          }
        });
    });
    
    // 清理函数
    return () => {
      import('interactjs').then((interactModule) => {
        const interact = interactModule.default;
        interact('.puzzle-piece').unset();
      });
    };
  }, [gridSize, pieces, onPieceMove, handleSnapToTarget]);

  // 处理拼图块选择
  const handlePieceClick = useCallback((pieceId: string) => {
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece?.isDraggable) return;
    
    const isInWaiting = piece.isDraggable && !piece.isCorrect;
    
    if (isInWaiting) {
      // 在待拼接区域：选中/取消选中
      setSelectedPieceId(selectedPieceId === pieceId ? null : pieceId);
    } else {
      // 在拼接板上：选中/取消选中
      setSelectedPieceId(selectedPieceId === pieceId ? null : pieceId);
    }
  }, [selectedPieceId, pieces]);

  // 处理拼接板点击：将选中的拼图块移动到点击位置
  const handleBoardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedPieceId) return;
    
    const selectedPiece = pieces.find(p => p.id === selectedPieceId);
    if (!selectedPiece || !selectedPiece.isDraggable) return;
    
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // 吸附到最近网格
    const gridSize = config.gridLayout.baseSize.width / 5;
    const snapX = Math.round(clickX / gridSize) * gridSize;
    const snapY = Math.round(clickY / gridSize) * gridSize;
    
    // 移动拼图块到拼接板
    handlePieceMove(selectedPieceId, snapX, snapY);
    
    // 检查是否需要标记为正确（坐标相对于拼接板容器）
    const targetX = 50 + selectedPiece.expandedPosition.x;
    const targetY = 50 + selectedPiece.expandedPosition.y;
    const deltaX = Math.abs(snapX - targetX);
    const deltaY = Math.abs(snapY - targetY);
    const tolerance = gridSize * 2;
    
    if (deltaX <= tolerance && deltaY <= tolerance) {
      handleSnapToTarget(selectedPieceId);
    }
    
    // 取消选中
    setSelectedPieceId(null);
  }, [selectedPieceId, pieces, config, handlePieceMove, handleSnapToTarget]);

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
    display: 'flex',
    gap: '10px',
    padding: '10px'
  };

  // 左侧待拼接区域
  const waitingAreaStyle: React.CSSProperties = {
    width: '350px',
    height: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '10px',
    overflow: 'auto'
  };

  // 右侧拼接板区域
  const puzzleBoardStyle: React.CSSProperties = {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden'
  };

  const boardWidth = config.gridSize.cols * config.gridLayout.baseSize.width;
  const boardHeight = config.gridSize.rows * config.gridLayout.baseSize.height;
  
  // 网格参数已在前面计算

  return (
    <div style={workspaceStyle}>
      {/* 左侧：待拼接区域 */}
      <div style={waitingAreaStyle}>
        <div className="text-sm text-gray-600 mb-4 font-medium">
          待拼接块 ({pieces.filter(p => p.isDraggable && !p.isCorrect).length})
        </div>
        <div className="grid grid-cols-2 gap-3">
          {pieces.filter(piece => piece.isDraggable && !piece.isCorrect).map((piece, _index) => (
            <div 
              key={`waiting-${piece.id}`} 
              onClick={(e) => {
                e.stopPropagation();
                handlePieceClick(piece.id);
              }}
              className={`
                relative cursor-pointer rounded-lg transition-all duration-200 p-2
                ${selectedPieceId === piece.id 
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-lg scale-105' 
                  : 'bg-gray-50 border-2 border-transparent hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              <div className="relative aspect-square">
                <img
                  src={piece.imageData}
                  alt={`拼图块 ${piece.id}`}
                  className="w-full h-full object-cover rounded"
                  style={{
                    clipPath: piece.clipPath,
                  }}
                  draggable={false}
                />
                
                {/* 选中指示器 */}
                {selectedPieceId === piece.id && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* 拼图块编号 */}
              <div className="text-xs text-gray-500 text-center mt-1">
                块 {piece.id}
              </div>
            </div>
          ))}
        </div>
        
        {/* 操作提示 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-1">操作说明：</div>
            <div>1. 点击选中待拼块</div>
            <div>2. 在右侧拼接板点击放置</div>
            <div>3. 拖拽调整位置</div>
          </div>
        </div>
      </div>

      {/* 右侧：拼接板区域 */}
      <div 
        style={puzzleBoardStyle}
        onClick={handleBoardClick}
        id="puzzle-board"
      >
        {/* 拼图板背景网格 - 覆盖整个区域 */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* 细网格线（用于interactjs吸附） - 覆盖整个拼接板 */}
          {Array.from({ length: Math.floor((puzzleBoardStyle.flex ? 800 : 700) / gridSize) + 1 }, (_, i) => (
            <line
              key={`grid-v-${i}`}
              x1={i * gridSize}
              y1={0}
              x2={i * gridSize}
              y2="100%"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.3}
            />
          ))}
          {Array.from({ length: Math.floor(600 / gridSize) + 1 }, (_, i) => (
            <line
              key={`grid-h-${i}`}
              x1={0}
              y1={i * gridSize}
              x2="100%"
              y2={i * gridSize}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.3}
            />
          ))}
        </svg>
        
        {/* 目标拼图区域标识 */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 50,
            width: boardWidth,
            height: boardHeight,
            border: '3px dashed #6b7280',
            borderRadius: '8px',
            backgroundColor: 'rgba(107, 114, 128, 0.05)',
            zIndex: 2
          }}
        >
          {/* 拼图块边界线 */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {/* 主要网格线（拼图块边界） */}
            {Array.from({ length: config.gridSize.cols + 1 }, (_, i) => (
              <line
                key={`main-v-${i}`}
                x1={i * config.gridLayout.baseSize.width}
                y1={0}
                x2={i * config.gridLayout.baseSize.width}
                y2={boardHeight}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="8,4"
              />
            ))}
            {Array.from({ length: config.gridSize.rows + 1 }, (_, i) => (
              <line
                key={`main-h-${i}`}
                x1={0}
                y1={i * config.gridLayout.baseSize.height}
                x2={boardWidth}
                y2={i * config.gridLayout.baseSize.height}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="8,4"
              />
            ))}
          </svg>
        </div>
        
        {/* 固定块位置标识 */}
        {pieces.filter(piece => !piece.isDraggable).map(piece => (
          <React.Fragment key={`fixed-indicator-${piece.id}`}>
            <div
              style={{
                position: 'absolute',
                left: 50 + piece.basePosition.x - 3,
                top: 50 + piece.basePosition.y - 3,
                width: config.gridLayout.baseSize.width + 6,
                height: config.gridLayout.baseSize.height + 6,
                border: '4px solid #10b981',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                pointerEvents: 'none',
                zIndex: 3
              }}
            />
            
            {/* 固定块标签 */}
            <div
              style={{
                position: 'absolute',
                left: 50 + piece.basePosition.x,
                top: 50 + piece.basePosition.y - 25,
                padding: '2px 8px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '12px',
                zIndex: 4
              }}
            >
              固定块
            </div>
          </React.Fragment>
        ))}

        {/* 拼接板标题 */}
        <div 
          style={{
            position: 'absolute',
            top: 5,
            left: 20,
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: 'medium'
          }}
        >
          拼接板 ({config.gridSize.rows}×{config.gridSize.cols})
        </div>

        {/* 固定块（直接DOM显示，不参与拖拽） */}
        {pieces.filter(piece => !piece.isDraggable).map(piece => (
          <div
            key={`fixed-${piece.id}`}
            style={{
              position: 'absolute',
              left: piece.x,
              top: piece.y,
              width: piece.expandedSize.width,
              height: piece.expandedSize.height,
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            <img
              src={piece.imageData}
              alt={`固定块 ${piece.id}`}
              style={{
                width: '100%',
                height: '100%',
                clipPath: piece.clipPath,
                userSelect: 'none',
                objectFit: 'cover'
              }}
              draggable={false}
            />
          </div>
        ))}

        {/* 可拖拽的拼图块（使用interactjs） */}
        {pieces.filter(piece => piece.isDraggable && piece.isCorrect).map(piece => {
          return (
            <div 
              key={`draggable-${piece.id}`} 
              className="puzzle-piece"
              style={{
                position: 'absolute',
                left: piece.x,
                top: piece.y,
                width: piece.expandedSize.width,
                height: piece.expandedSize.height,
                zIndex: selectedPieceId === piece.id ? 100 : 10,
                cursor: 'grab',
                transform: 'translate(0px, 0px)', // 初始transform
                filter: selectedPieceId === piece.id ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 'none'
              }}
              data-piece-id={piece.id}
              data-x="0"
              data-y="0"
              onClick={(e) => {
                e.stopPropagation();
                handlePieceClick(piece.id);
              }}
            >
              <img
                src={piece.imageData}
                alt={`拼图块 ${piece.id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  clipPath: piece.clipPath,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  objectFit: 'cover'
                }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>



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
