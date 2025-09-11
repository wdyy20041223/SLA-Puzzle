import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkPuzzleAssetUnlocked } from '../../utils/puzzleAssetDataFlowTest';

export const PuzzleAssetDebug: React.FC = () => {
  const { authState } = useAuth();
  
  const testPuzzleAssets = [
    'puzzle_image_1',
    'puzzle_image_2', 
    'puzzle_image_3'
  ];

  // 复制AssetLibrary中的解锁检查逻辑（参照头像框模式）
  const isPuzzleAssetUnlocked = (assetId: string): boolean => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    return checkPuzzleAssetUnlocked(assetId, authState.user.ownedItems || []);
  };

  if (!authState.isAuthenticated) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px', 
        margin: '10px 0' 
      }}>
        <h3>🔧 拼图素材调试面板</h3>
        <p>用户未登录</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      borderRadius: '8px', 
      margin: '10px 0' 
    }}>
      <h3>🔧 拼图素材调试面板</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>用户拥有的物品：</strong>
        <div style={{ 
          background: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          {authState.user?.ownedItems?.length ? 
            authState.user.ownedItems.map((item, index) => (
              <div key={index}>{item}</div>
            )) : 
            <em>无拥有物品</em>
          }
        </div>
      </div>

      <div>
        <strong>拼图素材解锁状态：</strong>
        {testPuzzleAssets.map(assetId => {
          const isUnlocked = isPuzzleAssetUnlocked(assetId);
          return (
            <div key={assetId} style={{ 
              padding: '8px', 
              margin: '5px 0',
              backgroundColor: isUnlocked ? '#d4edda' : '#f8d7da',
              border: `1px solid ${isUnlocked ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{assetId}</span>
              <span style={{ 
                color: isUnlocked ? '#155724' : '#721c24',
                fontWeight: 'bold'
              }}>
                {isUnlocked ? '🔓 已解锁' : '🔒 已锁定'}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>检查逻辑说明：</strong>
        <ul style={{ margin: '5px 0 0 20px' }}>
          <li>检查原始ID（如 puzzle_image_1）</li>
          <li>检查 puzzle_ 前缀变体</li>
          <li>检查 decoration_ 前缀（商店映射类型）</li>
          <li>检查去前缀变体（防止重复前缀）</li>
        </ul>
      </div>
    </div>
  );
};
