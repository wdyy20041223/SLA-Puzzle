// 简单的拼图素材数据流测试工具
// 完全参照头像框的成功模式

import { apiService } from '../services/apiService';

export const testPuzzleAssetDataFlow = async () => {
  console.log('🔍 测试拼图素材数据流（参照头像框模式）...');
  
  try {
    // 1. 获取当前用户数据
    const userResponse = await apiService.getUserProfile();
    if (!userResponse.success || !userResponse.data) {
      console.error('❌ 无法获取用户数据');
      return;
    }

    const user = userResponse.data.user;
    const ownedItems = user.ownedItems || [];
    
    console.log('👤 当前用户拥有的所有物品:');
    ownedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });

    // 2. 测试拼图素材检查逻辑（参照头像框checkFrameOwnership函数）
    const testAssetId = 'puzzle_image_1';
    
    console.log(`\n🧩 测试拼图素材: ${testAssetId}`);
    
    // 检查原始ID
    const hasOriginal = ownedItems.includes(testAssetId);
    console.log(`- 原始ID (${testAssetId}): ${hasOriginal ? '✅' : '❌'}`);
    
    // 检查带decoration_前缀的ID（参照头像框的decoration_前缀检查）
    const decorationId = `decoration_${testAssetId}`;
    const hasDecoration = ownedItems.includes(decorationId);
    console.log(`- decoration_前缀 (${decorationId}): ${hasDecoration ? '✅' : '❌'}`);
    
    // 检查带puzzle_前缀的ID（兼容性）
    const puzzleId = `puzzle_${testAssetId}`;
    const hasPuzzle = ownedItems.includes(puzzleId);
    console.log(`- puzzle_前缀 (${puzzleId}): ${hasPuzzle ? '✅' : '❌'}`);
    
    // 最终结果
    const isUnlocked = hasOriginal || hasDecoration || hasPuzzle;
    console.log(`\n🎯 最终解锁状态: ${isUnlocked ? '✅ 已解锁' : '❌ 已锁定'}`);

    // 3. 如果没有解锁，模拟购买测试
    if (!isUnlocked) {
      console.log('\n🛒 模拟购买测试...');
      
      // 调用购买接口（使用decoration类型，与商店映射一致）
      const purchaseResponse = await apiService.acquireItem('decoration', testAssetId, 0);
      
      if (purchaseResponse.success) {
        console.log('✅ 购买接口调用成功');
        
        // 重新获取用户数据
        const updatedUserResponse = await apiService.getUserProfile();
        if (updatedUserResponse.success && updatedUserResponse.data) {
          const updatedUser = updatedUserResponse.data.user;
          const updatedOwnedItems = updatedUser.ownedItems || [];
          
          console.log('📋 购买后的拥有物品:');
          updatedOwnedItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
          });
          
          // 重新检查解锁状态
          const newHasOriginal = updatedOwnedItems.includes(testAssetId);
          const newHasDecoration = updatedOwnedItems.includes(`decoration_${testAssetId}`);
          const newHasPuzzle = updatedOwnedItems.includes(`puzzle_${testAssetId}`);
          const newIsUnlocked = newHasOriginal || newHasDecoration || newHasPuzzle;
          
          console.log(`\n🎯 购买后解锁状态: ${newIsUnlocked ? '✅ 已解锁' : '❌ 仍然锁定'}`);
          
          if (newIsUnlocked) {
            console.log('🎉 数据流测试成功！');
          } else {
            console.log('⚠️ 购买成功但仍未解锁，需要进一步检查');
          }
        }
      } else {
        console.error('❌ 购买接口调用失败:', purchaseResponse.error);
      }
    } else {
      console.log('🎉 素材已解锁，数据流正常');
    }

    return {
      assetId: testAssetId,
      originallyUnlocked: isUnlocked,
      ownedItems: ownedItems
    };

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return null;
  }
};

// 快速检查函数：完全参照头像框的检查逻辑
export const checkPuzzleAssetUnlocked = (assetId: string, ownedItems: string[]): boolean => {
  console.log(`🔍 检查拼图素材解锁状态: ${assetId}`);
  console.log('📦 用户拥有的物品:', ownedItems);
  
  // 完全参照Profile.tsx中的checkFrameOwnership函数
  // 检查原始ID
  if (ownedItems.includes(assetId)) {
    console.log(`✅ 找到原始ID: ${assetId}`);
    return true;
  }
  
  // 检查带decoration_前缀的ID（因为商店将拼图素材映射为decoration类型）
  if (ownedItems.includes(`decoration_${assetId}`)) {
    console.log(`✅ 找到decoration_前缀ID: decoration_${assetId}`);
    return true;
  }
  
  // 检查带puzzle_前缀的ID（兼容性检查）
  if (!assetId.startsWith('puzzle_') && ownedItems.includes(`puzzle_${assetId}`)) {
    console.log(`✅ 找到puzzle_前缀ID: puzzle_${assetId}`);
    return true;
  }
  
  console.log(`❌ 未找到解锁记录: ${assetId}`);
  return false;
};
