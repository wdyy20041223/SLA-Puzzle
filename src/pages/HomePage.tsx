import React, { useState, useEffect } from 'react';
import { UserProfile } from '../components/auth/UserProfile';
import { themeManager, ThemeState } from '../services/themeService';
import { musicManager } from '../services/musicService';
import '../styles/HomePage.css';

interface HomePageProps {
  onOpenSinglePlayer: () => void;
  onOpenMultiplayer: () => void;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenSinglePlayer,
  onOpenMultiplayer,
  onOpenEditor,
  onOpenSettings,
  onOpenProfile,
  onOpenShop
}) => {
  const [themeState, setThemeState] = useState<ThemeState>(themeManager.getThemeState());

  useEffect(() => {
    // 订阅主题变化
    const unsubscribe = themeManager.subscribe(setThemeState);
    
    // 播放大厅音乐
    musicManager.playLobbyMusic();
    
    // 清理函数
    return () => {
      unsubscribe();
      // 注意：不在这里停止音乐，因为可能需要在其他页面继续播放
    };
  }, []);

  return (
    <div 
      className="home-page"
      style={{
        backgroundImage: `url(${themeState.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="home-overlay">
        {/* 用户头像区域 */}
        <div className="home-user-profile">
          <UserProfile onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} />
        </div>
        
        <div className="home-container">
          {/* 游戏标题 */}
          <div className="home-header">
            <h1 className="home-title">
              <span className="home-icon">🧩</span>
              拼图大师
            </h1>
            <p className="home-subtitle">慵懒夏日，轻松拼图</p>
          </div>

          {/* 主要功能区域 */}
          <div className="home-menu">
            <div className="menu-grid">
              <button 
                className="menu-item"
                onClick={onOpenSinglePlayer}
              >
                <div className="menu-icon">🎯</div>
                <div className="menu-text">
                  <h3>单人游戏</h3>
                  <p>享受独自解谜的乐趣</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={onOpenMultiplayer}
              >
                <div className="menu-icon">⚔️</div>
                <div className="menu-text">
                  <h3>多人对战</h3>
                  <p>与朋友一起竞技</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={onOpenEditor}
              >
                <div className="menu-icon">🎨</div>
                <div className="menu-text">
                  <h3>拼图编辑器</h3>
                  <p>创造属于你的拼图</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={onOpenSettings}
              >
                <div className="menu-icon">⚙️</div>
                <div className="menu-text">
                  <h3>设置</h3>
                  <p>个性化你的游戏体验</p>
                </div>
              </button>
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="home-footer">
            <div className="decorative-elements">
              <span className="summer-icon">🌸</span>
              <span className="summer-icon">🌺</span>
              <span className="summer-icon">🌸</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
