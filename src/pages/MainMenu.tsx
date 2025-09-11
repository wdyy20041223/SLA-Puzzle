import React, { useState } from 'react';
import { Asset, PuzzleConfig, DifficultyLevel, PieceShape } from '../types';
import { AssetLibrary } from '../components/game/AssetLibrary';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import { GameConfigPanel } from '../components/MainMenu';
import { UserProfile } from '../components/auth/UserProfile';
import { DataSync } from '../components/sync/DataSync';
import { SaveLoadModal } from '../components/game/SaveLoadModal';
import { PuzzleSaveService } from '../services/puzzleSaveService';
import { PuzzleAssetTest } from '../components/test/PuzzleAssetTest';
import { PuzzleAssetDebug } from '../components/test/PuzzleAssetDebug';
import { diagnosePuzzleAssetPersistence, checkPuzzleAssetData } from '../utils/puzzleAssetPersistenceDebug';
import { PuzzleAssetManager } from '../utils/PuzzleAssetManager';
import { testPuzzleAssetDataFlow } from '../utils/puzzleAssetDataFlowTest';
import { useAuth } from '../contexts/AuthContext';
import { musicManager } from '../services/musicService';
import './MainMenu.css';


interface MainMenuProps {
  onStartGame: (puzzleConfig: PuzzleConfig) => void;
  onLoadGame?: (saveId: string) => void;
  onStartIrregularGame: (imageData?: string, gridSize?: '3x3' | '4x4' | '5x5' | '6x6') => void;

  onStartTetrisGame: (puzzleConfig: PuzzleConfig) => void;
  onOpenEditor: () => void;

  onOpenAchievements: () => void;
  onOpenDailyChallenge: () => void;
  onOpenShop: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onBackToHome: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onLoadGame,
  onStartIrregularGame,

  onStartTetrisGame,
  onOpenEditor,

