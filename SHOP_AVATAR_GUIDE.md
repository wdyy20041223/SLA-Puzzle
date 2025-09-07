# 商店和头像系统功能指南

## 功能概述

本次更新添加了完整的商店系统和头像自定义功能：

### 🛒 商店功能
- **位置**: 在首页素材库右侧添加了"进入商店"按钮
- **商品类型**: 头像、拼图素材、主题、装饰（头像框）
- **购买系统**: 使用金币购买，支持不同稀有度的物品
- **库存管理**: 已购买的物品会标记为"已拥有"

### 👤 头像自定义功能
- **触发方式**: 点击用户头像即可打开头像选择器
- **可选内容**: 
  - 头像：默认头像、表情符号头像、购买的特殊头像
  - 头像框：无边框、金色边框、光环特效等
- **实时预览**: 选择时可实时预览效果
- **权限控制**: 只能使用已拥有的物品，未拥有的会显示"前往商店购买"

## 使用流程

### 1. 购买物品
1. 点击首页的"进入商店"按钮
2. 浏览不同分类的商品
3. 查看价格和稀有度
4. 点击"购买"按钮完成购买

### 2. 更换头像
1. 点击页面右上角的用户头像
2. 在头像选择器中选择"头像"或"边框"选项卡
3. 选择喜欢的头像或边框
4. 点击"保存更改"确认

## 技术实现

### 新增文件
- `src/pages/Shop.tsx` - 商店页面组件
- `src/pages/Shop.css` - 商店页面样式
- `src/components/auth/AvatarSelector.tsx` - 头像选择器组件
- `src/components/auth/AvatarSelector.css` - 头像选择器样式

### 修改文件
- `src/App.tsx` - 添加商店路由
- `src/pages/MainMenu.tsx` - 添加商店入口按钮
- `src/components/auth/UserProfile.tsx` - 集成头像选择功能
- `src/components/auth/UserProfile.css` - 添加头像框样式
- `src/types/index.ts` - 扩展User类型支持头像框和拥有物品
- `src/contexts/AuthContext.tsx` - 新用户默认拥有一些测试物品

## 数据结构

### 用户数据扩展
```typescript
interface User {
  // 原有字段...
  avatarFrame?: string;    // 头像框ID
  ownedItems?: string[];   // 拥有的商店物品ID列表
}
```

### 商店物品
```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: 'avatar' | 'puzzle' | 'theme' | 'decoration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: boolean;
}
```

## 测试建议

1. **新用户注册**: 新注册的用户会获得500金币和一些测试物品
2. **购买流程**: 测试不同价格物品的购买
3. **权限控制**: 验证只能使用已拥有的物品
4. **UI交互**: 测试头像选择器的各种交互
5. **数据持久化**: 刷新页面后设置应该保持

## 后续优化建议

1. **服务器集成**: 当前使用localStorage，应与后端API集成
2. **动画效果**: 添加更多购买和切换的动画效果
3. **物品扩展**: 可以添加更多类型的商店物品
4. **成就关联**: 将某些物品与成就系统关联
5. **限时商品**: 添加限时或特殊活动商品
