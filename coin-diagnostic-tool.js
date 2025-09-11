/**
 * 金币交替归零问题实时诊断工具
 * 在浏览器控制台中使用
 */

// 全局诊断对象
window.coinDiagnostic = {
  // 游戏计数器
  gameCounter: 0,
  gameHistory: [],
  
  // 开始监控
  startMonitoring() {
    console.log('🔍 开始监控金币奖励问题...');
    this.gameCounter = 0;
    this.gameHistory = [];
    
    // 重置本地存储中的诊断数据
    localStorage.setItem('coinDiagnosticData', JSON.stringify({
      gameHistory: [],
      startTime: new Date().toISOString()
    }));
    
    console.log('✅ 监控已启动，完成游戏后数据会自动记录');
  },
  
  // 记录游戏完成数据
  recordGame(gameData) {
    this.gameCounter++;
    
    const record = {
      gameNumber: this.gameCounter,
      timestamp: new Date().toISOString(),
      ...gameData
    };
    
    this.gameHistory.push(record);
    
    // 保存到本地存储
    const diagnosticData = JSON.parse(localStorage.getItem('coinDiagnosticData') || '{}');
    diagnosticData.gameHistory = this.gameHistory;
    localStorage.setItem('coinDiagnosticData', JSON.stringify(diagnosticData));
    
    console.log(`🎮 第${this.gameCounter}局游戏记录:`, record);
    
    // 检查是否出现交替模式
    this.checkAlternatingPattern();
  },
  
  // 检查交替模式
  checkAlternatingPattern() {
    if (this.gameHistory.length < 2) return;
    
    const recent = this.gameHistory.slice(-4); // 最近4局
    let hasAlternating = false;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i-1];
      const current = recent[i];
      
      if ((prev.actualCoins === 0 && current.actualCoins > 0) ||
          (prev.actualCoins > 0 && current.actualCoins === 0)) {
        hasAlternating = true;
        break;
      }
    }
    
    if (hasAlternating) {
      console.warn('⚠️ 检测到交替模式!');
      this.analyzePattern();
    }
  },
  
  // 分析模式
  analyzePattern() {
    console.group('🔍 交替模式分析');
    
    this.gameHistory.forEach((game, index) => {
      const status = game.actualCoins === 0 ? '❌ 零金币' : '✅ 正常';
      console.log(`第${game.gameNumber}局: ${status} - 前端:${game.expectedCoins}, 后端:${game.actualCoins}`);
      
      if (game.achievements && game.achievements.length > 0) {
        console.log(`  🏆 触发成就: ${game.achievements.map(a => a.name).join(', ')}`);
      }
      
      if (game.userState) {
        console.log(`  👤 游戏前状态: 完成${game.userState.gamesCompleted}局, ${game.userState.achievementsCount}个成就`);
      }
    });
    
    console.groupEnd();
    
    // 推断问题原因
    this.inferCause();
  },
  
  // 推断原因
  inferCause() {
    console.group('🧠 问题原因推断');
    
    const zeroRewardGames = this.gameHistory.filter(g => g.actualCoins === 0);
    const normalGames = this.gameHistory.filter(g => g.actualCoins > 0);
    
    console.log('零金币游戏特征分析:');
    zeroRewardGames.forEach(game => {
      console.log(`- 第${game.gameNumber}局: 预期${game.expectedCoins}金币，实际0金币`);
      if (game.achievements && game.achievements.length > 0) {
        console.log(`  可能原因: 成就"${game.achievements[0].name}"已存在但被重复计算`);
      }
    });
    
    console.log('正常游戏特征分析:');
    normalGames.forEach(game => {
      console.log(`- 第${game.gameNumber}局: 预期${game.expectedCoins}金币，实际${game.actualCoins}金币`);
    });
    
    // 检查是否是首次游戏成就重复触发
    const firstGameAchievements = this.gameHistory.filter(g => 
      g.achievements && g.achievements.some(a => a.id === 'first_game')
    );
    
    if (firstGameAchievements.length > 1) {
      console.warn('⚠️ 检测到首次游戏成就被重复触发!');
      console.log('触发次数:', firstGameAchievements.length);
      console.log('触发游戏:', firstGameAchievements.map(g => g.gameNumber));
    }
    
    console.groupEnd();
  },
  
  // 生成报告
  generateReport() {
    console.group('📊 诊断报告');
    
    const totalGames = this.gameHistory.length;
    const zeroGames = this.gameHistory.filter(g => g.actualCoins === 0).length;
    const normalGames = totalGames - zeroGames;
    
    console.log(`总游戏数: ${totalGames}`);
    console.log(`零金币游戏: ${zeroGames} (${(zeroGames/totalGames*100).toFixed(1)}%)`);
    console.log(`正常游戏: ${normalGames} (${(normalGames/totalGames*100).toFixed(1)}%)`);
    
    if (zeroGames > 0) {
      console.log('\n问题模式:');
      if (this.isAlternatingPattern()) {
        console.log('✅ 确认为交替模式 (一局正常，一局异常)');
      } else {
        console.log('❓ 非规律性异常');
      }
    }
    
    console.log('\n建议解决方案:');
    console.log('1. 检查成就重复触发问题');
    console.log('2. 验证用户状态同步时机');
    console.log('3. 确认前后端奖励计算一致性');
    
    console.groupEnd();
    
    return {
      totalGames,
      zeroGames,
      normalGames,
      pattern: this.isAlternatingPattern() ? 'alternating' : 'irregular',
      history: this.gameHistory
    };
  },
  
  // 检查是否为交替模式
  isAlternatingPattern() {
    if (this.gameHistory.length < 4) return false;
    
    let alternatingCount = 0;
    for (let i = 1; i < this.gameHistory.length; i++) {
      const prev = this.gameHistory[i-1];
      const current = this.gameHistory[i];
      
      if ((prev.actualCoins === 0 && current.actualCoins > 0) ||
          (prev.actualCoins > 0 && current.actualCoins === 0)) {
        alternatingCount++;
      }
    }
    
    return alternatingCount >= 2;
  },
  
  // 清除历史数据
  clearHistory() {
    this.gameHistory = [];
    this.gameCounter = 0;
    localStorage.removeItem('coinDiagnosticData');
    console.log('🗑️ 诊断历史已清除');
  }
};

