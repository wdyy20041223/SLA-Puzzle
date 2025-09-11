// 拼图素材管理器测试脚本
// 这个测试文件完全独立，不依赖任何外部模块

// 模拟API服务
const mockApiService = {
  acquireItem: async (type, itemId, price) => {
    console.log(`📤 模拟API调用: acquireItem(${type}, ${itemId}, ${price})`);
    // 模拟成功响应
    return {
      success: true,
      data: {
        itemId,
        type,
        price,
        timestamp: new Date().toISOString()
      }
    };
  },
  
  getUserProfile: async () => {
    console.log('📤 模拟API调用: getUserProfile()');
    // 返回模拟用户数据
    return {
      success: true,
      data: {
        user: {
          ownedItems: mockUserOwnedItems
        }
      }
    };
  },
  
  updateUserProfile: async (profileData) => {
    console.log('📤 模拟API调用: updateUserProfile()');
    // 模拟更新成功
    if (profileData.ownedItems) {
      mockUserOwnedItems = profileData.ownedItems;
    }
    return {
      success: true,
      data: {
        updated: true,
        timestamp: new Date().toISOString()
      }
    };
  }
};

// 模拟用户拥有的物品
let mockUserOwnedItems = ['puzzle_image_1', 'decoration_puzzle_2', 'image_3'];

// 模拟console.log和console.error以便测试
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const consoleOutputs = [];

// 覆盖console方法以捕获输出
console.log = (...args) => {
  consoleOutputs.push({ type: 'log', args });
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  consoleOutputs.push({ type: 'error', args });
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  consoleOutputs.push({ type: 'warn', args });
  originalConsoleWarn.apply(console, args);
};

// 定义PuzzleAssetManager类（完全复制原始实现，但使用模拟API）
class PuzzleAssetManager {
  