  onOpenAchievements,
  onOpenDailyChallenge,
  onOpenShop,
  onOpenProfile,
  onOpenLeaderboard,
  onBackToHome,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [pieceShape, setPieceShape] = useState<PieceShape>('square');
  const [isAllowPieceRotation, setIsAllowPieceRotation] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showPuzzleTest, setShowPuzzleTest] = useState(false);

  const { authState } = useAuth();

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleOpenLoadModal = () => {
    setShowLoadModal(true);
  };

  const handleCloseLoadModal = () => {
    setShowLoadModal(false);
  };

  const handleLoadGame = (saveId: string) => {
    if (onLoadGame) {
      onLoadGame(saveId);
      setShowLoadModal(false);
      return { success: true };
    }

    return { success: false, error: '无法加载游戏' };
  };

  const handleDeleteSave = (saveId: string) => {
    return PuzzleSaveService.deleteSavedGame(saveId);
  };

  const getSavedGames = () => {
    return PuzzleSaveService.getSavedGames(authState.user?.id);
  };

  const handleStartGame = async () => {
    if (!selectedAsset) return;

    setIsGenerating(true);
    try {
      // 播放战斗音乐（在真正开始游戏时播放一次）
      musicManager.playBattleMusic();
      
      // 使用真实的图片数据
      const imageData = selectedAsset.filePath;

      // 如果选择的是异形拼图，使用新的异形拼图系统
      if (pieceShape === 'irregular') {
        const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
        // 将 GridSize 转换为字符串格式
        const gridSizeStr = `${difficultyConfig.gridSize.rows}x${difficultyConfig.gridSize.cols}` as '3x3' | '4x4' | '5x5' | '6x6';
        onStartIrregularGame(imageData, gridSizeStr);
        return;
      }

      // 如果选择的是俄罗斯方块拼图，使用俄罗斯方块拼图系统
      if (pieceShape === 'tetris') {
        const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);

        const puzzleConfig = await PuzzleGenerator.generatePuzzle({
          imageData: imageData,
          gridSize: difficultyConfig.gridSize,
          pieceShape: pieceShape,
          name: selectedAsset.name,
        });

        onStartTetrisGame(puzzleConfig);
        return;
      }

      // 传统方形拼图
      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);

      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
          allowRotation: isAllowPieceRotation,
        imageData: imageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
      });

      onStartGame(puzzleConfig);
    } catch (error) {
      console.error('生成拼图失败:', error);
      // 如果图片加载失败，使用备用的色块
      const fallbackImageData = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#${Math.floor(Math.random() * 16777215).toString(16)}"/>
          <text x="200" y="200" text-anchor="middle" fill="white" font-size="24">${selectedAsset.name}</text>
        </svg>
      `)}`;

      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: fallbackImageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
        allowRotation: isAllowPieceRotation,
      });

      onStartGame(puzzleConfig);
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 shadow-md px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-full transition-colors text-sm flex items-center gap-2"
          >
            ← 返回首页
          </button>
          <span className="text-2xl">🎯</span>
          <h1 className="text-xl font-bold text-white">单人游戏</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPuzzleTest(!showPuzzleTest)}
            className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-full transition-colors text-sm"
          >
            🧪 测试
          </button>
          <button
            onClick={() => setShowSyncPanel(!showSyncPanel)}
            className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-full transition-colors text-sm"
          >
            🌐 数据同步
          </button>
          <UserProfile onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} />
        </div>
      </div>

      {/* 数据同步面板 */}
      {showSyncPanel && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-5">
            <DataSync />
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex justify-center items-start pt-[25px] px-5 pb-5 flex-1">
        <div className="flex flex-col lg:flex-row gap-5 w-full max-w-6xl">
          {/* 素材选择区域 */}
          <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-lg flex flex-col h-[800px]">
            <AssetLibrary
              onAssetSelect={handleAssetSelect}
              showUpload={true}
            />
          </div>

          {/* 游戏配置区域 */}
          <div className="h-[800px]">
            <GameConfigPanel
              selectedAsset={selectedAsset}
              difficulty={difficulty}
              pieceShape={pieceShape}
              isGenerating={isGenerating}
              onDifficultyChange={setDifficulty}
              onShapeChange={setPieceShape}
              onPieceRotationChange={setIsAllowPieceRotation}
              isAllowPieceRotation={isAllowPieceRotation}
              onStartGame={handleStartGame}
              onLoadGame={handleOpenLoadModal}
              onOpenAchievements={onOpenAchievements}
              onOpenDailyChallenge={onOpenDailyChallenge}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          </div>
        </div>

        {/* 测试面板 */}
        {showPuzzleTest && (
          <div className="mt-4">
            <PuzzleAssetTest />
            <PuzzleAssetDebug />
            
            {/* 拼图素材持久化调试按钮 */}
            <div style={{ 
              margin: '10px 0', 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px',
              border: '1px solid #ffeaa7' 
            }}>
              <h4>🔧 拼图素材持久化调试</h4>
              <button
                onClick={() => checkPuzzleAssetData()}
                style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                检查数据
              </button>
              <button
                onClick={() => diagnosePuzzleAssetPersistence()}
                style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                完整诊断
              </button>
              <button
                onClick={async () => {
                  const result = await PuzzleAssetManager.syncPuzzleAssets();
                  alert(result.message);
                  console.log('🔄 同步结果:', result);
                }}
                style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                修复持久化
              </button>
              <button
                onClick={() => testPuzzleAssetDataFlow()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                数据流测试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 加载游戏模态框 */}
      <SaveLoadModal
        isVisible={showLoadModal}
        onClose={handleCloseLoadModal}
        mode="load"
        savedGames={getSavedGames()}
        currentGameProgress={0}
        onSaveGame={() => ({ success: false, error: '主菜单不支持保存' })}
        onLoadGame={handleLoadGame}
        onDeleteSave={handleDeleteSave}
      />
    </div>
  );
};