// 自动注入监控代码
if (typeof window !== 'undefined') {
  // 拦截游戏完成处理
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    // 监听特定的日志模式
    const message = args[0];
    
    if (typeof message === 'string' && message.includes('🎯 前端奖励计算结果:')) {
      // 解析前端计算结果
      const rewardData = args[1];
      if (rewardData && typeof rewardData === 'object') {
        window.expectedReward = {
          coins: rewardData.基础奖励?.coins || 0,
          experience: rewardData.基础奖励?.experience || 0,
          achievements: rewardData.基础奖励?.achievements || []
        };
      }
    }
    
    if (typeof message === 'string' && message.includes('实际获得奖励:')) {
      // 解析后端实际结果
      const actualData = args[1];
      if (actualData && typeof actualData === 'object' && window.expectedReward) {
        window.coinDiagnostic.recordGame({
          expectedCoins: window.expectedReward.coins,
          actualCoins: actualData.coins || 0,
          expectedExperience: window.expectedReward.experience,
          actualExperience: actualData.experience || 0,
          achievements: window.expectedReward.achievements,
          isConsistent: actualData.coins === window.expectedReward.coins
        });
      }
    }
    
    originalConsoleLog.apply(console, args);
  };
  
  console.log('🔧 金币诊断工具已加载');
  console.log('使用 coinDiagnostic.startMonitoring() 开始监控');
  console.log('使用 coinDiagnostic.generateReport() 生成报告');
}
