import React, { useState, useEffect } from 'react';
import { PuzzleConfig, GameState } from '../../types';
import { PuzzleGame } from './PuzzleGame';
import { PuzzleSaveService } from '../../services/puzzleSaveService';
import { Button } from '../common/Button';

interface LoadedPuzzleGameProps {
  saveId: string;
  onGameComplete?: (completionTime: number, moves: number) => void;
  onBackToMenu?: () => void;
}

export const LoadedPuzzleGame: React.FC<LoadedPuzzleGameProps> = ({
  saveId,
  onGameComplete,
  onBackToMenu,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGameState = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = PuzzleSaveService.loadGame(saveId);
        
        if (result.success && result.gameState) {
          setGameState(result.gameState);
        } else {
          setError(result.error || '加载游戏失败');
        }
      } catch (err) {
        setError('加载游戏时发生错误');
        console.error('Load game error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, [saveId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在加载游戏...</div>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || '无法加载游戏数据'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={onBackToMenu} variant="primary">
              返回主菜单
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 使用loaded game state创建一个特殊的puzzle config
  // 我们需要修改PuzzleGame来支持preloaded state
  return (
    <PuzzleGame
      puzzleConfig={gameState.config}
      preloadedGameState={gameState}
      onGameComplete={onGameComplete}
      onBackToMenu={onBackToMenu}
    />
  );
};
