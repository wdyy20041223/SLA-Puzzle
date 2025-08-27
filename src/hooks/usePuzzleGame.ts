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
    const shuffledPieces = shufflePieces([...config.pieces]);
    
    const newGameState: GameState = {
      config: { ...config, pieces: shuffledPieces },
      startTime: new Date(),
      moves: 0,
      isCompleted: false,
      elapsedTime: 0,
      history: [],
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

  // 打乱拼图块
  const shufflePieces = useCallback((pieces: PuzzlePiece[]): PuzzlePiece[] => {
    const shuffled = [...pieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 为每个拼图块设置随机位置
    return shuffled.map((piece, index) => ({
      ...piece,
      currentPosition: {
        x: Math.random() * 600,
        y: Math.random() * 400,
      },
    }));
  }, []);

  // 移动拼图块
  const movePiece = useCallback((pieceId: string, newPosition: { x: number; y: number }) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedPieces = prev.config.pieces.map(piece =>
        piece.id === pieceId ? { ...piece, currentPosition: newPosition } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'move',
        fromPosition: prev.config.pieces.find(p => p.id === pieceId)?.currentPosition,
        toPosition: newPosition,
        timestamp: new Date(),
      };

      const newGameState: GameState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
      };

      // 检查是否完成
      if (checkPuzzleComplete(updatedPieces)) {
        newGameState.isCompleted = true;
        newGameState.endTime = new Date();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }

      return newGameState;
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
  const checkPuzzleComplete = useCallback((pieces: PuzzlePiece[]): boolean => {
    const tolerance = 20; // 位置容差
    return pieces.every(piece => {
      const dx = Math.abs(piece.currentPosition.x - piece.correctPosition.x);
      const dy = Math.abs(piece.currentPosition.y - piece.correctPosition.y);
      return dx <= tolerance && dy <= tolerance && piece.rotation === 0;
    });
  }, []);

  // 撤销操作
  const undo = useCallback(() => {
    if (!gameState || gameState.history.length === 0) return;

    const lastMove = gameState.history[gameState.history.length - 1];
    const newHistory = gameState.history.slice(0, -1);

    setGameState(prev => {
      if (!prev) return null;

      let updatedPieces = [...prev.config.pieces];

      switch (lastMove.action) {
        case 'move':
          if (lastMove.fromPosition) {
            updatedPieces = updatedPieces.map(piece =>
              piece.id === lastMove.pieceId 
                ? { ...piece, currentPosition: lastMove.fromPosition! }
                : piece
            );
          }
          break;
        case 'rotate':
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId 
              ? { ...piece, rotation: piece.rotation - 90 }
              : piece
          );
          break;
        case 'flip':
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
    movePiece,
    rotatePiece,
    flipPiece,
    undo,
    resetGame,
  };
}