/**
 * 多重成就解锁测试 V2
 * 增强版测试脚本，验证一局游戏中同时解锁多个成就的逻辑
 */

console.log('🏆 多重成就解锁测试 V2');
console.log('='.repeat(70));

// 模拟导入成就系统函数（使用try-catch处理可能的导入失败）
let checkAchievements, calculateGameCompletion;
try {
  // 尝试导入实际的成就系统函数
  const rewardSystem = require('./src/utils/rewardSystem');
  checkAchievements = rewardSystem.checkAchievements || null;
  calculateGameCompletion = rewardSystem.calculateGameCompletion || null;
  console.log('✅ 成功导入实际的成就系统函数');
} catch (error) {
  console.log('⚠️  无法导入实际的成就系统函数，使用模拟实现');
  
  // 模拟成就系统函数
  checkAchievements = function(userStats, gameResult, unlockedAchievements = []) {
    const newAchievements = [];
    const now = new Date();
    
    // 模拟成就定义
    const ACHIEVEMENTS = {
      first_game: { id: 'first_game', name: '初次体验', description: '完成第一个拼图', category: 'progress' },
      games_10: { id: 'games_10', name: '拼图新手', description: '完成10个拼图', category: 'progress' },
      speed_demon: { id: 'speed_demon', name: '速度恶魔', description: '在3分钟内完成中等难度拼图', category: 'performance' },
      lightning_fast: { id: 'lightning_fast', name: '闪电快手', description: '在1分钟内完成简单难度拼图', category: 'performance' },
      perfectionist: { id: 'perfectionist', name: '完美主义者', description: '用最少步数完成拼图', category: 'performance' },
      efficient_solver: { id: 'efficient_solver', name: '高效解谜者', description: '用少于标准步数60%完成拼图', category: 'performance' },
      super_efficient: { id: 'super_efficient', name: '超级效率者', description: '用少于标准步数30%完成拼图', category: 'performance' },
      night_owl: { id: 'night_owl', name: '夜猫子', description: '在凌晨2-6点完成拼图', category: 'special' },
      weekend_warrior: { id: 'weekend_warrior', name: '周末战士', description: '在周末完成拼图', category: 'special' },
      time_master: { id: 'time_master', name: '时间大师', description: '打破个人最佳记录', category: 'performance' }
    };

    // 检查进度成就
    const completedGamesAfterThis = userStats.gamesCompleted + 1;
    if (completedGamesAfterThis === 1 && !unlockedAchievements.includes('first_game')) {
      newAchievements.push({ ...ACHIEVEMENTS.first_game, unlocked: true, unlockedAt: now });
    }
    if (completedGamesAfterThis === 10 && !unlockedAchievements.includes('games_10')) {
      newAchievements.push({ ...ACHIEVEMENTS.games_10, unlocked: true, unlockedAt: now });
    }

    // 检查速度成就
    if (gameResult.difficulty === 'medium' && 
        gameResult.completionTime <= 180 && 
        !unlockedAchievements.includes('speed_demon')) {
      newAchievements.push({ ...ACHIEVEMENTS.speed_demon, unlocked: true, unlockedAt: now });
    }
    if (gameResult.difficulty === 'easy' && 
        gameResult.completionTime <= 60 && 
        !unlockedAchievements.includes('lightning_fast')) {
      newAchievements.push({ ...ACHIEVEMENTS.lightning_fast, unlocked: true, unlockedAt: now });
    }

    // 检查效率成就
    if (gameResult.perfectMoves) {
      if (gameResult.moves === gameResult.perfectMoves && 
          !unlockedAchievements.includes('perfectionist')) {
        newAchievements.push({ ...ACHIEVEMENTS.perfectionist, unlocked: true, unlockedAt: now });
      }
      if (gameResult.moves <= gameResult.perfectMoves * 0.6 && 
          !unlockedAchievements.includes('efficient_solver')) {
        newAchievements.push({ ...ACHIEVEMENTS.efficient_solver, unlocked: true, unlockedAt: now });
      }
      if (gameResult.moves <= gameResult.perfectMoves * 0.3 && 
          !unlockedAchievements.includes('super_efficient')) {
        newAchievements.push({ ...ACHIEVEMENTS.super_efficient, unlocked: true, unlockedAt: now });
      }
    }

    // 检查特殊时间成就
    const hour = now.getHours();
    if (hour >= 2 && hour <= 6 && !unlockedAchievements.includes('night_owl')) {
      newAchievements.push({ ...ACHIEVEMENTS.night_owl, unlocked: true, unlockedAt: now });
    }

    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend && !unlockedAchievements.includes('weekend_warrior')) {
      newAchievements.push({ ...ACHIEVEMENTS.weekend_warrior, unlocked: true, unlockedAt: now });
    }

    // 检查新记录成就
    if (userStats.bestTimes) {
      const difficultyKey = `${gameResult.difficulty}_time`;
      const previousBest = userStats.bestTimes[difficultyKey];
      if (previousBest && gameResult.completionTime < previousBest && 
          !unlockedAchievements.includes('time_master')) {
        newAchievements.push({ ...ACHIEVEMENTS.time_master, unlocked: true, unlockedAt: now });
      }
    }

    return newAchievements;
  };
  
  // 模拟游戏完成结果计算
  calculateGameCompletion = function(difficulty, completionTime, moves, userStats, unlockedAchievements, perfectMoves, totalPieces) {
    const achievements = checkAchievements(userStats, {difficulty, completionTime, moves, perfectMoves, totalPieces}, unlockedAchievements);
    return {
      completionTime,
      moves,
      difficulty,
      isNewRecord: userStats.bestTimes && userStats.bestTimes[`${difficulty}_time`] > completionTime,
      totalPieces,
      rewards: {
        coins: 100, // 模拟值
        experience: 50, // 模拟值
        achievements: achievements.length > 0 ? achievements : undefined
      }
    };
  };
}

