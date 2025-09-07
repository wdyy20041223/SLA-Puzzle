import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../../types';
import './Auth.css';

type AuthMode = 'login' | 'register';

export const Auth: React.FC = () => {
  const { authState, login, register, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除错误信息
    if (authState.error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      const credentials: LoginCredentials = {
        username: formData.username,
        password: formData.password,
      };
      await login(credentials);
    } else {
      const credentials: RegisterCredentials = {
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      await register(credentials);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
    });
    clearError();
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return formData.username.trim() && formData.password.trim();
    } else {
      return (
        formData.username.trim() &&
        formData.password.trim() &&
        formData.confirmPassword.trim()
      );
    }
  };

  if (authState.isLoading && authState.isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-modal">
          <div className="auth-header">
            <div className="app-logo">🧩</div>
            <div className="loading-spinner"></div>
            <p>登录中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <div className="auth-header">
          <div className="app-logo">🧩</div>
          <h1 className="auth-title">
            {mode === 'login' ? '欢迎回来' : '加入我们'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? '登录您的拼图游戏账户' 
              : '创建您的拼图游戏账户'
            }
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${authState.error ? 'error' : ''}`}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="请输入密码"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="请再次输入密码"
                required
              />
            </div>
          )}

          {authState.error && (
            <div className="error-message">
              {authState.error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={!isFormValid() || authState.isLoading}
          >
            {authState.isLoading && <span className="loading-spinner"></span>}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="auth-switch">
          <p className="auth-switch-text">
            {mode === 'login' ? '还没有账户？' : '已有账户？'}
          </p>
          <button
            type="button"
            className="auth-switch-button"
            onClick={switchMode}
            disabled={authState.isLoading}
          >
            {mode === 'login' ? '立即注册' : '立即登录'}
          </button>
        </div>
      </div>
    </div>
  );
};
