/**
 * 修复效果验证工具
 * 用于验证分离补偿问题是否已解决
 */

// 在浏览器控制台中使用
window.rewardFixVerifier = {
  // 监控API调用
  apiCalls: [],
  originalFetch: null,
  
  // 开始监控
  startMonitoring() {
    console.log('🔍 开始监控API调用...');
    this.apiCalls = [];
    
    // 拦截fetch调用
    if (!this.originalFetch) {
      this.originalFetch = window.fetch;
    }
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      const result = await this.originalFetch.apply(window, args);
      
      // 监控奖励相关的API调用
      if (url.includes('/api/users/rewards')) {
        const requestBody = options?.body ? JSON.parse(options.body) : null;
        this.apiCalls.push({
          timestamp: new Date().toISOString(),
          url,
          method: options?.method || 'GET',
          body: requestBody,
          status: result.status
        });
        
        console.log('📡 检测到奖励API调用:', {
          时间: new Date().toLocaleTimeString(),
          方法: options?.method || 'GET',
          请求体: requestBody,
          状态: result.status
        });
        
        // 检查是否出现分离调用
        this.checkSeparatedCalls();
      }
      
      return result;
    };
    
    console.log('✅ API监控已启动');
  },
  
  // 检查分离调用
  checkSeparatedCalls() {
    const recentCalls = this.apiCalls.slice(-2);
    if (recentCalls.length === 2) {
      const [first, second] = recentCalls;
      const timeDiff = new Date(second.timestamp) - new Date(first.timestamp);
      
      if (timeDiff < 5000) { // 5秒内的连续调用
        const firstHasCoins = first.body?.coins !== 0;
        const firstHasExp = first.body?.experience !== 0;
        const secondHasCoins = second.body?.coins !== 0;
        const secondHasExp = second.body?.experience !== 0;
        
        // 检查是否为分离模式
        if ((firstHasCoins && !firstHasExp && !secondHasCoins && secondHasExp) ||
            (!firstHasCoins && firstHasExp && secondHasCoins && !secondHasExp)) {
          console.error('⚠️ 检测到分离的补偿调用!');
          console.log('第一次调用:', first.body);
          console.log('第二次调用:', second.body);
          console.log('时间间隔:', timeDiff, 'ms');
        }
      }
    }
  },
  
  // 停止监控
  stopMonitoring() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      console.log('🔍 API监控已停止');
    }
  },
  
  // 生成报告
  generateReport() {
    console.group('📊 API调用分析报告');
    
    const rewardCalls = this.apiCalls.filter(call => call.url.includes('/api/users/rewards'));
    console.log(`总奖励API调用次数: ${rewardCalls.length}`);
    
    if (rewardCalls.length === 0) {
      console.log('✅ 未检测到任何奖励更新调用');
      console.groupEnd();
      return;
    }
    
    // 分析调用模式
    const gameCompletions = [];
    let currentGame = null;
    
    rewardCalls.forEach((call, index) => {
      if (index === 0 || new Date(call.timestamp) - new Date(rewardCalls[index-1].timestamp) > 10000) {
        // 新的游戏完成
        if (currentGame) gameCompletions.push(currentGame);
        currentGame = { calls: [], totalCoins: 0, totalExp: 0 };
      }
      
      currentGame.calls.push(call);
      currentGame.totalCoins += call.body?.coins || 0;
      currentGame.totalExp += call.body?.experience || 0;
    });
    
    if (currentGame) gameCompletions.push(currentGame);
    
    console.log(`检测到 ${gameCompletions.length} 次游戏完成的奖励更新:`);
    
    gameCompletions.forEach((game, index) => {
      console.log(`游戏 ${index + 1}:`);
      console.log(`  调用次数: ${game.calls.length}`);
      console.log(`  总金币: ${game.totalCoins}`);
      console.log(`  总经验: ${game.totalExp}`);
      
      if (game.calls.length > 1) {
        console.warn(`  ⚠️ 多次调用 (${game.calls.length} 次):`);
        game.calls.forEach((call, i) => {
          console.log(`    第${i+1}次: 金币:${call.body?.coins || 0}, 经验:${call.body?.experience || 0}`);
        });
      } else {
        console.log(`  ✅ 单次调用`);
      }
    });
    
    // 检查是否存在分离模式
    const separatedGames = gameCompletions.filter(game => game.calls.length > 1);
    if (separatedGames.length > 0) {
      console.error(`⚠️ 发现 ${separatedGames.length} 次分离的奖励调用`);
      console.log('建议检查补偿机制逻辑');
    } else {
      console.log('✅ 所有奖励调用都是统一的');
    }
    
    console.groupEnd();
    
    return {
      totalCalls: rewardCalls.length,
      gameCompletions: gameCompletions.length,
      separatedGames: separatedGames.length,
      isFixed: separatedGames.length === 0
    };
  },
  
  // 清除记录
  clearHistory() {
    this.apiCalls = [];
    console.log('🗑️ API调用历史已清除');
  }
};

// 自动加载提示
console.log('🔧 奖励修复验证工具已加载');
console.log('使用方法:');
console.log('1. rewardFixVerifier.startMonitoring() - 开始监控');
console.log('2. 完成几局游戏');
console.log('3. rewardFixVerifier.generateReport() - 生成分析报告');
console.log('4. rewardFixVerifier.stopMonitoring() - 停止监控');

// 如果页面已加载，自动开始监控
if (document.readyState === 'complete') {
  console.log('⚡ 自动启动监控...');
  window.rewardFixVerifier.startMonitoring();
}