  /**
   * 标准化拼图素材ID格式
   * 确保前后端使用一致的ID格式
   */
  static normalizeAssetId(assetId) {
    // 移除所有前缀，获取核心ID
    let baseId = assetId
      .replace(/^puzzle_/, '')
      .replace(/^decoration_/, '')
      .replace(/^asset_/, '');
    
    // 如果基础ID中还包含puzzle_前缀，再次移除
    baseId = baseId.replace(/^puzzle_/, '');
    
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
  static getAssetIdVariants(assetId) {
    // 移除所有前缀，获取核心ID
    const baseId = assetId
      .replace(/^puzzle_/, '')
      .replace(/^decoration_/, '')
      .replace(/^asset_/, '');
    
    // 确保baseId是干净的，移除任何嵌套的前缀
    const cleanBaseId = baseId.replace(/^puzzle_/, '').replace(/^image_/, '');
    
    const variants = [
      assetId,                           // 原始ID
      `puzzle_${baseId}`,                // puzzle_前缀
      `decoration_${assetId}`,           // decoration_前缀
      `decoration_${baseId}`,            // decoration_+基础ID
      `asset_${baseId}`,                 // asset_前缀
      baseId                             // 纯基础ID
    ];

    // 特殊处理：如果assetId是puzzle_image_X格式，也添加decoration_puzzle_X变体
    if (assetId.startsWith('puzzle_image_')) {
      const numberPart = assetId.replace('puzzle_image_', '');
      variants.push(
        `decoration_puzzle_${numberPart}`
      );
    }

    // 如果是image格式或数字，添加更多变体
    if (baseId.includes('image_') || /^\d+$/.test(cleanBaseId)) {
      const imageNumber = baseId.includes('image_') ? baseId.replace('image_', '') : cleanBaseId;
      variants.push(
        `puzzle_image_${imageNumber}`,
        `decoration_puzzle_image_${imageNumber}`,
        `asset_image_${imageNumber}`,
        `image_${imageNumber}`,
        imageNumber
      );
    }

    // 去重并返回
    return [...new Set(variants)];
  }

  /**
   * 检查用户是否拥有指定的拼图素材
   */
  static isAssetUnlocked(assetId, userOwnedItems) {
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
  static async purchasePuzzleAsset(assetId, price) {
    try {
      console.log(`🛒 开始购买拼图素材: ${assetId}, 价格: ${price}`);
      
      // 1. 调用后端购买接口（使用decoration类型，这是现有的映射）
      const purchaseResponse = await mockApiService.acquireItem('decoration', assetId, price);
      
      if (!purchaseResponse.success) {
        return {
          success: false,
          message: `购买失败: ${purchaseResponse.error}`
        };
      }

      console.log('✅ 后端购买成功:', purchaseResponse.data);

      // 2. 立即验证购买结果
      const userResponse = await mockApiService.getUserProfile();
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
        const updateResponse = await mockApiService.updateUserProfile({
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
  static async syncPuzzleAssets() {
    try {
      console.log('🔄 开始同步拼图素材解锁状态...');
      
      const userResponse = await mockApiService.getUserProfile();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          message: '无法获取用户数据'
        };
      }

      const user = userResponse.data.user;
      const ownedItems = user.ownedItems || [];
      
      // 找出所有可能的拼图素材相关物品
      const puzzleRelatedItems = ownedItems.filter((item) => 
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
        const updateResponse = await mockApiService.updateUserProfile({
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
  static async getUnlockedAssets() {
    try {
      const userResponse = await mockApiService.getUserProfile();
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

// 测试函数
async function runTests() {
  console.log('\n====================================');
  console.log('       🧩 拼图素材管理器测试       ');
  console.log('====================================\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // 测试1: 测试ID标准化功能
  function testNormalizeAssetId() {
    console.log('\n🔍 测试1: 测试ID标准化功能');
    const testCases = [
      { input: 'image_1', expected: 'puzzle_image_1' },
      { input: 'puzzle_image_2', expected: 'puzzle_image_2' },
      { input: 'decoration_puzzle_3', expected: 'puzzle_image_3' },
      { input: 'asset_image_4', expected: 'puzzle_image_4' },
      { input: '5', expected: 'puzzle_image_5' }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = PuzzleAssetManager.normalizeAssetId(test.input);
      console.log(`  测试输入: ${test.input}, 预期: ${test.expected}, 实际: ${result}`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: ${test.input} 标准化结果不匹配`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试1通过: 所有ID标准化功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试1失败: ID标准化功能存在问题');
    }
  }
  
  // 测试2: 测试ID变体生成功能
  function testAssetIdVariants() {
    console.log('\n🔍 测试2: 测试ID变体生成功能');
    const testCases = [
      {
        input: 'image_1', 
        expectedCount: 10, // 更新为实际会生成的变体数量
        expectedVariants: ['image_1', 'puzzle_image_1', 'decoration_image_1', 'asset_image_1', 'decoration_puzzle_image_1', '1']
      },
      {
        input: 'puzzle_2', 
        expectedCount: 6, // 应该生成6个不同的变体
        expectedVariants: ['puzzle_2', 'decoration_puzzle_2', 'decoration_2', 'asset_2', '2']
      }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = PuzzleAssetManager.getAssetIdVariants(test.input);
      console.log(`  测试输入: ${test.input}, 生成变体数量: ${result.length}`);
      console.log(`  生成的变体: ${result.join(', ')}`);
      
      // 检查是否包含所有必要的变体（去重后）
      const uniqueExpected = [...new Set(test.expectedVariants)];
      for (const variant of uniqueExpected) {
        if (!result.includes(variant)) {
          passed = false;
          console.error(`  ❌ 测试失败: ${test.input} 缺少预期变体: ${variant}`);
        }
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试2通过: 所有ID变体生成功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试2失败: ID变体生成功能存在问题');
    }
  }
  
  // 测试3: 测试素材解锁检查功能
  function testIsAssetUnlocked() {
    console.log('\n🔍 测试3: 测试素材解锁检查功能');
    const userOwnedItems = ['puzzle_image_1', 'decoration_puzzle_2', 'image_3'];
    const testCases = [
      { assetId: 'puzzle_image_1', expected: true, description: '标准格式素材已解锁' },
      { assetId: 'puzzle_image_2', expected: true, description: '变体格式素材已解锁' },
      { assetId: 'puzzle_image_3', expected: true, description: '原始格式为image_X的素材已解锁' },
      { assetId: 'puzzle_image_4', expected: false, description: '未解锁的素材' }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = PuzzleAssetManager.isAssetUnlocked(test.assetId, userOwnedItems);
      console.log(`  测试: ${test.description}, 资产ID: ${test.assetId}, 预期: ${test.expected}, 实际: ${result}`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: ${test.description}`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试3通过: 所有素材解锁检查功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试3失败: 素材解锁检查功能存在问题');
    }
  }
  
  // 测试4: 测试购买素材功能
  async function testPurchasePuzzleAsset() {
    console.log('\n🔍 测试4: 测试购买素材功能');
    
    try {
      // 重置模拟数据
      mockUserOwnedItems = ['puzzle_image_1', 'decoration_puzzle_2', 'image_3'];
      
      // 测试购买未解锁的素材
      const result = await PuzzleAssetManager.purchasePuzzleAsset('puzzle_image_4', 100);
      console.log(`  购买结果: ${result.success ? '成功' : '失败'}, 消息: ${result.message}`);
      
      if (result.success && mockUserOwnedItems.includes('puzzle_image_4')) {
        testsPassed++;
        console.log('✅ 测试4通过: 素材购买功能正常');
      } else {
        testsFailed++;
        console.error('❌ 测试4失败: 素材购买功能存在问题');
        console.error('  用户拥有的物品:', mockUserOwnedItems);
      }
    } catch (error) {
      testsFailed++;
      console.error('❌ 测试4抛出异常:', error);
    }
  }
  
  // 测试5: 测试同步素材功能
  async function testSyncPuzzleAssets() {
    console.log('\n🔍 测试5: 测试同步素材功能');
    
    try {
      // 重置模拟数据，包含一些非标准化的ID
      mockUserOwnedItems = ['image_5', 'decoration_puzzle_6'];
      
      const result = await PuzzleAssetManager.syncPuzzleAssets();
      console.log(`  同步结果: ${result.success ? '成功' : '失败'}, 消息: ${result.message}`);
      console.log(`  同步的素材数量: ${result.syncedAssets ? result.syncedAssets.length : 0}`);
      
      // 检查是否添加了标准化的ID
      const hasNormalized5 = mockUserOwnedItems.includes('puzzle_image_5');
      const hasNormalized6 = mockUserOwnedItems.includes('puzzle_image_6'); // 更新为实际的标准化格式
      
      console.log(`  标准化ID puzzle_image_5 已添加: ${hasNormalized5}`);
      console.log(`  标准化ID puzzle_image_6 已添加: ${hasNormalized6}`);
      
      if (result.success && hasNormalized5 && hasNormalized6) {
        testsPassed++;
        console.log('✅ 测试5通过: 素材同步功能正常');
      } else {
        testsFailed++;
        console.error('❌ 测试5失败: 素材同步功能存在问题');
        console.error('  当前用户拥有的物品:', mockUserOwnedItems);
      }
    } catch (error) {
      testsFailed++;
      console.error('❌ 测试5抛出异常:', error);
    }
  }
  
  // 测试6: 测试获取已解锁素材列表
  async function testGetUnlockedAssets() {
    console.log('\n🔍 测试6: 测试获取已解锁素材列表');
    
    try {
      // 设置已知的用户数据
      mockUserOwnedItems = ['puzzle_image_1', 'puzzle_image_3', 'image_5'];
      
      const result = await PuzzleAssetManager.getUnlockedAssets();
      console.log(`  获取的已解锁素材: ${result.join(', ')}`);
      
      // 预期结果应该包含puzzle_image_1和puzzle_image_3
      const expected = ['puzzle_image_1', 'puzzle_image_3'];
      const hasAllExpected = expected.every(item => result.includes(item));
      
      console.log(`  包含所有预期素材: ${hasAllExpected}`);
      
      if (hasAllExpected && result.length === expected.length) {
        testsPassed++;
        console.log('✅ 测试6通过: 获取已解锁素材功能正常');
      } else {
        testsFailed++;
        console.error('❌ 测试6失败: 获取已解锁素材功能存在问题');
        console.error('  预期:', expected);
        console.error('  实际:', result);
      }
    } catch (error) {
      testsFailed++;
      console.error('❌ 测试6抛出异常:', error);
    }
  }
  
  // 运行所有测试
  testNormalizeAssetId();
  testAssetIdVariants();
  testIsAssetUnlocked();
  await testPurchasePuzzleAsset();
  await testSyncPuzzleAssets();
  await testGetUnlockedAssets();
  
  // 打印测试总结
  console.log('\n====================================');
  console.log(`  测试总结: 共 ${testsPassed + testsFailed} 个测试，通过 ${testsPassed} 个，失败 ${testsFailed} 个`);
  console.log('====================================\n');
  
  // 恢复原始console方法
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  return testsFailed === 0;
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
});