import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

export const UserProfile: React.FC = () => {
  const { authState, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <div className="user-profile">
      <button
        className="user-profile-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-avatar">
          {authState.user.avatar ? (
            <img src={authState.user.avatar} alt={authState.user.username} />
          ) : (
            <span>{authState.user.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className="user-name">{authState.user.username}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-info-item">
              <span className="label">等级:</span>
              <span className="value">{authState.user.level}</span>
            </div>
            <div className="user-info-item">
              <span className="label">总分:</span>
              <span className="value">{authState.user.totalScore}</span>
            </div>
            <div className="user-info-item">
              <span className="label">完成游戏:</span>
              <span className="value">{authState.user.gamesCompleted}</span>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item logout-button" onClick={handleLogout}>
            <span>🚪</span>
            退出登录
          </button>
        </div>
      )}

      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};
