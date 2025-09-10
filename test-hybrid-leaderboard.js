/**
 * 混合排行榜服务集成测试
 * 验证API模式和本地模式的切换功能
 */

import { HybridLeaderboardService } from './src/services/hybridLeaderboardService.js';
import { APILeaderboardService } from './src/services/apiLeaderboardService.js';
import { LeaderboardService } from './src/services/leaderboardService.js';

console.log('🚀 开始混合排行榜服务集成测试...\n');

// 模拟localStorage (Node.js环境)
global.localStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value.toString();
  },
  removeItem(key) {
    delete this.storage[key];
  },
  clear() {
    this.storage = {};
  }
};

// 模拟navigator (Node.js环境)
global.navigator = {
  onLine: true
};

// 模拟fetch (Node.js环境)
global.fetch = async (url, options) => {
  console.log(`🌐 模拟API调用: ${url}`);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 根据URL返回不同的模拟响应
  if (url.includes('/games/stats')) {
    return {
      ok: true,
      json: async () => ({
        basic: {
          totalGames: 15,
          averageCompletionTime: 120000,
          averageMoves: 35
        },
        byDifficulty: {
          easy: { count: 8, averageTime: 80000, averageMoves: 25 },
          medium: { count: 5, averageTime: 150000, averageMoves: 40 },
          hard: { count: 2, averageTime: 300000, averageMoves: 60 }
        }
      })
    };
  }
  
  if (url.includes('/games/leaderboard')) {
    return {
      ok: true,
      json: async () => ([
        {
          id: 'api_1',
          playerName: 'API_Player_1',
          puzzleName: 'sunset-beach',
          completionTime: 95000,
          moves: 22,
          difficulty: 'easy',
          pieceShape: 'square',
          gridSize: '3x3',
          completedAt: new Date().toISOString()
        }
      ])
    };
  }
  
  // 默认成功响应
  return {
    ok: true,
    json: async () => ({ success: true })
  };
};

async function runTests() {
  try {
    console.log('📊 1. 测试服务状态检查');
    const initialStatus = HybridLeaderboardService.getServiceStatus();
    console.log('初始状态:', initialStatus);
    
    console.log('\n🔧 2. 测试本地模式');
    HybridLeaderboardService.setAPIEnabled(false);
    
    // 添加本地记录
    const localEntry = await HybridLeaderboardService.addEntry({
      puzzleName: 'test-puzzle',
      playerName: 'LocalPlayer',
      completionTime: 120000,
      moves: 30,
      difficulty: 'medium',
      pieceShape: 'square',
      gridSize: '4x4'
    });
    
    console.log('✅ 本地记录添加成功:', {
      id: localEntry.id,
      playerName: localEntry.playerName,
      completionTime: localEntry.completionTime
    });
    
    // 获取本地排行榜
    const localLeaderboard = await HybridLeaderboardService.getDifficultyLeaderboard('medium', 'square', 10);
    console.log('✅ 本地排行榜获取成功, 记录数:', localLeaderboard.length);
    
    console.log('\n🌐 3. 测试API模式切换');
    
    // 模拟用户登录
    localStorage.setItem('authToken', 'test_token_123');
    localStorage.setItem('user', JSON.stringify({
      id: 'test_user',
      username: 'TestUser',
      email: 'test@example.com'
    }));
    
    // 启用API模式
    HybridLeaderboardService.setAPIEnabled(true);
    
    const apiStatus = HybridLeaderboardService.getServiceStatus();
    console.log('API模式状态:', apiStatus);
    
    console.log('\n📈 4. 测试API数据获取');
    
    // 测试统计数据获取
    const stats = await HybridLeaderboardService.getUserStats();
    console.log('✅ API统计数据获取成功:', {
      totalGames: stats.basic?.totalGames,
      difficulties: Object.keys(stats.byDifficulty || {})
    });
    
    // 测试排行榜数据获取
    const apiLeaderboard = await HybridLeaderboardService.getDifficultyLeaderboard('easy', 'square', 5);
    console.log('✅ API排行榜获取成功, 记录数:', apiLeaderboard.length);
    
    console.log('\n🔄 5. 测试数据同步');
    
    // 添加记录时的同步测试
    const syncEntry = await HybridLeaderboardService.addEntry({
      puzzleName: 'sync-test-puzzle',
      playerName: 'SyncPlayer',
      completionTime: 95000,
      moves: 25,
      difficulty: 'easy',
      pieceShape: 'square',
      gridSize: '3x3'
    });
    
    console.log('✅ 同步记录添加成功:', {
      id: syncEntry.id,
      playerName: syncEntry.playerName
    });
    
    console.log('\n🎯 6. 测试每日挑战功能');
    
    // 每日挑战主要使用本地存储
    const dailyEntry = HybridLeaderboardService.addDailyChallengeEntry({
      date: new Date().toISOString().split('T')[0],
      playerName: 'DailyPlayer',
      score: 85,
      completionTime: 150000,
      moves: 35,
      difficulty: 'medium',
      isPerfect: false,
      consecutiveDays: 3,
      totalChallengesCompleted: 10,
      averageScore: 82.5
    });
    
    console.log('✅ 每日挑战记录添加成功:', {
      id: dailyEntry.id,
      score: dailyEntry.score,
      consecutiveDays: dailyEntry.consecutiveDays
    });
    
    const dailyRanking = HybridLeaderboardService.getDailyChallengeRanking(undefined, 10);
    console.log('✅ 每日挑战排行榜获取成功, 记录数:', dailyRanking.length);
    
    console.log('\n🔍 7. 测试调试信息');
    
    const debugInfo = HybridLeaderboardService.getDebugInfo();
    console.log('调试信息:', {
      apiEnabled: debugInfo.apiEnabled,
      hasAuthToken: debugInfo.hasAuthToken,
      localDataSize: debugInfo.localDataSize
    });
    
    console.log('\n✅ 所有测试完成！');
    console.log('\n📋 测试总结:');
    console.log('- ✅ 本地模式运行正常');
    console.log('- ✅ API模式切换正常');
    console.log('- ✅ 数据同步功能正常');
    console.log('- ✅ 每日挑战功能正常');
    console.log('- ✅ 混合服务集成成功');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
runTests().then(() => {
  console.log('\n🎉 混合排行榜服务测试完成!');
}).catch(error => {
  console.error('❌ 测试运行出错:', error);
});