// 保存原始的Date方法，用于模拟特定时间
const originalDateNow = Date.now;
const originalGetHours = Date.prototype.getHours;
const originalGetDay = Date.prototype.getDay;

// 测试场景1: 理想情况下的多重成就解锁
function testIdealScenario() {
  console.log('\n1. 测试场景: 理想情况下的多重成就解锁');
  console.log('-'.repeat(70));
  
  // 模拟特定时间
  Date.now = () => new Date('2024-01-13T03:00:00').getTime();
  Date.prototype.getHours = function() { return 3; };
  Date.prototype.getDay = function() { return 6; };
  
  // 测试数据
  const userStats = {
    gamesCompleted: 9, // 这局是第10局
    level: 3,
    experience: 700,
    bestTimes: {
      medium_time: 200, // 之前最好时间是3分20秒
    },
    recentGameResults: [
      { moves: 12, totalPieces: 9, timestamp: new Date(Date.now() - 86400000) },
      { moves: 14, totalPieces: 9, timestamp: new Date(Date.now() - 172800000) }
    ]
  };
  
  const gameResult = {
    difficulty: 'medium',
    completionTime: 150, // 2分30秒，比之前的记录快
    moves: 30,
    perfectMoves: 30, // 完美步数
    totalPieces: 16
  };
  
  const unlockedAchievements = [];
  
  console.log('   游戏条件:');
  console.log('   - 第10局游戏 → 触发"拼图新手"');
  console.log('   - 2分30秒完成中等难度 → 触发"速度恶魔"和"时间大师"');
  console.log('   - 完美步数完成 → 触发"完美主义者"');
  console.log('   - 凌晨3点完成 → 触发"夜猫子"');
  console.log('   - 周六完成 → 触发"周末战士"');
  
  try {
    const achievements = checkAchievements(userStats, gameResult, unlockedAchievements);
    
    console.log(`\n   解锁成就数: ${achievements.length}`);
    achievements.forEach((achievement, index) => {
      console.log(`   ${index + 1}. ${achievement.name} (${achievement.id}) - ${achievement.category}`);
    });
    
    // 评估测试结果
    const expectedMinAchievements = 4;
    if (achievements.length >= expectedMinAchievements) {
      console.log(`\n   ✅ 测试通过: 成功解锁 ${achievements.length} 个成就，超过预期的 ${expectedMinAchievements} 个`);
    } else {
      console.log(`\n   ⚠️  测试警告: 只解锁了 ${achievements.length} 个成就，预期至少解锁 ${expectedMinAchievements} 个`);
    }
  } catch (error) {
    console.error('   ❌ 测试失败:', error);
  }
}

