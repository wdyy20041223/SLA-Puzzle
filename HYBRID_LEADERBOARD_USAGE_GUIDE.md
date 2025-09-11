# 混合排行榜服务使用指南

## 🚀 快速开始

### 1. 导入服务
```typescript
// 推荐：使用混合服务（自动切换API和本地模式）
import { HybridLeaderboardService } from './src/services/hybridLeaderboardService';

// 或者使用索引导入
import HybridLeaderboardService from './src/services';
```

### 2. 初始化服务
```typescript
async function initializeApp() {
  // 自动检测最佳模式（API或本地）
  await HybridLeaderboardService.initialize();
  
  // 检查当前状态
  const status = HybridLeaderboardService.getServiceStatus();
  console.log('排行榜模式:', status.mode); // 'api' 或 'local'
  console.log('用户登录:', status.isLoggedIn);
}
```

### 3. 添加游戏记录
```typescript
async function saveGameResult() {
  const entry = await HybridLeaderboardService.addEntry({
    puzzleName: 'sunset-beach',      // 拼图名称
    playerName: 'Player1',           // 玩家名称
    completionTime: 120000,          // 完成时间（毫秒）
    moves: 25,                       // 移动次数
    difficulty: 'easy',              // 难度
    pieceShape: 'square',            // 拼图形状
    gridSize: '3x3'                  // 网格大小
  });
  
  console.log('记录已保存:', entry.id);
}
```

### 4. 获取排行榜
```typescript
async function loadLeaderboard() {
  // 获取难度排行榜
  const leaderboard = await HybridLeaderboardService.getDifficultyLeaderboard(
    'easy',    // 难度
    'square',  // 形状
    10         // 条数限制
  );
  
  leaderboard.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.playerName} - ${entry.completionTime}ms`);
  });
}
```

## 🔧 高级功能

### 模式检测和切换
```typescript
// 检查当前模式
const status = HybridLeaderboardService.getServiceStatus();
if (status.mode === 'local') {
  console.log('当前使用本地模式');
} else {
  console.log('当前使用API模式');
}

// 手动切换到API模式（需要登录）
try {
  await HybridLeaderboardService.switchToAPIMode();
  console.log('已切换到API模式');
} catch (error) {
  console.log('切换失败:', error.message);
}
```

### 数据同步
```typescript
// 检查同步状态
const status = HybridLeaderboardService.getServiceStatus();
if (status.needsSync) {
  console.log('需要同步数据');
  
  // 手动同步
  try {
    await HybridLeaderboardService.forceSync();
    console.log('同步完成');
  } catch (error) {
    console.log('同步失败:', error.message);
  }
}
```

### 每日挑战
```typescript
// 添加每日挑战记录
const dailyEntry = HybridLeaderboardService.addDailyChallengeEntry({
  date: '2025-09-10',
  playerName: 'Player1',
  score: 85,
  completionTime: 150000,
  moves: 35,
  difficulty: 'medium',
  isPerfect: false,
  consecutiveDays: 3,
  totalChallengesCompleted: 10,
  averageScore: 82.5
});

// 获取每日挑战排行榜
const dailyRanking = HybridLeaderboardService.getDailyChallengeRanking('2025-09-10', 20);
console.log(`今日挑战参与人数: ${dailyRanking.length}`);
```

## 🔍 调试和监控

### 获取调试信息
```typescript
const debugInfo = HybridLeaderboardService.getDebugInfo();
console.log('调试信息:', {
  API模式: debugInfo.apiEnabled,
  有登录token: debugInfo.hasAuthToken,
  最后同步时间: debugInfo.lastSync,
  本地数据大小: debugInfo.localDataSize
});
```

### 状态监控
```typescript
// 定期检查服务状态
setInterval(() => {
  const status = HybridLeaderboardService.getServiceStatus();
  console.log(`排行榜服务状态: ${status.mode}模式, 登录状态: ${status.isLoggedIn}`);
}, 30000); // 每30秒检查一次
```

## 🌐 网络处理

### 网络状态变化处理
```typescript
// 监听网络状态
window.addEventListener('online', async () => {
  console.log('网络连接恢复');
  await HybridLeaderboardService.autoConfigureMode();
});

