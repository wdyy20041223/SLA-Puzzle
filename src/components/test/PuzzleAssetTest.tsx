/**
 * 拼图素材锁定功能测试组件
 * 用于验证新的锁定/解锁机制是否正常工作
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const PuzzleAssetTest: React.FC = () => {
  const { authState } = useAuth();

  const userOwnedItems = authState.user?.ownedItems || [];
  const puzzleAssets = ['puzzle_image_1', 'puzzle_image_2', 'puzzle_image_3'];

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
      <h3>🎨 拼图素材锁定功能测试</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>当前用户信息:</h4>
        <p><strong>用户ID:</strong> {authState.user?.id || '未登录'}</p>
        <p><strong>金币:</strong> {authState.user?.coins || 0}</p>
        <p><strong>已拥有物品:</strong> {userOwnedItems.length} 件</p>
        <details>
          <summary>查看所有物品</summary>
          <ul>
            {userOwnedItems.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </div>

      <div>
        <h4>拼图素材状态:</h4>
        {puzzleAssets.map(assetId => {
          const isUnlocked = userOwnedItems.includes(assetId);
          const assetNames: Record<string, string> = {
            'puzzle_image_1': '森林花园',
            'puzzle_image_2': '黄昏日落',
            'puzzle_image_3': '玫瑰花园'
          };

          return (
            <div key={assetId} style={{
              padding: '10px',
              margin: '5px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: isUnlocked ? '#e8f5e8' : '#fff3cd',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>
                {isUnlocked ? '✅' : '🔒'}
              </span>
              <div>
                <strong>{assetNames[assetId]}</strong>
                <br />
                <small style={{ color: isUnlocked ? '#28a745' : '#856404' }}>
                  {isUnlocked ? '已解锁 - 可在素材库中使用' : '已锁定 - 需要在商店购买'}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e9ecef', borderRadius: '4px' }}>
        <h4>📋 测试说明:</h4>
        <ol>
          <li>查看上方拼图素材的状态</li>
          <li>如果显示"已锁定"，说明功能正常</li>
          <li>前往商店购买对应素材</li>
          <li>购买后返回此处查看状态变化</li>
          <li>确认素材库中对应素材已解锁</li>
        </ol>
      </div>
    </div>
  );
};