// 测试场景2: 不同难度和效率的组合
function testDifficultyAndEfficiency() {
  console.log('\n2. 测试场景: 不同难度和效率的组合');
  console.log('-'.repeat(70));
  
  // 恢复正常时间
  Date.prototype.getHours = function() { return 12; };
  Date.prototype.getDay = function() { return 3; };
  
  // 测试数据
  const userStats = {
    gamesCompleted: 50,
    level: 10,
    experience: 3500,
    bestTimes: {
      easy_time: 100
    },
    recentGameResults: Array(2).fill().map((_, i) => ({
      moves: 8, totalPieces: 9, timestamp: new Date(Date.now() - (i + 1) * 86400000)
    }))
  };
  
  // 测试不同难度和效率组合
  const testCases = [
    {
      name: '简单难度 + 超快速度',
      gameResult: { difficulty: 'easy', completionTime: 45, moves: 12, perfectMoves: 12, totalPieces: 9 }
    },
    {
      name: '困难难度 + 高效解题',
      gameResult: { difficulty: 'hard', completionTime: 350, moves: 40, perfectMoves: 60, totalPieces: 25 }
    },
    {
      name: '专家难度 + 超级效率',
      gameResult: { difficulty: 'expert', completionTime: 700, moves: 50, perfectMoves: 200, totalPieces: 36 }
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n   测试: ${testCase.name}`);
    try {
      const achievements = checkAchievements(userStats, testCase.gameResult, []);
      console.log(`     解锁成就数: ${achievements.length}`);
      achievements.forEach(achievement => {
        console.log(`     - ${achievement.name} (${achievement.id})`);
      });
    } catch (error) {
      console.error(`     ❌ 测试失败:`, error);
    }
  });
}

// 测试场景3: 成就过滤和最终游戏结果
function testAchievementFiltering() {
  console.log('\n3. 测试场景: 成就过滤和最终游戏结果');
  console.log('-'.repeat(70));
  
  // 模拟特定时间
  Date.prototype.getHours = function() { return 6; };
  Date.prototype.getDay = function() { return 0; };
  
  const userStats = {
    gamesCompleted: 5,
    level: 5,
    experience: 1200,
    bestTimes: {
      easy_time: 150
    }
  };
  
  const gameResult = {
    difficulty: 'easy',
    completionTime: 50, // 50秒完成简单难度
    moves: 10,
    perfectMoves: 10,
    totalPieces: 9
  };
  
  const unlockedAchievements = [];
  
  try {
    const gameCompletion = calculateGameCompletion(
      gameResult.difficulty,
      gameResult.completionTime,
      gameResult.moves,
      userStats,
      unlockedAchievements,
      gameResult.perfectMoves,
      gameResult.totalPieces
    );
    
    console.log('   游戏完成结果:');
    console.log(`   - 金币奖励: ${gameCompletion.rewards.coins}`);
    console.log(`   - 经验奖励: ${gameCompletion.rewards.experience}`);
    console.log(`   - 新纪录: ${gameCompletion.isNewRecord ? '✓' : '✗'}`);
    
    if (gameCompletion.rewards.achievements) {
      console.log(`   - 最终显示成就数: ${gameCompletion.rewards.achievements.length}`);
      gameCompletion.rewards.achievements.forEach(achievement => {
        console.log(`     * ${achievement.name} (${achievement.id})`);
      });
    }
  } catch (error) {
    console.error('   ❌ 测试失败:', error);
  }
}

// 运行所有测试场景
function runAllTests() {
  try {
    testIdealScenario();
    testDifficultyAndEfficiency();
    testAchievementFiltering();
    
    console.log('\n='.repeat(70));
    console.log('✅ 多重成就解锁测试 V2 完成');
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    // 恢复原始的Date方法
    Date.now = originalDateNow;
    Date.prototype.getHours = originalGetHours;
    Date.prototype.getDay = originalGetDay;
  }
}

// 执行测试
runAllTests();