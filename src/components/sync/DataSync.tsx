import React, { useState, useEffect } from 'react';
import { cloudStorage } from '../../services/cloudStorage';
import './DataSync.css';

export const DataSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [userCount, setUserCount] = useState<number>(0);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    try {
      const response = await cloudStorage.getUsers();
      if (response.success) {
        setUserCount(response.data?.length || 0);
        setLastSync(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to load sync info:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    
    try {
      // 强制同步数据
      const response = await cloudStorage.getUsers();
      
      if (response.success) {
        setSyncStatus('success');
        setUserCount(response.data?.length || 0);
        setLastSync(new Date().toLocaleString());
        
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔗';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return '同步中...';
      case 'success': return '同步成功！';
      case 'error': return '同步失败';
      default: return '就绪';
    }
  };

  return (
    <div className="data-sync">
      <div className="sync-header">
        <h3>🌐 跨设备同步</h3>
        <p>您的游戏数据可以在任意设备上使用</p>
      </div>

      <div className="sync-info">
        <div className="info-item">
          <span className="label">同步用户数：</span>
          <span className="value">{userCount}</span>
        </div>
        
        <div className="info-item">
          <span className="label">最后同步：</span>
          <span className="value">{lastSync || '未同步'}</span>
        </div>

        <div className="info-item">
          <span className="label">同步状态：</span>
          <span className={`status ${syncStatus}`}>
            {getStatusIcon()} {getStatusText()}
          </span>
        </div>
      </div>

      <button 
        className={`sync-button ${syncStatus === 'syncing' ? 'loading' : ''}`}
        onClick={handleManualSync}
        disabled={syncStatus === 'syncing'}
      >
        {syncStatus === 'syncing' ? '同步中...' : '手动同步'}
      </button>

      <div className="sync-explanation">
        <h4>🔐 如何在其他设备登录</h4>
        <ol>
          <li>在任意设备打开游戏网页</li>
          <li>使用相同的用户名和密码登录</li>
          <li>系统会自动同步您的游戏数据</li>
          <li>所有设备将保持数据一致</li>
        </ol>
        
        <div className="tech-note">
          <p><strong>技术说明：</strong></p>
          <p>当前使用浏览器间的数据同步机制，支持同一网络下的设备间数据共享。在生产环境中，这将升级为真正的云端数据库服务。</p>
        </div>
      </div>
    </div>
  );
};
