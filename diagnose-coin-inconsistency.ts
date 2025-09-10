/**
 * 金币掉落不稳定问题诊断脚本
 * 用于分析为什么一局游戏正常一局游戏不正常
 */

import { calculateGameCompletion, calculateGameRewards } from './src/utils/rewardSystem';
import { REWARD_DEBUG_CONFIG } from './src/utils/rewardConfig';

console.log('🔍 开始诊断金币掉落不稳定问题...\n');

// 测试相同参数的游戏是否会产生不同的奖励结果
function testGameConsistency() {
  console.log('📋 测试 1: 相同参数的游戏奖励一致性');
  
  const testParams = {
    difficulty: 'medium' as const,
    completionTime: 180,
    moves: 25,
    perfectMoves: 20,
    userStats: {
      gamesCompleted: 5,
      level: 2,
      experience: 150,
      bestTimes: { medium: 200 },
      difficultyStats: {
        easyCompleted: 2,
        mediumCompleted: 3,
        hardCompleted: 0,
        expertCompleted: 0,
      }
    },
    unlockedAchievements: ['first_game'],
    totalPieces: 9
  };

  const results = [];
  
  // 连续计算5次相同的游戏
  for (let i = 0; i < 5; i++) {
    console.log(`\n🎯 第 ${i + 1} 次计算:`);
    
    const result = calculateGameCompletion(
      testParams.difficulty,
      testParams.completionTime,
      testParams.moves,
      testParams.userStats,
      testParams.unlockedAchievements,
      testParams.perfectMoves,
      testParams.totalPieces
    );
    
    results.push({
      attempt: i + 1,
      coins: result.rewards.coins,
      experience: result.rewards.experience,
      achievements: result.rewards.achievements?.length || 0,
      isNewRecord: result.isNewRecord,
      timestamp: new Date().toISOString()
    });
    
    console.log('奖励结果:', {
      金币: result.rewards.coins,
      经验: result.rewards.experience,
      新成就: result.rewards.achievements?.length || 0,
      是否新记录: result.isNewRecord
    });
    
    // 短暂延迟，模拟真实游戏间隔
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 分析结果一致性
  console.log('\n📊 一致性分析:');
  const firstResult = results[0];
  let isConsistent = true;
  
  results.forEach((result, index) => {
    if (index === 0) return;
    
    if (result.coins !== firstResult.coins || 
        result.experience !== firstResult.experience) {
      isConsistent = false;
      console.error(`❌ 第 ${result.attempt} 次结果与第 1 次不一致!`);
      console.error('差异:', {
        金币差异: result.coins - firstResult.coins,
        经验差异: result.experience - firstResult.experience
      });
    }
  });
  
  if (isConsistent) {
    console.log('✅ 所有计算结果一致');
  }
  
  return { results, isConsistent };
}

// 测试时间敏感成就的影响
function testTimeBasedAchievements() {
  console.log('\n📋 测试 2: 时间敏感成就的影响');
  
  const baseParams = {
    difficulty: 'easy' as const,
    completionTime: 120,
    moves: 15,
    perfectMoves: 12,
    userStats: {
      gamesCompleted: 1,
      level: 1,
      experience: 50,
      bestTimes: {},
      difficultyStats: {
        easyCompleted: 0,
        mediumCompleted: 0,
        hardCompleted: 0,
        expertCompleted: 0,
      }
    },
    unlockedAchievements: [],
    totalPieces: 9
  };
  
  // 保存原始时间
  const originalNow = Date.now;
  
  // 测试不同时间点的成就触发
  const testTimes = [
    { name: '工作日早上6点', hour: 6, day: 2, desc: '早起鸟成就' },
    { name: '工作日下午', hour: 14, day: 2, desc: '无特殊成就' },
    { name: '周六早上6点', hour: 6, day: 6, desc: '早起鸟+周末战士' },
    { name: '周日下午', hour: 14, day: 0, desc: '周末战士成就' }
  ];
  
  testTimes.forEach(timeTest => {
    console.log(`\n🕒 测试时间: ${timeTest.name} (${timeTest.desc})`);
    
    // 模拟特定时间
    const testDate = new Date();
    testDate.setHours(timeTest.hour, 0, 0, 0);
    testDate.setDate(testDate.getDate() - testDate.getDay() + timeTest.day);
    
    // 临时覆盖 Date 构造函数
    (global as any).Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(testDate.getTime());
        } else {
          super(...args);
        }
      }
      
      static now() {
        return testDate.getTime();
      }
    };
    
    const result = calculateGameCompletion(
      baseParams.difficulty,
      baseParams.completionTime,
      baseParams.moves,
      baseParams.userStats,
      baseParams.unlockedAchievements,
      baseParams.perfectMoves,
      baseParams.totalPieces
    );
    
    console.log('奖励结果:', {
      金币: result.rewards.coins,
      经验: result.rewards.experience,
      新成就: result.rewards.achievements?.map(a => a.name) || [],
      成就奖励: result.rewards.achievements?.reduce((sum, a) => sum + a.coinReward, 0) || 0
    });
  });
  
  // 恢复原始 Date
  (global as any).Date = originalNow;
}

