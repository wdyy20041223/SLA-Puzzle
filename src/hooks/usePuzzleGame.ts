import { useState, useCallback, useEffect, useRef } from 'react';
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
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);
      if (!piece) return prev;

      // 检查目标槽位是否已有拼图块
      const existingPiece = prev.answerGrid[targetSlot];
      
      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];
      
      // 如果目标槽位有拼图块，将其移回处理区
      if (existingPiece) {
        const updatedExistingPiece = { ...existingPiece, currentSlot: null };
        const existingPieceIndex = prev.config.pieces.findIndex(p => p.id === existingPiece.id);
        prev.config.pieces[existingPieceIndex] = updatedExistingPiece;
      }
      
      // 将当前拼图块放入目标槽位
      newAnswerGrid[targetSlot] = { ...piece, currentSlot: targetSlot };
      
      // 更新拼图块列表
      const updatedPieces = prev.config.pieces.map(p =>
        p.id === pieceId ? { ...p, currentSlot: targetSlot } : p
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'place',
        fromSlot: piece.currentSlot,
        toSlot: targetSlot,
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
  }, [gameState]);

  // 将拼图块从槽位移回处理区
  const removePieceFromSlot = useCallback((pieceId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);
      if (!piece || piece.currentSlot === null) return prev;

      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];
      newAnswerGrid[piece.currentSlot] = null;
      
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

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        answerGrid: newAnswerGrid,
      };
    });
  }, [gameState]);

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