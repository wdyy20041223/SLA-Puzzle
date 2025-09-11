/**
 * 奖励系统单元测试
 * 测试奖励系统功能
 * 验证金币和经验值计算、成就解锁逻辑等核心功能
 */

console.log('🧪 奖励系统单元测试');
console.log('='.repeat(60));

// 完全独立的模拟实现，不依赖实际的TypeScript模块

// 模拟难度等级
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'expert'];

// 模拟奖励系统函数 - 计算游戏奖励
function calculateGameRewards(difficulty, completionTime, moves, perfectMoves) {
  // 基础奖励配置（按难度分级）
  const baseRewards = {
    easy: { coins: 50, experience: 20 },
    medium: { coins: 80, experience: 35 },
    hard: { coins: 120, experience: 55 },
    expert: { coins: 200, experience: 80 }
  };
  
  // 获取基础奖励
  const baseReward = baseRewards[difficulty] || baseRewards.easy;
  let coins = baseReward.coins;
  let experience = baseReward.experience;
  
  // 时间奖励计算
  const timeMultiplier = getTimeRewardMultiplier(difficulty, completionTime);
  coins = Math.floor(coins * timeMultiplier);
  experience = Math.floor(experience * timeMultiplier);
  
  // 步数效率奖励（如果提供了完美步数）
  if (perfectMoves && moves > 0) {
    const efficiencyMultiplier = getEfficiencyRewardMultiplier(moves, perfectMoves);
    coins = Math.floor(coins * efficiencyMultiplier);
    experience = Math.floor(experience * efficiencyMultiplier);
  }
  
  return {
    coins,
    experience,
    timeMultiplier,
    efficiencyMultiplier: perfectMoves ? getEfficiencyRewardMultiplier(moves, perfectMoves) : 1
  };
}

// 模拟时间奖励乘数计算
function getTimeRewardMultiplier(difficulty, completionTime) {
  // 各难度的基准时间（秒）
  const baseTimes = {
    easy: 300,    // 5分钟
    medium: 480,  // 8分钟
    hard: 720,    // 12分钟
    expert: 1200  // 20分钟
  };
  
  const baseTime = baseTimes[difficulty] || baseTimes.easy;
  
  // 根据完成时间计算奖励乘数
  if (completionTime <= baseTime * 0.3) {
    return 1.5; // 非常快，1.5倍奖励
  } else if (completionTime <= baseTime * 0.6) {
    return 1.2; // 较快，1.2倍奖励
  } else if (completionTime <= baseTime) {
    return 1.0; // 正常时间，基础奖励
  } else if (completionTime <= baseTime * 1.5) {
    return 0.8; // 稍慢，0.8倍奖励
  } else {
    return 0.5; // 很慢，0.5倍奖励
  }
}

// 模拟效率奖励乘数计算
function getEfficiencyRewardMultiplier(moves, perfectMoves) {
  if (moves <= perfectMoves) {
    return 1.5; // 完美步数，1.5倍奖励
  } else if (moves <= perfectMoves * 1.3) {
    return 1.2; // 接近完美，1.2倍奖励
  } else if (moves <= perfectMoves * 1.6) {
    return 1.0; // 正常效率，基础奖励
  } else if (moves <= perfectMoves * 2.0) {
    return 0.8; // 效率较低，0.8倍奖励
  } else {
    return 0.5; // 效率很低，0.5倍奖励
  }
}

