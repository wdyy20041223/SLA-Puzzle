import { useState, useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { 
  PuzzlePiece, 
  GameState, 
  GameMove, 
  PuzzleConfig, 
  DifficultyLevel,
  PieceShape 
} from '../types';

interface UsePuzzleGameProps {
  initialConfig?: PuzzleConfig;
}

export function usePuzzleGame({ initialConfig }: UsePuzzleGameProps = {}) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏
  const initializeGame = useCallback((config: PuzzleConfig) => {
    const totalSlots = config.gridSize.rows * config.gridSize.cols;
    
    // 初始化答题卡网格（所有槽位都是空的）
    const answerGrid: (PuzzlePiece | null)[] = new Array(totalSlots).fill(null);
    
    // 重置所有拼图块到处理区
    const resetPieces = config.pieces.map(piece => ({
      ...piece,
      currentSlot: null, // 所有拼图块都在处理区
    }));
    
    const newGameState: GameState = {
      config: { ...config, pieces: resetPieces },
      startTime: new Date(),
      moves: 0,
      isCompleted: false,
      elapsedTime: 0,
      history: [],
      answerGrid,
    };

    setGameState(newGameState);
    setIsGameStarted(true);
    setTimer(0);
    
    // 启动计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, []);

  // 将拼图块放置到槽位
  const placePieceToSlot = useCallback((pieceId: string, targetSlot: number) => {

    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);
      if (!piece) return prev;

      // 检查目标槽位是否已有拼图块
      const existingPiece = prev.answerGrid[targetSlot];
      
      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];
      
      // 如果拼图块之前在其他槽位，清空原槽位
      if (piece.currentSlot !== null) {
        newAnswerGrid[piece.currentSlot] = null;
      }
      
      // 更新拼图块列表：处理现有拼图块和新拼图块
      const updatedPieces = prev.config.pieces.map(p => {
        if (existingPiece && p.id === existingPiece.id) {
          // 如果目标槽位有拼图块，将其移回处理区
          return { ...p, currentSlot: null };
        } else if (p.id === pieceId) {
          // 更新当前拼图块的槽位
          return { ...p, currentSlot: targetSlot };
        }
        return p;
      });
      
      // 将更新后的拼图块放入目标槽位
      const updatedPiece = updatedPieces.find(p => p.id === pieceId);
      newAnswerGrid[targetSlot] = updatedPiece || null;

      // 确定操作类型
      const actionType = existingPiece ? 'replace' : 'place';
      
      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: actionType,
        fromSlot: piece.currentSlot,
        toSlot: targetSlot,
        replacedPieceId: existingPiece?.id,
        timestamp: new Date(),
      };

      const newGameState: GameState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        answerGrid: newAnswerGrid,
      };

      // 检查是否完成拼图
      if (checkPuzzleComplete(newAnswerGrid)) {
        newGameState.isCompleted = true;
        newGameState.endTime = new Date();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }

      return newGameState;
    });
  }, []);

  // 将拼图块从槽位移回处理区
  const removePieceFromSlot = useCallback((pieceId: string) => {
    console.log('=== removePieceFromSlot 开始 ===');
    console.log('要移除的拼图块ID:', pieceId);

    flushSync(() => {
      setGameState(prev => {
        if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);
      console.log('找到的拼图块:', piece);
      
      if (!piece || piece.currentSlot === null) {
        console.log('拼图块不存在或currentSlot为null，返回原状态');
        return prev;
      }

      console.log('拼图块当前槽位:', piece.currentSlot);
      console.log('移除前的answerGrid:', prev.answerGrid.map((p, i) => ({ slot: i, pieceId: p?.id })));

      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];
      newAnswerGrid[piece.currentSlot] = null;
      
      console.log('移除后的newAnswerGrid:', newAnswerGrid.map((p, i) => ({ slot: i, pieceId: p?.id })));
      
      // 更新拼图块列表
      const updatedPieces = prev.config.pieces.map(p =>
        p.id === pieceId ? { ...p, currentSlot: null } : p
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'remove',
        fromSlot: piece.currentSlot,
        toSlot: null,
        timestamp: new Date(),
      };

      const newState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        answerGrid: newAnswerGrid,
      };
      
      console.log('返回的新状态answerGrid:', newState.answerGrid.map((p, i) => ({ slot: i, pieceId: p?.id })));
      console.log('=== removePieceFromSlot 结束 ===');
      
        return newState;
      });
    });
    
    // 如果移除的是当前选中的拼图块，取消选择
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    }
  }, []);

  // 旋转拼图块
  const rotatePiece = useCallback((pieceId: string, rotation: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedPieces = prev.config.pieces.map(piece =>
        piece.id === pieceId ? { ...piece, rotation } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'rotate',
        timestamp: new Date(),
      };

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
      };
    });
  }, [gameState]);

  // 翻转拼图块
  const flipPiece = useCallback((pieceId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedPieces = prev.config.pieces.map(piece =>
        piece.id === pieceId ? { ...piece, isFlipped: !piece.isFlipped } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'flip',
        timestamp: new Date(),
      };

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
      };
    });
  }, [gameState]);

  // 检查拼图是否完成
  const checkPuzzleComplete = useCallback((answerGrid: (PuzzlePiece | null)[]): boolean => {
    // 检查所有槽位是否都被填满
    if (answerGrid.some(slot => slot === null)) {
      return false;
    }
    
    // 检查每个拼图块是否在正确的位置（考虑旋转和翻转）
    return answerGrid.every((piece, slotIndex) => {
      if (!piece) return false;
      // 基础位置检查
      const isCorrectPosition = piece.correctSlot === slotIndex;
      // 旋转和翻转检查（预留接口，当前阶段返回true）
      const isCorrectOrientation = piece.rotation === 0 && !piece.isFlipped;
      return isCorrectPosition && isCorrectOrientation;
    });
  }, []);

  // 撤销操作
  const undo = useCallback(() => {
    if (!gameState || gameState.history.length === 0) return;

    const lastMove = gameState.history[gameState.history.length - 1];
    const newHistory = gameState.history.slice(0, -1);

    setGameState(prev => {
      if (!prev) return null;

      let newAnswerGrid = [...prev.answerGrid];
      let updatedPieces = [...prev.config.pieces];

      switch (lastMove.action) {
        case 'place':
          // 撤销放置：将拼图块从槽位移回原位置
          if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
            newAnswerGrid[lastMove.toSlot] = null;
          }
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId 
              ? { ...piece, currentSlot: lastMove.fromSlot || null }
              : piece
          );
          // 如果从其他槽位移动，需要恢复原槽位
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const originalPiece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (originalPiece) {
              newAnswerGrid[lastMove.fromSlot] = { ...originalPiece, currentSlot: lastMove.fromSlot };
            }
          }
          break;
        case 'remove':
          // 撤销移除：将拼图块放回槽位
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const piece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (piece) {
              newAnswerGrid[lastMove.fromSlot] = { ...piece, currentSlot: lastMove.fromSlot };
              updatedPieces = updatedPieces.map(p =>
                p.id === lastMove.pieceId ? { ...p, currentSlot: lastMove.fromSlot } : p
              );
            }
          }
          break;
        case 'replace':
          // 撤销替换：将新拼图块移回原位置，恢复被替换的拼图块
          if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
            // 移除新放置的拼图块
            newAnswerGrid[lastMove.toSlot] = null;
            
            // 如果被替换的拼图块存在，将其恢复到原位置
            if (lastMove.replacedPieceId) {
              const replacedPiece = updatedPieces.find(p => p.id === lastMove.replacedPieceId);
              if (replacedPiece) {
                newAnswerGrid[lastMove.toSlot] = { ...replacedPiece, currentSlot: lastMove.toSlot };
                updatedPieces = updatedPieces.map(p =>
                  p.id === lastMove.replacedPieceId ? { ...p, currentSlot: lastMove.toSlot } : p
                );
              }
            }
            
            // 将新拼图块移回原位置
            updatedPieces = updatedPieces.map(piece =>
              piece.id === lastMove.pieceId 
                ? { ...piece, currentSlot: lastMove.fromSlot || null }
                : piece
            );
            
            // 如果新拼图块原来在其他槽位，恢复那个槽位
            if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
              const originalPiece = updatedPieces.find(p => p.id === lastMove.pieceId);
              if (originalPiece) {
                newAnswerGrid[lastMove.fromSlot] = { ...originalPiece, currentSlot: lastMove.fromSlot };
              }
            }
          }
          break;
        case 'rotate':
          // 撤销旋转（预留功能）
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId 
              ? { ...piece, rotation: (piece.rotation - 90 + 360) % 360 }
              : piece
          );
          break;
        case 'flip':
          // 撤销翻转（预留功能）
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId 
              ? { ...piece, isFlipped: !piece.isFlipped }
              : piece
          );
          break;
      }

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: Math.max(0, prev.moves - 1),
        history: newHistory,
        answerGrid: newAnswerGrid,
      };
    });
  }, [gameState]);

  // 重置游戏
  const resetGame = useCallback(() => {
    if (!gameState) return;
    initializeGame(gameState.config);
  }, [gameState, initializeGame]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    isGameStarted,
    selectedPiece,
    setSelectedPiece,
    timer,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    rotatePiece,
    flipPiece,
    undo,
    resetGame,
    checkPuzzleComplete,
  };
}