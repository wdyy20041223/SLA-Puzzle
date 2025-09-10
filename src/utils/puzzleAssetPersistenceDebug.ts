// 拼图素材持久化调试工具
// 用于检查前端-后端数据同步问题

import { apiService } from '../services/apiService';

export const diagnosePuzzleAssetPersistence = async () => {
  console.log('🔍 开始拼图素材持久化诊断...');
  
  try {
    // 1. 检查当前登录状态
    if (!apiService.isAuthenticated()) {
      console.error('❌ 用户未登录');
      return;
    }

    // 2. 获取后端用户数据
    console.log('📡 获取后端用户数据...');
    const userResponse = await apiService.getUserProfile();
    
    if (!userResponse.success || !userResponse.data) {
      console.error('❌ 无法获取用户数据:', userResponse.error);
      return;
    }

    const backendUser = userResponse.data.user;
    console.log('👤 后端用户数据:');
    console.log('- 用户ID:', backendUser.id);
    console.log('- 用户名:', backendUser.username);
    console.log('- 金币数量:', backendUser.coins);
    console.log('- 拥有物品总数:', backendUser.ownedItems?.length || 0);
    console.log('- 完整拥有物品列表:', backendUser.ownedItems);

    // 3. 分析拼图素材相关物品
    const puzzleAssets = backendUser.ownedItems?.filter((item: string) => 
      item.includes('puzzle_image') || 
      item.includes('puzzle_') ||
      item.includes('decoration_')
    ) || [];

    console.log('🧩 拼图素材分析:');
    console.log('- 拼图相关物品数量:', puzzleAssets.length);
    console.log('- 拼图相关物品列表:', puzzleAssets);

    // 4. 检查特定拼图素材
    const testPuzzleAssets = ['puzzle_image_1', 'puzzle_image_2', 'puzzle_image_3'];
    console.log('🎯 特定拼图素材检查:');
    
    testPuzzleAssets.forEach(assetId => {
      const hasOriginal = backendUser.ownedItems?.includes(assetId);
      const hasDecorationPrefix = backendUser.ownedItems?.includes(`decoration_${assetId}`);
      const hasPuzzlePrefix = backendUser.ownedItems?.includes(`puzzle_${assetId}`);
      
      console.log(`- ${assetId}:`);
      console.log(`  原始ID: ${hasOriginal ? '✅' : '❌'}`);
      console.log(`  decoration_前缀: ${hasDecorationPrefix ? '✅' : '❌'}`);
      console.log(`  puzzle_前缀: ${hasPuzzlePrefix ? '✅' : '❌'}`);
    });

    // 5. 模拟购买一个拼图素材进行测试
    console.log('🛒 测试购买拼图素材...');
    const testItemId = 'puzzle_image_test';
    const purchaseResponse = await apiService.acquireItem('decoration', testItemId, 0);
    
    if (purchaseResponse.success) {
      console.log('✅ 测试购买成功:', purchaseResponse.data);
      
      // 重新获取用户数据查看变化
      const updatedUserResponse = await apiService.getUserProfile();
      if (updatedUserResponse.success && updatedUserResponse.data) {
        const updatedUser = updatedUserResponse.data.user;
        console.log('📋 购买后的拥有物品:', updatedUser.ownedItems);
        
        const hasTestItem = updatedUser.ownedItems?.includes(testItemId);
        console.log(`测试物品 ${testItemId} 是否存在:`, hasTestItem ? '✅' : '❌');
      }
    } else {
      console.error('❌ 测试购买失败:', purchaseResponse.error);
    }

    // 6. 建议修复方案
    console.log('💡 诊断建议:');
    if (puzzleAssets.length === 0) {
      console.log('- 后端没有任何拼图素材记录，可能是购买同步失败');
      console.log('- 建议检查商店购买流程的后端同步代码');
    } else {
      console.log('- 后端有拼图素材记录，可能是前端解锁检查逻辑问题');
      console.log('- 建议检查 AssetLibrary 中的 isPuzzleAssetUnlocked 函数');
    }

    return {
      backendOwnedItems: backendUser.ownedItems || [],
      puzzleAssets,
      testPurchaseSuccess: purchaseResponse.success
    };

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
    return null;
  }
};

// 简化版本：只检查当前数据不进行测试购买
export const checkPuzzleAssetData = async () => {
  console.log('🔍 快速检查拼图素材数据...');
  
  try {
    const userResponse = await apiService.getUserProfile();
    
    if (!userResponse.success || !userResponse.data) {
      console.error('❌ 无法获取用户数据');
      return null;
    }

    const user = userResponse.data.user;
    const ownedItems = user.ownedItems || [];
    const puzzleItems = ownedItems.filter((item: string) => 
      item.includes('puzzle') || item.includes('decoration')
    );

    console.log('📊 数据总览:');
    console.log('- 拥有物品总数:', ownedItems.length);
    console.log('- 拼图/装饰相关:', puzzleItems.length);
    console.log('- 详细列表:', puzzleItems);

    return {
      totalItems: ownedItems.length,
      puzzleItems,
      allItems: ownedItems
    };

  } catch (error) {
    console.error('❌ 检查失败:', error);
    return null;
  }
};
