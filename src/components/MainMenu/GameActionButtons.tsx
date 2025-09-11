import React from 'react';
import { Button } from '../common/Button';

interface GameActionButtonsProps {
  onStartGame: () => void;
  onLoadGame?: () => void;
  onOpenAchievements: () => void;
  onOpenDailyChallenge: () => void;
  onOpenLeaderboard: () => void;
  canStartGame: boolean;
  isGenerating: boolean;
}

export const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  onStartGame,
  onLoadGame,
  onOpenAchievements,
  onOpenDailyChallenge,
  onOpenLeaderboard,
  canStartGame,
  isGenerating,
}) => {
  return (
    <div className="px-2 pb-4 flex flex-col gap-3">
      <Button
        onClick={onStartGame}
        variant="primary"
        size="large"
        disabled={!canStartGame}
        className="w-full py-4 text-base font-semibold"
      >
        {isGenerating ? '生成中...' : '🎮 开始游戏'}
      </Button>
      
      {onLoadGame && (
        <Button
          onClick={onLoadGame}
          variant="success"
          size="large"
          className="w-full py-4 text-base font-semibold"
        >
          📂 加载游戏
        </Button>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onOpenAchievements}
          variant="secondary"
          size="medium"
          className="w-full py-3 text-sm font-medium"
        >
          🏆 成就
        </Button>
        
        <Button
          onClick={onOpenDailyChallenge}
          variant="secondary"
          size="medium"
          className="w-full py-3 text-sm font-medium"
        >
          📅 每日挑战
        </Button>
        
        <Button
          onClick={onOpenLeaderboard}
          variant="secondary"
          size="medium"
          className="w-full py-3 text-sm font-medium col-span-2"
        >
          🏆 排行榜
        </Button>
      </div>
    </div>
  );
};
