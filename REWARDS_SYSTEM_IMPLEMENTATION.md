# 经验值系统和金币系统实现说明

## 📈 功能概述

成功实现了用户金币和经验值系统，并将奖励总览从每日挑战页面移至首页用户配置文件中显示。

## 🔧 主要实现

### 1. **经验值公式**
- **公式**: `exp(level) = 200 * level - 100`
- **说明**: 其中 `level` 为目标等级，`exp(level)` 为升到该等级所需的总经验值

#### 等级经验表：
| 等级 | 所需总经验 | 该级别经验 |
|------|------------|------------|
| 1    | 0          | -          |
| 2    | 300        | 300        |
| 3    | 500        | 200        |
| 4    | 700        | 200        |
| 5    | 900        | 200        |
| 10   | 1900       | 200        |

### 2. **用户数据结构更新**

```typescript
interface User {
  id: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
  level: number;
  experience: number;  // 🆕 当前总经验值
  coins: number;       // 🆕 金币数量
  totalScore: number;
  gamesCompleted: number;
}
```

### 3. **首页显示内容**

用户配置文件下拉菜单现在显示：

```
💰 金币: 2,340
⭐ 经验: 165  
🏆 等级: 3
距离下一级: 135 经验
[进度条显示]
────────────────
总分: 1,250
完成游戏: 15
```

## 🛠️ 技术实现细节

### 经验值工具函数 (`src/utils/experienceSystem.ts`)

```typescript
// 计算升到指定等级所需经验
getRequiredExpForLevel(level: number): number

// 计算下一级所需经验  
getExpToNextLevel(currentLevel: number): number

// 获取当前等级进度信息
getLevelProgress(currentLevel: number, currentExp: number)

// 根据总经验计算当前等级
calculateLevelFromExp(totalExp: number): number

// 添加经验并检查升级
addExperience(currentLevel: number, currentExp: number, addExp: number)
```

### AuthContext 新增功能

```typescript
// 更新用户奖励（金币和经验）
updateUserRewards(coins: number, experience: number): Promise<boolean>
```

### 数据迁移

- 为现有用户自动添加 `experience: 0` 和 `coins: 100`
- 新注册用户默认获得 100 金币
- 自动处理数据兼容性

## 🎮 使用示例

### 游戏完成后奖励经验和金币

```typescript
import { useAuth } from '../contexts/AuthContext';

const GameComponent = () => {
  const { updateUserRewards } = useAuth();
  
  const handleGameComplete = async () => {
    // 游戏完成奖励：50金币，30经验
    const success = await updateUserRewards(50, 30);
    if (success) {
      console.log('奖励发放成功！');
    }
  };
};
```

### 检查是否升级

```typescript
import { addExperience } from '../utils/experienceSystem';

const result = addExperience(currentLevel, currentExp, 50);
if (result.leveledUp) {
  console.log(`恭喜升级！从 ${currentLevel} 级升到 ${result.newLevel} 级`);
  console.log(`总共升了 ${result.levelsGained} 级`);
}
```

## 📱 界面变化

### 移除的内容
- ❌ 每日挑战页面的"奖励总览"选项卡

### 新增的内容  
- ✅ 首页用户配置文件中的金币显示
- ✅ 首页用户配置文件中的经验显示
- ✅ 首页用户配置文件中的等级进度条
- ✅ 升级所需经验的实时计算

## 🎯 后续扩展建议

1. **游戏奖励集成**: 在各个游戏模式完成时调用 `updateUserRewards`
2. **成就系统**: 基于经验和金币实现成就解锁
3. **商店系统**: 使用金币购买道具、皮肤等
4. **等级特权**: 不同等级解锁不同功能
5. **每日任务**: 完成任务获得经验和金币奖励

## 🔗 相关文件

- `src/types/index.ts` - 用户数据类型定义
- `src/utils/experienceSystem.ts` - 经验值计算工具
- `src/contexts/AuthContext.tsx` - 用户认证和奖励更新
- `src/components/auth/UserProfile.tsx` - 用户配置文件显示
- `src/components/auth/UserProfile.css` - 样式文件
- `src/services/cloudStorage.ts` - 数据存储和迁移
- `src/pages/DailyChallenge.tsx` - 移除奖励总览
