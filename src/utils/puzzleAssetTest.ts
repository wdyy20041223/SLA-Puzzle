/**
 * 拼图素材购买同步测试脚本
 * 用于验证购买的拼图素材是否正确显示在素材库中
 */

import { apiService } from '../services/apiService';

// 测试用户购买拼图素材后的数据同步
export const testPuzzleAssetSync = async () => {
  console.log('🧪 开始测试拼图素材购买同步...');

  try {
    // 1. 获取当前用户信息
    const userResponse = await apiService.getUserProfile();
    if (!userResponse.success || !userResponse.data) {
      console.error('❌ 获取用户信息失败:', userResponse.error);
      return;
    }

    const user = userResponse.data.user;
    console.log('📊 当前用户信息:');
    console.log('- 用户ID:', user.id);
    console.log('- 金币数量:', user.coins);
    console.log('- 拥有物品:', user.ownedItems);

    // 2. 检查拼图素材相关物品
    const puzzleAssets = user.ownedItems?.filter((item: string) =>
      item.includes('puzzle_image')
    ) || [];

    console.log('🎨 拥有的拼图素材:', puzzleAssets);

    if (puzzleAssets.length === 0) {
      console.log('ℹ️ 用户还没有购买任何拼图素材');
      return;
    }

    // 3. 验证每个拼图素材是否能正确映射
    const shopPuzzleAssets: Record<string, { name: string; category: string }> = {
      'puzzle_image_1': { name: '森林花园', category: '自定义' },
      'puzzle_image_2': { name: '黄昏日落', category: '自定义' },
      'puzzle_image_3': { name: '玫瑰花园', category: '自定义' },
    };

    console.log('🔍 验证素材映射:');
    puzzleAssets.forEach((assetId: string) => {
      const asset = shopPuzzleAssets[assetId];
      if (asset) {
        console.log(`✅ ${assetId} -> ${asset.name} (${asset.category})`);
      } else {
        console.log(`❌ ${assetId} -> 映射不存在`);
      }
    });

    console.log('✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};