// 测试用户状态变化的影响
function testUserStateVariations() {
  console.log('\n📋 测试 3: 用户状态变化的影响');
  
  const baseParams = {
    difficulty: 'medium' as const,
    completionTime: 200,
    moves: 30,
    perfectMoves: 25
  };
  
  const userVariations = [
    {
      name: '新用户',
      stats: {
        gamesCompleted: 1,
        level: 1,
        experience: 0,
        bestTimes: {},
        difficultyStats: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0, expertCompleted: 0 }
      },
      achievements: []
    },
    {
      name: '经验用户',
      stats: {
        gamesCompleted: 25,
        level: 5,
        experience: 500,
        bestTimes: { medium: 150 },
        difficultyStats: { easyCompleted: 10, mediumCompleted: 14, hardCompleted: 1, expertCompleted: 0 }
      },
      achievements: ['first_game', 'games_10', 'early_bird']
    },
    {
      name: '高级用户',
      stats: {
        gamesCompleted: 75,
        level: 10,
        experience: 1500,
        bestTimes: { medium: 120, hard: 300 },
        difficultyStats: { easyCompleted: 20, mediumCompleted: 30, hardCompleted: 24, expertCompleted: 1 }
      },
      achievements: ['first_game', 'games_10', 'games_50', 'early_bird', 'weekend_warrior', 'speed_demon']
    }
  ];
  
  userVariations.forEach(user => {
    console.log(`\n👤 ${user.name}:`);
    
    const result = calculateGameCompletion(
      baseParams.difficulty,
      baseParams.completionTime,
      baseParams.moves,
      user.stats,
      user.achievements,
      baseParams.perfectMoves,
      9
    );
    
    console.log('奖励详情:', {
      基础金币: result.rewards.coins - (result.rewards.achievements?.reduce((sum, a) => sum + a.coinReward, 0) || 0),
      成就金币: result.rewards.achievements?.reduce((sum, a) => sum + a.coinReward, 0) || 0,
      总金币: result.rewards.coins,
      经验: result.rewards.experience,
      新成就: result.rewards.achievements?.map(a => a.name) || []
    });
  });
}

// 主诊断函数
async function runDiagnostics() {
  try {
    console.log('🚀 开始全面诊断...\n');
    
    // 1. 测试一致性
    const consistencyResult = await testGameConsistency();
    
    // 2. 测试时间敏感性
    testTimeBasedAchievements();
    
    // 3. 测试用户状态影响
    testUserStateVariations();
    
    console.log('\n📋 诊断总结:');
    
    if (!consistencyResult.isConsistent) {
      console.error('❌ 发现一致性问题: 相同参数产生不同奖励');
      console.error('可能原因:');
      console.error('- 时间敏感的成就计算');
      console.error('- 状态依赖的随机性');
      console.error('- 异步操作的竞态条件');
    } else {
      console.log('✅ 奖励计算基本一致');
      console.log('不稳定的原因可能在于:');
      console.log('- 前端与后端的状态同步问题');
      console.log('- 网络请求失败或超时');
      console.log('- 用户状态的并发修改');
    }
    
    console.log('\n🔧 建议的修复方案:');
    console.log('1. 在游戏完成时锁定用户状态，防止并发修改');
    console.log('2. 添加更详细的日志记录每次奖励计算的详细过程');
    console.log('3. 实现奖励计算的幂等性检查');
    console.log('4. 增加重试机制和失败恢复策略');
    
  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  }
}

// 执行诊断
runDiagnostics();