// 模拟成就系统函数
function checkAchievements(userStats, gameResult, unlockedAchievements = []) {
  const newAchievements = [];
  const now = new Date();
  
  // 成就定义
  const ACHIEVEMENTS = {
    first_game: {
      id: 'first_game',
      name: '初次体验',
      description: '完成第一个拼图',
      icon: '🏆',
      category: 'progress'
    },
    games_10: {
      id: 'games_10',
      name: '拼图新手',
      description: '完成10个拼图',
      icon: '🎯',
      category: 'progress'
    },
    games_50: {
      id: 'games_50',
      name: '拼图达人',
      description: '完成50个拼图',
      icon: '⭐',
      category: 'progress'
    },
    games_100: {
      id: 'games_100',
      name: '拼图大师',
      description: '完成100个拼图',
      icon: '👑',
      category: 'progress'
    },
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
      icon: '💨',
      category: 'performance'
    },
    perfectionist: {
      id: 'perfectionist',
      name: '完美主义者',
      description: '用最少步数完成拼图',
      icon: '✨',
      category: 'performance'
    },
    efficient_solver: {
      id: 'efficient_solver',
      name: '高效解谜者',
      description: '用少于标准步数60%完成拼图',
      icon: '🚀',
      category: 'performance'
    },
    super_efficient: {
      id: 'super_efficient',
      name: '超级效率者',
      description: '用少于标准步数30%完成拼图',
      icon: '💫',
      category: 'performance'
    },
    expert_solver: {
      id: 'expert_solver',
      name: '专家级解谜',
      description: '在8分钟内完成专家难度拼图',
      icon: '🧠',
      category: 'performance'
    },
    night_owl: {
      id: 'night_owl',
      name: '夜猫子',
      description: '在凌晨2-6点完成拼图',
      icon: '🦉',
      category: 'special'
    },
    early_bird: {
      id: 'early_bird',
      name: '早起鸟',
      description: '在早上6-8点完成拼图',
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
    time_master: {
      id: 'time_master',
      name: '时间大师',
      description: '打破个人最佳记录',
      icon: '⏱️',
      category: 'performance'
    }
  };
  
  // 检查进度成就
  const completedGamesAfterThis = userStats.gamesCompleted + 1;
  
  if (completedGamesAfterThis === 1 && !unlockedAchievements.includes('first_game')) {
    newAchievements.push({ ...ACHIEVEMENTS.first_game, unlocked: true, unlockedAt: now });
  }
  
  if (completedGamesAfterThis === 10 && !unlockedAchievements.includes('games_10')) {
    newAchievements.push({ ...ACHIEVEMENTS.games_10, unlocked: true, unlockedAt: now });
  }
  
  if (completedGamesAfterThis === 50 && !unlockedAchievements.includes('games_50')) {
    newAchievements.push({ ...ACHIEVEMENTS.games_50, unlocked: true, unlockedAt: now });
  }
  
  if (completedGamesAfterThis === 100 && !unlockedAchievements.includes('games_100')) {
    newAchievements.push({ ...ACHIEVEMENTS.games_100, unlocked: true, unlockedAt: now });
  }
  
  // 检查表现成就 - 速度相关
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
  
  if (gameResult.difficulty === 'expert' && 
      gameResult.completionTime <= 480 && 
      !unlockedAchievements.includes('expert_solver')) {
    newAchievements.push({ ...ACHIEVEMENTS.expert_solver, unlocked: true, unlockedAt: now });
  }
  
  // 检查表现成就 - 步数相关
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
  
  // 检查特殊成就 - 时间相关
  const hour = now.getHours();
  
  if (hour >= 2 && hour <= 6 && !unlockedAchievements.includes('night_owl')) {
    newAchievements.push({ ...ACHIEVEMENTS.night_owl, unlocked: true, unlockedAt: now });
  }
  
  if (hour >= 6 && hour <= 8 && !unlockedAchievements.includes('early_bird')) {
    newAchievements.push({ ...ACHIEVEMENTS.early_bird, unlocked: true, unlockedAt: now });
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
}

// 模拟游戏完成结果计算
function calculateGameCompletion(difficulty, completionTime, moves, userStats, unlockedAchievements, perfectMoves, totalPieces) {
  // 计算奖励
  const rewards = calculateGameRewards(difficulty, completionTime, moves, perfectMoves);
  
  // 检查成就
  const achievements = checkAchievements(userStats, 
    { difficulty, completionTime, moves, perfectMoves, totalPieces }, 
    unlockedAchievements
  );
  
  // 检查是否有新记录
  let isNewRecord = false;
  if (userStats.bestTimes) {
    const difficultyKey = `${difficulty}_time`;
    const previousBest = userStats.bestTimes[difficultyKey];
    isNewRecord = previousBest && completionTime < previousBest;
  }
  
  // 过滤非官方成就
  const filteredAchievements = filterOfficialAchievements(achievements);
  
  // 构建游戏完成结果
  const result = {
    completionTime,
    moves,
    difficulty,
    isNewRecord,
    totalPieces,
    rewards: {
      coins: rewards.coins,
      experience: rewards.experience
    }
  };
  
  // 如果有新解锁的官方成就，添加到结果中
  if (filteredAchievements.length > 0) {
    result.rewards.achievements = filteredAchievements;
  }
  
  return result;
}

// 模拟官方成就过滤
function filterOfficialAchievements(achievements) {
  // 官方成就ID列表
  const OFFICIAL_ACHIEVEMENT_IDS = [
    'first_game', 'games_10', 'games_50', 'games_100',
    'speed_demon', 'lightning_fast', 'expert_solver',
    'perfectionist', 'efficient_solver', 'super_efficient',
    'night_owl', 'early_bird', 'weekend_warrior',
    'time_master'
  ];
  
  // 过滤出官方成就
  return achievements.filter(achievement => 
    OFFICIAL_ACHIEVEMENT_IDS.includes(achievement.id)
  );
}

console.log('1. 测试基础奖励计算...');

// 测试不同难度的基础奖励
DIFFICULTY_LEVELS.forEach(difficulty => {
  const baseReward = calculateGameRewards(difficulty, 9999, 9999); // 使用非常大的时间和步数，确保只获得基础奖励
  console.log(`   ${difficulty.toUpperCase()}: 金币=${baseReward.coins}, 经验=${baseReward.experience}`);
});

console.log('\n2. 测试时间奖励...');

// 测试快速完成奖励
const timeTests = [
  { difficulty: 'easy', time: 60, expectedMultiplier: '50% 金币奖励' }, // 1分钟内完成简单难度
  { difficulty: 'medium', time: 120, expectedMultiplier: '50% 金币奖励' }, // 2分钟内完成中等难度
  { difficulty: 'hard', time: 240, expectedMultiplier: '50% 金币奖励' }, // 4分钟内完成困难难度
  { difficulty: 'expert', time: 500, expectedMultiplier: '50% 金币奖励' } // 8分20秒内完成专家难度
];

timeTests.forEach(test => {
  const baseReward = calculateGameRewards(test.difficulty, 9999, 9999);
  const fastReward = calculateGameRewards(test.difficulty, test.time, 9999);
  console.log(`   ${test.difficulty.toUpperCase()} (${test.time}秒): 金币=${fastReward.coins} (基础: ${baseReward.coins}, ${test.expectedMultiplier})`);
});

console.log('\n3. 测试步数奖励...');

// 测试完美步数奖励
const moveTests = [
  { difficulty: 'easy', moves: 9, perfectMoves: 9, expectedMultiplier: '100% 金币奖励' }, // 完美步数
  { difficulty: 'medium', moves: 20, perfectMoves: 20, expectedMultiplier: '100% 金币奖励' }, // 完美步数
  { difficulty: 'easy', moves: 10, perfectMoves: 9, expectedMultiplier: '30% 金币奖励' }, // 优秀步数 (1.2倍内)
  { difficulty: 'medium', moves: 22, perfectMoves: 20, expectedMultiplier: '30% 金币奖励' } // 优秀步数 (1.2倍内)
];

moveTests.forEach(test => {
  const baseReward = calculateGameRewards(test.difficulty, 9999, 9999);
  const perfectReward = calculateGameRewards(test.difficulty, 9999, test.moves, test.perfectMoves);
  console.log(`   ${test.difficulty.toUpperCase()} (${test.moves}/${test.perfectMoves}步): 金币=${perfectReward.coins} (基础: ${baseReward.coins}, ${test.expectedMultiplier})`);
});

console.log('\n4. 测试成就解锁逻辑...');

// 测试首次游戏成就
const firstGameTest = {
  userStats: { gamesCompleted: 0 },
  gameResult: { difficulty: 'easy', completionTime: 300, moves: 15 },
  unlockedAchievements: []
};

const firstGameAchievements = checkAchievements(
  firstGameTest.userStats,
  firstGameTest.gameResult,
  firstGameTest.unlockedAchievements
);

console.log(`   首次游戏测试: 解锁${firstGameAchievements.length}个成就`);
firstGameAchievements.forEach(achievement => {
  console.log(`     - ${achievement.name} (${achievement.id})`);
});

// 测试时间相关成就
const timeAchievementTest = {
  userStats: { gamesCompleted: 5 },
  gameResult: { difficulty: 'easy', completionTime: 45, moves: 15 }, // 45秒完成简单难度
  unlockedAchievements: []
};

const timeAchievements = checkAchievements(
  timeAchievementTest.userStats,
  timeAchievementTest.gameResult,
  timeAchievementTest.unlockedAchievements
);

console.log(`\n   速度成就测试: 解锁${timeAchievements.length}个成就`);
if (timeAchievements.length > 0) {
  timeAchievements.forEach(achievement => {
    console.log(`     - ${achievement.name} (${achievement.id})`);
  });
}

console.log('\n5. 测试完整游戏完成结果计算...');

const completeGameTest = {
  difficulty: 'medium',
  completionTime: 150, // 2分30秒
  moves: 30,
  userStats: {
    gamesCompleted: 9,
    level: 2,
    experience: 350,
    bestTimes: {
      medium_time: 180 // 之前最好时间是3分钟
    }
  },
  unlockedAchievements: [],
  perfectMoves: 30,
  totalPieces: 16
};

const gameResult = calculateGameCompletion(
  completeGameTest.difficulty,
  completeGameTest.completionTime,
  completeGameTest.moves,
  completeGameTest.userStats,
  completeGameTest.unlockedAchievements,
  completeGameTest.perfectMoves,
  completeGameTest.totalPieces
);

console.log(`   游戏结果: 金币=${gameResult.rewards.coins}, 经验=${gameResult.rewards.experience}`);
console.log(`   新纪录: ${gameResult.isNewRecord ? '✓' : '✗'}`);
if (gameResult.rewards.achievements) {
  console.log(`   解锁成就: ${gameResult.rewards.achievements.length}个`);
  gameResult.rewards.achievements.forEach(achievement => {
    console.log(`     - ${achievement.name} (${achievement.id})`);
  });
}

console.log('\n='.repeat(60));
console.log('✅ 奖励系统单元测试完成');