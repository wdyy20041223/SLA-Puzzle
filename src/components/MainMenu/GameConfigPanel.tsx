import React from 'react';
import { Asset, DifficultyLevel, PieceShape } from '../../types';
import { SelectedAsset } from './SelectedAsset';
import { DifficultySelector } from './DifficultySelector';
import { ShapeSelector } from './ShapeSelector';
import { AssetSelectionHint } from './AssetSelectionHint';
import { GameActionButtons } from './GameActionButtons';
import { GameHelpButton } from '../common/GameHelp';

interface GameConfigPanelProps {
  selectedAsset: Asset | null;
  difficulty: DifficultyLevel;
  pieceShape: PieceShape;
  isGenerating: boolean;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onShapeChange: (shape: PieceShape) => void;
  onPieceRotationChange: (allowRotation: boolean) => void;
  isAllowPieceRotation: boolean;
  onStartGame: () => void;
  onLoadGame?: () => void;
  onOpenAchievements: () => void;
  onOpenDailyChallenge: () => void;
  onOpenLeaderboard: () => void;
}

export const GameConfigPanel: React.FC<GameConfigPanelProps> = ({
  selectedAsset,
  difficulty,
  pieceShape,
  isGenerating,
  onDifficultyChange,
  onShapeChange,
  onPieceRotationChange,
  isAllowPieceRotation,
  onStartGame,
  onLoadGame,
  onOpenAchievements,
  onOpenDailyChallenge,
  onOpenLeaderboard,
}) => {
  const canStartGame = selectedAsset !== null && !isGenerating;

  return (
    <div className="w-full lg:w-[350px] lg:max-w-[600px] lg:mx-auto bg-white rounded-lg p-5 shadow-lg flex-shrink-0 overflow-y-auto h-full scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-2">
          <h3 className="m-0 text-gray-800 text-xl font-bold">游戏设置</h3>
          <GameHelpButton />
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex-1 px-2 py-4 space-y-2">
          {/* 选中素材预览 */}
          {selectedAsset && <SelectedAsset asset={selectedAsset} />}

          {/* 难度选择 */}
          <DifficultySelector 
            selectedDifficulty={difficulty}
            onDifficultyChange={onDifficultyChange}
          />

          {/* 拼图形状选择 */}
        <ShapeSelector 
          selectedShape={pieceShape}
          onShapeChange={onShapeChange}
        />
        
        {/* 拼图块翻转选项 */}
        <div className="mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 font-medium">特殊玩法:允许翻转</span>
            <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${isAllowPieceRotation ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <input
                type="checkbox"
                checked={isAllowPieceRotation}
                onChange={(e) => onPieceRotationChange(e.target.checked)}
                className="sr-only"
              />
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${isAllowPieceRotation ? 'transform translate-x-6' : ''}`} />
            </div>
          </label>
          <p className="mt-1 text-sm text-gray-500">部分拼图块将以翻转或旋转的方式出现</p>
        </div>
        
        {/* 未选择素材提示 */}
        {!selectedAsset && <AssetSelectionHint />}
        </div>

        {/* 操作按钮区域 - 固定在底部 */}
        <GameActionButtons
          onStartGame={onStartGame}
          onLoadGame={onLoadGame}
          onOpenAchievements={onOpenAchievements}
          onOpenDailyChallenge={onOpenDailyChallenge}
          onOpenLeaderboard={onOpenLeaderboard}
          canStartGame={canStartGame}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};
