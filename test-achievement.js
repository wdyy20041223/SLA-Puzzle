// 成就系统测试文件

// 模拟成就定义
const ACHIEVEMENTS = {
  // 进度成就
  first_game: {
    id: 'first_game',
    name: '初次体验',
    description: '完成第一个拼图',
    icon: '🎯',
    category: 'progress'
  },
  games_10: {
    id: 'games_10',
    name: '拼图新手',
    description: '完成10个拼图',
    icon: '🏅',
    category: 'progress'
  },
  games_50: {
    id: 'games_50',
    name: '拼图达人',
    description: '完成50个拼图',
    icon: '🏆',
    category: 'progress'
  },
  games_100: {
    id: 'games_100',
    name: '拼图大师',
    description: '完成100个拼图',
    icon: '👑',
    category: 'milestone'
  },

  // 表现成就
  speed_demon: {
    id: 'speed_demon',
    name: '速度恶魔',
    description: '在3分钟内完成中等难度拼图',
    icon: '⚡',
    category: 'performance'
  },
  lightning_fast: {
    id: 'lightning_fast',
    name: '闪电快手',
    description: '在1分钟内完成简单难度拼图',
    icon: '⚡',
    category: 'performance'
  },
  perfectionist: {
    id: 'perfectionist',
    name: '完美主义者',
    description: '用最少步数完成拼图',
    icon: '💎',
    category: 'performance'
  },
  no_mistakes: {
    id: 'no_mistakes',
    name: '零失误专家',
    description: '完成拼图过程中不放错任何拼块',
    icon: '🎯',
    category: 'performance'
  },

  // 特殊成就
  night_owl: {
    id: 'night_owl',
    name: '夜猫子',
    description: '在凌晨2-6点完成拼图',
    icon: '🦉',
    category: 'special'
  },
  early_bird: {
    id: 'early_bird',
    name: '早起鸟儿',
    description: '在早上5-7点完成拼图',
    icon: '🐦',
    category: 'special'
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: '周末战士',
    description: '在周末完成拼图',
    icon: '🏖️',
    category: 'special'
  },
  consecutive_days: {
    id: 'consecutive_days',
    name: '坚持不懈',
    description: '连续7天完成拼图',
    icon: '📅',
    category: 'special'
  }
};

// 模拟检查成就解锁函数
function checkAchievements(gameResult, userStats, unlockedAchievements, now = new Date()) {
  const newAchievements = [];

  // 进度成就检查
  if (userStats.completedGames === 0 && !unlockedAchievements.includes('first_game')) {
    newAchievements.push(ACHIEVEMENTS.first_game);
  }

  if (userStats.completedGames === 9 && !unlockedAchievements.includes('games_10')) {
    newAchievements.push(ACHIEVEMENTS.games_10);
  }

  if (userStats.completedGames === 49 && !unlockedAchievements.includes('games_50')) {
    newAchievements.push(ACHIEVEMENTS.games_50);
  }

  if (userStats.completedGames === 99 && !unlockedAchievements.includes('games_100')) {
    newAchievements.push(ACHIEVEMENTS.games_100);
  }

  // 表现成就检查
  if (gameResult.difficulty === 'medium' && 
      gameResult.completionTime <= 180 && 
      !unlockedAchievements.includes('speed_demon')) {
    newAchievements.push(ACHIEVEMENTS.speed_demon);
  }

  if (gameResult.difficulty === 'easy' && 
      gameResult.completionTime <= 60 && 
      !unlockedAchievements.includes('lightning_fast')) {
    newAchievements.push(ACHIEVEMENTS.lightning_fast);
  }

  if (gameResult.moves === gameResult.perfectMoves && 
      gameResult.perfectMoves > 0 && 
      !unlockedAchievements.includes('perfectionist')) {
    newAchievements.push(ACHIEVEMENTS.perfectionist);
  }

  if (gameResult.mistakes === 0 && !unlockedAchievements.includes('no_mistakes')) {
    newAchievements.push(ACHIEVEMENTS.no_mistakes);
  }

  // 特殊时间成就检查
  const hour = now.getHours();
  const day = now.getDay();

  if (hour >= 2 && hour <= 6 && !unlockedAchievements.includes('night_owl')) {
    newAchievements.push(ACHIEVEMENTS.night_owl);
  }

  if (hour >= 5 && hour <= 7 && !unlockedAchievements.includes('early_bird')) {
    newAchievements.push(ACHIEVEMENTS.early_bird);
  }

  if ((day === 0 || day === 6) && !unlockedAchievements.includes('weekend_warrior')) {
    newAchievements.push(ACHIEVEMENTS.weekend_warrior);
  }

  // 连续登录成就检查
  if (userStats.consecutiveDays === 6 && !unlockedAchievements.includes('consecutive_days')) {
    newAchievements.push(ACHIEVEMENTS.consecutive_days);
  }

  return newAchievements;
}

