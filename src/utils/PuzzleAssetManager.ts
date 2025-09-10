// 拼图素材持久化管理器
// 用于统一处理拼图素材的购买、存储和解锁逻辑

import { apiService } from '../services/apiService';

export class PuzzleAssetManager {
  
  /**
   * 标准化拼图素材ID格式
   * 确保前后端使用一致的ID格式
   */
  static normalizeAssetId(assetId: string): string {
    // 移除所有前缀，获取核心ID
    const baseId = assetId
      .replace(/^puzzle_/, '')
      .replace(/^decoration_/, '')
      .replace(/^asset_/, '');
    
    // 返回标准格式：puzzle_image_X
    if (baseId.startsWith('image_')) {
      return `puzzle_${baseId}`;
    } else {
      return `puzzle_image_${baseId}`;
    }
  }

  /**
   * 生成所有可能的ID变体
   * 用于兼容各种存储格式
   */
  static getAssetIdVariants(assetId: string): string[] {
    const baseId = assetId
      .replace(/^puzzle_/, '')
      .replace(/^decoration_/, '')
      .replace(/^asset_/, '');
    
    const variants = [
      assetId,                           // 原始ID
      `puzzle_${baseId}`,                // puzzle_前缀
      `decoration_${assetId}`,           // decoration_前缀
      `decoration_${baseId}`,            // decoration_+基础ID
      `asset_${baseId}`,                 // asset_前缀
      baseId                             // 纯基础ID
    ];

    // 如果是image格式，添加更多变体
    if (baseId.includes('image_')) {
      const imageNumber = baseId.replace('image_', '');
      variants.push(
        `puzzle_image_${imageNumber}`,
        `decoration_puzzle_image_${imageNumber}`,
        `asset_image_${imageNumber}`,
        imageNumber
      );
    }

    // 去重并返回
    return [...new Set(variants)];
  }

  /**
   * 检查用户是否拥有指定的拼图素材
   */
  static isAssetUnlocked(assetId: string, userOwnedItems: string[]): boolean {
    const variants = this.getAssetIdVariants(assetId);
    
    for (const variant of variants) {
      if (userOwnedItems.includes(variant)) {
        console.log(`✅ 拼图素材已解锁: ${assetId} (匹配变体: ${variant})`);
        return true;
      }
    }
    
    console.log(`❌ 拼图素材未解锁: ${assetId}`);
    console.log('🔍 检查的变体:', variants);
    console.log('📦 用户拥有的物品:', userOwnedItems);
    return false;
  }

  /**
   * 购买拼图素材并确保数据持久化
   */
  static async purchasePuzzleAsset(assetId: string, price: number): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log(`🛒 开始购买拼图素材: ${assetId}, 价格: ${price}`);
      
      // 1. 调用后端购买接口（使用decoration类型，这是现有的映射）
      const purchaseResponse = await apiService.acquireItem('decoration', assetId, price);
      
      if (!purchaseResponse.success) {
        return {
          success: false,
          message: `购买失败: ${purchaseResponse.error}`
        };
      }

      console.log('✅ 后端购买成功:', purchaseResponse.data);

      // 2. 立即验证购买结果
      const userResponse = await apiService.getUserProfile();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          message: '无法验证购买结果，请刷新页面检查'
        };
      }

      const userOwnedItems = userResponse.data.user.ownedItems || [];
      const isNowUnlocked = this.isAssetUnlocked(assetId, userOwnedItems);

      if (!isNowUnlocked) {
        console.warn('⚠️ 购买成功但素材仍未解锁，尝试手动同步...');
        
        // 3. 如果购买后仍未解锁，手动添加到用户的ownedItems
        const updatedOwnedItems = [...userOwnedItems, assetId];
        const updateResponse = await apiService.updateUserProfile({
          ownedItems: updatedOwnedItems
        });

        if (updateResponse.success) {
          console.log('✅ 手动同步成功');
          return {
            success: true,
            message: `成功购买 ${assetId}！`,
            data: { assetId, addedToOwnedItems: true }
          };
        } else {
          return {
            success: false,
            message: '购买成功但同步失败，请联系管理员'
          };
        }
      }

      return {
        success: true,
        message: `成功购买 ${assetId}！`,
        data: { assetId, verified: true }
      };

    } catch (error) {
      console.error('❌ 购买拼图素材时发生错误:', error);
      return {
        success: false,
        message: `购买过程中发生错误: ${error}`
      };
    }
  }

  /**
   * 强制同步所有拼图素材的解锁状态
   * 用于修复持久化问题
   */
  static async syncPuzzleAssets(): Promise<{
    success: boolean;
    message: string;
    syncedAssets?: string[];
  }> {
    try {
      console.log('🔄 开始同步拼图素材解锁状态...');
      
      const userResponse = await apiService.getUserProfile();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          message: '无法获取用户数据'
        };
      }

      const user = userResponse.data.user;
      const ownedItems = user.ownedItems || [];
      
      // 找出所有可能的拼图素材相关物品
      const puzzleRelatedItems = ownedItems.filter((item: string) => 
        item.includes('puzzle') || 
        item.includes('decoration') ||
        item.includes('image_')
      );

      console.log('🧩 找到拼图相关物品:', puzzleRelatedItems);

      // 标准化所有拼图素材ID
      const standardizedAssets = puzzleRelatedItems
        .map(item => this.normalizeAssetId(item))
        .filter((item, index, arr) => arr.indexOf(item) === index); // 去重

      console.log('📝 标准化后的素材ID:', standardizedAssets);

      // 确保所有标准化的ID都在ownedItems中
      const missingAssets = standardizedAssets.filter(asset => !ownedItems.includes(asset));
      
      if (missingAssets.length > 0) {
        console.log('➕ 添加缺失的标准化ID:', missingAssets);
        
        const updatedOwnedItems = [...ownedItems, ...missingAssets];
        const updateResponse = await apiService.updateUserProfile({
          ownedItems: updatedOwnedItems
        });

        if (updateResponse.success) {
          return {
            success: true,
            message: `同步完成，添加了 ${missingAssets.length} 个标准化素材ID`,
            syncedAssets: missingAssets
          };
        } else {
          return {
            success: false,
            message: '同步失败，无法更新用户数据'
          };
        }
      }

      return {
        success: true,
        message: '所有拼图素材已正确同步',
        syncedAssets: []
      };

    } catch (error) {
      console.error('❌ 同步拼图素材时发生错误:', error);
      return {
        success: false,
        message: `同步失败: ${error}`
      };
    }
  }

  /**
   * 获取所有已解锁的拼图素材列表
   */
  static async getUnlockedAssets(): Promise<string[]> {
    try {
      const userResponse = await apiService.getUserProfile();
      if (!userResponse.success || !userResponse.data) {
        return [];
      }

      const ownedItems = userResponse.data.user.ownedItems || [];
      const testAssets = ['puzzle_image_1', 'puzzle_image_2', 'puzzle_image_3'];
      
      return testAssets.filter(asset => this.isAssetUnlocked(asset, ownedItems));
    } catch (error) {
      console.error('❌ 获取已解锁素材失败:', error);
      return [];
    }
  }
}
