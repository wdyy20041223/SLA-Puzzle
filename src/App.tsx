import { useState } from 'react';
import { PuzzleConfig } from './types';
import { MainMenu } from './pages/MainMenu';
import { PuzzleGame } from './components/game/PuzzleGame';
import { PuzzleEditor } from './components/editor/PuzzleEditor';
import { Button } from './components/common/Button';
import './App.css';

type AppView = 'menu' | 'game' | 'editor';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleConfig | null>(null);

  const handleStartGame = (puzzleConfig: PuzzleConfig) => {
    setCurrentPuzzle(puzzleConfig);
    setCurrentView('game');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setCurrentPuzzle(null);
  };

  const handleOpenEditor = () => {
    setCurrentView('editor');
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
            onOpenEditor={handleOpenEditor}
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
}

export default App;
