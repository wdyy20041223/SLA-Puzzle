/**
 * 拼图素材购买数据库同步测试工具
 * 用于验证拼图素材购买后是否正确同步到后端数据库
 */

// 在浏览器控制台中运行此代码来测试拼图素材购买同步功能

console.log('=== 拼图素材购买数据库同步测试工具 ===');

// 1. 检查当前用户的购买状态
function checkUserPurchaseStatus() {
  console.log('\n📊 检查用户购买状态:');

  // 从localStorage获取用户信息
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (!userData.ownedItems) {
    console.log('❌ 用户数据中没有ownedItems字段');
    return null;
  }

  const ownedItems = userData.ownedItems;
  console.log('当前拥有的物品:', ownedItems);

  // 检查拼图素材
  const puzzleAssets = ownedItems.filter(item => item.startsWith('puzzle_image_'));
  console.log('拥有的拼图素材:', puzzleAssets);

  return { ownedItems, puzzleAssets };
}

// 2. 模拟购买拼图素材
async function simulatePuzzlePurchase(itemId) {
  console.log(`\n🛒 模拟购买拼图素材: ${itemId}`);

  try {
    // 导入API服务
    const { apiService } = await import('../services/apiService.js');

    // 获取当前用户信息
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentCoins = userData.coins || 0;

    console.log(`当前金币: ${currentCoins}`);

    // 模拟购买请求
    const response = await apiService.acquireItem('puzzle_asset', itemId, 100);

    if (response.success) {
      console.log('✅ 购买成功:', response.data);

      // 更新本地用户数据
      const updatedUser = {
        ...userData,
        coins: currentCoins - 100,
        ownedItems: [...(userData.ownedItems || []), itemId]
      };

      localStorage.setItem('userData', JSON.stringify(updatedUser));
      console.log('✅ 本地数据已更新');

      return true;
    } else {
      console.error('❌ 购买失败:', response.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 购买过程中发生错误:', error);
    return false;
  }
}

// 3. 验证后端同步
async function verifyBackendSync() {
  console.log('\n🔄 验证后端数据同步:');

  try {
    const { apiService } = await import('../services/apiService.js');

    const response = await apiService.getUserProfile();

    if (response.success && response.data?.user) {
      const backendUser = response.data.user;
      const backendOwnedItems = backendUser.ownedItems || [];

      console.log('后端拥有的物品:', backendOwnedItems);

      const backendPuzzleAssets = backendOwnedItems.filter(item => item.startsWith('puzzle_image_'));
      console.log('后端拥有的拼图素材:', backendPuzzleAssets);

      return { backendOwnedItems, backendPuzzleAssets };
    } else {
      console.error('❌ 获取后端用户数据失败:', response.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 验证后端同步时发生错误:', error);
    return null;
  }
}

// 4. 比较本地和后端数据
function compareLocalAndBackend(localData, backendData) {
  console.log('\n⚖️ 比较本地和后端数据:');

  if (!localData || !backendData) {
    console.log('❌ 数据不完整，无法比较');
    return;
  }

  const localPuzzleAssets = localData.puzzleAssets;
  const backendPuzzleAssets = backendData.backendPuzzleAssets;

  console.log('本地拼图素材:', localPuzzleAssets);
  console.log('后端拼图素材:', backendPuzzleAssets);

  // 检查差异
  const missingInBackend = localPuzzleAssets.filter(item => !backendPuzzleAssets.includes(item));
  const extraInBackend = backendPuzzleAssets.filter(item => !localPuzzleAssets.includes(item));

  if (missingInBackend.length === 0 && extraInBackend.length === 0) {
    console.log('✅ 本地和后端数据完全同步');
  } else {
    console.log('⚠️ 数据同步存在差异:');
    if (missingInBackend.length > 0) {
      console.log('后端缺失的拼图素材:', missingInBackend);
    }
    if (extraInBackend.length > 0) {
      console.log('后端多出的拼图素材:', extraInBackend);
    }
  }
}

// 5. 运行完整测试
async function runFullTest() {
  console.log('🚀 开始拼图素材购买数据库同步测试...\n');

  // 步骤1: 检查当前状态
  const localData = checkUserPurchaseStatus();

  // 步骤2: 模拟购买
  const purchaseSuccess = await simulatePuzzlePurchase('puzzle_image_test');
  if (!purchaseSuccess) {
    console.log('❌ 购买测试失败，停止后续测试');
    return;
  }

  // 步骤3: 等待同步
  console.log('\n⏳ 等待数据同步...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 步骤4: 验证后端同步
  const backendData = await verifyBackendSync();

  // 步骤5: 比较数据
  const updatedLocalData = checkUserPurchaseStatus();
  compareLocalAndBackend(updatedLocalData, backendData);

  console.log('\n=== 测试完成 ===');
  console.log('💡 测试结果说明:');
  console.log('- 如果看到"数据完全同步"，说明修复成功');
  console.log('- 如果看到数据差异，说明后端同步仍有问题');
}

// 导出测试函数
window.puzzlePurchaseTest = {
  checkStatus: checkUserPurchaseStatus,
  simulatePurchase: simulatePuzzlePurchase,
  verifySync: verifyBackendSync,
  compareData: compareLocalAndBackend,
  runFull: runFullTest
};

// 自动运行基础检查
checkUserPurchaseStatus();

console.log('\n📚 测试工具使用方法:');
console.log('- puzzlePurchaseTest.runFull() - 运行完整测试');
console.log('- puzzlePurchaseTest.checkStatus() - 检查当前购买状态');
console.log('- puzzlePurchaseTest.simulatePurchase(itemId) - 模拟购买指定物品');
console.log('- puzzlePurchaseTest.verifySync() - 验证后端同步');
console.log('- puzzlePurchaseTest.compareData(localData, backendData) - 比较本地和后端数据');