window.addEventListener('offline', () => {
  console.log('网络连接断开，切换到本地模式');
});
```

### 错误处理
```typescript
try {
  const entry = await HybridLeaderboardService.addEntry(gameData);
  console.log('记录保存成功');
} catch (error) {
  console.error('保存失败:', error);
  // 混合服务会自动回退到本地保存，所以数据不会丢失
}
```

## 📱 在React组件中使用

### Hook示例
```typescript
import { useState, useEffect } from 'react';
import { HybridLeaderboardService } from '../services/hybridLeaderboardService';

function useLeaderboard(difficulty: string, shape: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('local');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const leaderboard = await HybridLeaderboardService.getDifficultyLeaderboard(
          difficulty, shape, 50
        );
        setData(leaderboard);
        
        const status = HybridLeaderboardService.getServiceStatus();
        setMode(status.mode);
      } catch (error) {
        console.error('加载排行榜失败:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [difficulty, shape]);

  return { data, loading, mode };
}
```

### 组件示例
```tsx
function LeaderboardDisplay() {
  const { data, loading, mode } = useLeaderboard('easy', 'square');
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <div>
      <div className="mode-indicator">
        {mode === 'api' ? '🌐 在线模式' : '📱 本地模式'}
      </div>
      
      <ul>
        {data.map((entry, index) => (
          <li key={entry.id}>
            {index + 1}. {entry.playerName} - {formatTime(entry.completionTime)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## ⚙️ 配置选项

### 自定义设置
```typescript
// 设置API模式（手动控制）
HybridLeaderboardService.setAPIEnabled(true);

// 检查是否启用API
const isAPIEnabled = HybridLeaderboardService.getServiceStatus().mode === 'api';
```

### 环境适配
```typescript
// 开发环境：强制使用本地模式
if (process.env.NODE_ENV === 'development') {
  HybridLeaderboardService.setAPIEnabled(false);
}

// 生产环境：自动检测最佳模式
if (process.env.NODE_ENV === 'production') {
  await HybridLeaderboardService.autoConfigureMode();
}
```

## 📊 性能建议

### 最佳实践
1. **初始化一次**：在应用启动时调用`initialize()`
2. **批量操作**：避免频繁的单条记录操作
3. **缓存结果**：对排行榜数据进行适当缓存
4. **错误处理**：总是包装异步调用在try-catch中

### 性能优化
```typescript
// 使用防抖减少频繁调用
import { debounce } from 'lodash';

const debouncedLoadLeaderboard = debounce(async () => {
  const data = await HybridLeaderboardService.getDifficultyLeaderboard('easy', 'square');
  setLeaderboardData(data);
}, 300);

// 分页加载大量数据
const loadLeaderboardPage = async (page: number, pageSize: number = 20) => {
  const data = await HybridLeaderboardService.getDifficultyLeaderboard(
    'easy', 'square', page * pageSize
  );
  return data.slice((page - 1) * pageSize, page * pageSize);
};
```

## 🔧 故障排除

### 常见问题

1. **API调用失败**
   ```typescript
   // 检查网络和认证状态
   const status = HybridLeaderboardService.getServiceStatus();
   if (!status.isLoggedIn) {
     console.log('需要登录');
   }
   ```

2. **数据不同步**
   ```typescript
   // 手动触发同步
   await HybridLeaderboardService.forceSync();
   ```

3. **本地数据丢失**
   ```typescript
   // 检查本地存储
   const debugInfo = HybridLeaderboardService.getDebugInfo();
   console.log('本地数据大小:', debugInfo.localDataSize);
   ```

## 🎯 总结

混合排行榜服务提供了：
- ✅ 自动模式切换（API ↔ 本地）
- ✅ 数据不丢失保证
- ✅ 透明的网络处理
- ✅ 向后兼容性
- ✅ 丰富的调试信息

使用这个服务，你可以确保排行榜功能在任何网络环境下都能正常工作！