// 测试进度成就解锁
function testProgressAchievements() {
  console.log('\n==== 测试进度成就解锁 ====');

  // 测试首次游戏成就
  const firstGameTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  console.log(`${firstGameTest.some(a => a.id === 'first_game') ? '✅' : '❌'} 首次游戏成就解锁`);

  // 测试10局游戏成就
  const games10Test = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 9, consecutiveDays: 0 },
    []
  );
  console.log(`${games10Test.some(a => a.id === 'games_10') ? '✅' : '❌'} 10局游戏成就解锁`);

  // 测试50局游戏成就
  const games50Test = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 49, consecutiveDays: 0 },
    []
  );
  console.log(`${games50Test.some(a => a.id === 'games_50') ? '✅' : '❌'} 50局游戏成就解锁`);

  // 测试100局游戏成就
  const games100Test = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 99, consecutiveDays: 0 },
    []
  );
  console.log(`${games100Test.some(a => a.id === 'games_100') ? '✅' : '❌'} 100局游戏成就解锁`);
}

// 测试表现成就解锁
function testPerformanceAchievements() {
  console.log('\n==== 测试表现成就解锁 ====');

  // 测试速度恶魔成就
  const speedDemonTest = checkAchievements(
    { difficulty: 'medium', completionTime: 120, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  console.log(`${speedDemonTest.some(a => a.id === 'speed_demon') ? '✅' : '❌'} 速度恶魔成就解锁`);

  // 测试闪电快手成就
  const lightningFastTest = checkAchievements(
    { difficulty: 'easy', completionTime: 45, moves: 30, perfectMoves: 30, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  console.log(`${lightningFastTest.some(a => a.id === 'lightning_fast') ? '✅' : '❌'} 闪电快手成就解锁`);

  // 测试完美主义者成就
  const perfectionistTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 30, perfectMoves: 30, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  console.log(`${perfectionistTest.some(a => a.id === 'perfectionist') ? '✅' : '❌'} 完美主义者成就解锁`);

  // 测试零失误专家成就
  const noMistakesTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  console.log(`${noMistakesTest.some(a => a.id === 'no_mistakes') ? '✅' : '❌'} 零失误专家成就解锁`);
}

// 测试特殊成就解锁
function testSpecialAchievements() {
  console.log('\n==== 测试特殊成就解锁 ====');

  // 测试夜猫子成就 (凌晨3点)
  const nightOwlTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    [],
    new Date('2023-01-01T03:00:00')
  );
  console.log(`${nightOwlTest.some(a => a.id === 'night_owl') ? '✅' : '❌'} 夜猫子成就解锁`);

  // 测试早起鸟儿成就 (早上6点)
  const earlyBirdTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    [],
    new Date('2023-01-01T06:00:00')
  );
  console.log(`${earlyBirdTest.some(a => a.id === 'early_bird') ? '✅' : '❌'} 早起鸟儿成就解锁`);

  // 测试周末战士成就 (周日)
  const weekendWarriorTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    [],
    new Date('2023-01-01T12:00:00') // 周日
  );
  console.log(`${weekendWarriorTest.some(a => a.id === 'weekend_warrior') ? '✅' : '❌'} 周末战士成就解锁`);

  // 测试坚持不懈成就
  const consecutiveDaysTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 6 },
    []
  );
  console.log(`${consecutiveDaysTest.some(a => a.id === 'consecutive_days') ? '✅' : '❌'} 坚持不懈成就解锁`);
}

// 测试成就防重复解锁
function testAchievementDeduplication() {
  console.log('\n==== 测试成就防重复解锁 ====');

  // 测试已解锁成就不再重复解锁
  const duplicateTest = checkAchievements(
    { difficulty: 'easy', completionTime: 300, moves: 50, perfectMoves: 50, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    ['first_game']
  );
  console.log(`${!duplicateTest.some(a => a.id === 'first_game') ? '✅' : '❌'} 已解锁成就不再重复解锁`);
}

// 测试多成就同时解锁
function testMultipleAchievements() {
  console.log('\n==== 测试多成就同时解锁 ====');

  // 测试一次游戏解锁多个成就
  const multipleTest = checkAchievements(
    { difficulty: 'easy', completionTime: 45, moves: 30, perfectMoves: 30, mistakes: 0 },
    { completedGames: 0, consecutiveDays: 0 },
    []
  );
  const expectedAchievements = ['first_game', 'lightning_fast', 'perfectionist', 'no_mistakes'];
  const actualIds = multipleTest.map(a => a.id);
  const allExpectedFound = expectedAchievements.every(id => actualIds.includes(id));
  console.log(`${allExpectedFound ? '✅' : '❌'} 多成就同时解锁: 找到 ${actualIds.length} 个成就`);
}

// 测试成就分类统计
function testAchievementCategories() {
  console.log('\n==== 测试成就分类统计 ====');

  // 统计各类成就数量
  const categoryCounts = {};
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    categoryCounts[achievement.category] = (categoryCounts[achievement.category] || 0) + 1;
  });

  console.log('🏆 成就分类统计:');
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} 个成就`);
  });
}

// 运行所有测试
function runAllTests() {
  console.log('\n🚀 开始成就系统测试...');
  
  testProgressAchievements();
  testPerformanceAchievements();
  testSpecialAchievements();
  testAchievementDeduplication();
  testMultipleAchievements();
  testAchievementCategories();
  
  console.log('\n✅ 成就系统测试完成!');
}

// 执行测试
runAllTests();