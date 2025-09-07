import { useState } from 'react';
import { PuzzleConfig } from './types';
import { MainMenu } from './pages/MainMenu';
import { PuzzleGame } from './components/game/PuzzleGame';
import { PuzzleEditor } from './components/editor/PuzzleEditor';
import { IrregularPuzzleGame } from './pages/IrregularPuzzleGame';
import { Achievements } from './pages/Achievements';
import { DailyChallenge } from './pages/DailyChallenge';
import { Multiplayer } from './pages/Multiplayer';
import { Shop } from './pages/Shop';
import { Button } from './components/common/Button';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/auth/Auth';
import './App.css';

type AppView = 'menu' | 'game' | 'editor' | 'irregular-game' | 'achievements' | 'dailyChallenge' | 'multiplayer' | 'shop';

const AppContent: React.FC = () => {
  const { authState } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleConfig | null>(null);
  const [irregularGameParams, setIrregularGameParams] = useState<{
    imageData?: string;
    gridSize?: '3x3' | '4x4' | '5x5' | '6x6';
  }>({});

  // 如果正在加载认证状态，显示加载画面
  if (authState.isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="app-logo">🧩</div>
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!authState.isAuthenticated) {
    return <Auth />;
  }

  const handleStartGame = (puzzleConfig: PuzzleConfig) => {
    setCurrentPuzzle(puzzleConfig);
    setCurrentView('game');
  };

  const handleStartIrregularGame = (imageData?: string, gridSize: '3x3' | '4x4' | '5x5' | '6x6' = '3x3') => {
    setIrregularGameParams({ imageData, gridSize });
    setCurrentView('irregular-game');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setCurrentPuzzle(null);
    setIrregularGameParams({});
  };

  const handleOpenEditor = () => {
    setCurrentView('editor');
  };

  const handleOpenAchievements = () => {
    setCurrentView('achievements');
  };

  const handleOpenDailyChallenge = () => {
    setCurrentView('dailyChallenge');
  };

  const handleOpenMultiplayer = () => {
    setCurrentView('multiplayer');
  };

  const handleOpenShop = () => {
    setCurrentView('shop');
  };

  const handleGameComplete = (completionTime: number, moves: number) => {
    console.log(`游戏完成！用时: ${completionTime}秒, 步数: ${moves}`);
    // 这里可以添加完成后的处理逻辑，比如保存到排行榜
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onStartIrregularGame={handleStartIrregularGame}
            onOpenEditor={handleOpenEditor}
            onOpenAchievements={handleOpenAchievements}
            onOpenDailyChallenge={handleOpenDailyChallenge}
            onOpenMultiplayer={handleOpenMultiplayer}
            onOpenShop={handleOpenShop}
          />
        );
      
      case 'game':
        return currentPuzzle ? (
          <PuzzleGame
            puzzleConfig={currentPuzzle}
            onGameComplete={handleGameComplete}
            onBackToMenu={handleBackToMenu}
          />
        ) : (
          <div className="error-view">
            <h2>错误</h2>
            <p>拼图配置加载失败</p>
            <Button onClick={handleBackToMenu}>返回菜单</Button>
          </div>
        );
      
      case 'editor':
        return (
          <PuzzleEditor onBackToMenu={handleBackToMenu} />
        );
      
      case 'irregular-game':
        return (
          <IrregularPuzzleGame
            onBackToMenu={handleBackToMenu}
            imageData={irregularGameParams.imageData}
            gridSize={irregularGameParams.gridSize}
          />
        );
      
      case 'achievements':
        return (
          <Achievements onBackToMenu={handleBackToMenu} />
        );
      
      case 'dailyChallenge':
        return (
          <DailyChallenge onBackToMenu={handleBackToMenu} />
        );
      
      case 'multiplayer':
        return (
          <Multiplayer onBackToMenu={handleBackToMenu} />
        );
      
      case 'shop':
        return (
          <Shop onBackToMenu={handleBackToMenu} />
        );
      
      default:
        return (
          <div className="error-view">
            <h2>页面不存在</h2>
            <Button onClick={handleBackToMenu}>返回菜单</Button>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
