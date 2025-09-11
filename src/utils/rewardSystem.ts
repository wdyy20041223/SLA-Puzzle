/**
 * 游戏奖励和成就系统
 */

import { DifficultyLevel, GameReward, Achievement, GameCompletionResult } from '../types';

// 基础奖励配置
const BASE_REWARDS = {
  easy: { coins: 10, experience: 5 },
  medium: { coins: 20, experience: 15 },
  hard: { coins: 35, experience: 30 },
  expert: { coins: 50, experience: 50 },
};

// 成就定义
const ACHIEVEMENTS: Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
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

  // 新增成就定义
  lightning_fast: {
    id: 'lightning_fast',
    name: '闪电快手',
    description: '在1分钟内完成简单难度拼图',
    icon: '⚡',
    category: 'performance'
  },
  easy_master: {
    id: 'easy_master',
    name: '简单模式专家',
    description: '完成20个简单难度拼图',
    icon: '😊',
    category: 'progress'
  },
  hard_challenger: {
    id: 'hard_challenger',
    name: '困难挑战者',
    description: '完成10个困难难度拼图',
    icon: '😤',
    category: 'progress'
  },
  expert_elite: {
    id: 'expert_elite',
    name: '专家精英',
    description: '完成5个专家难度拼图',
    icon: '🔥',
    category: 'milestone'
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
  time_master: {
    id: 'time_master',
    name: '时间大师',
    description: '在5次游戏中都打破个人最佳记录',
    icon: '⏱️',
    category: 'performance'
  },
  no_mistakes: {
    id: 'no_mistakes',
    name: '零失误专家',
    description: '完成拼图过程中不放错任何拼块',
    icon: '🎯',
    category: 'performance'
  },
  perfectionist: {
    id: 'perfectionist',
    name: '完美主义者',
    description: '用最少步数完成拼图',
    icon: '💎',
    category: 'performance'
  },
  efficient_solver: {
    id: 'efficient_solver',
    name: '高效解谜者',
    description: '连续三次使用步数不超过总拼图数的1.5倍',
    icon: '🧠',
    category: 'performance'
  },

  // 新增超级效率者成就
  super_efficient: {
    id: 'super_efficient',
    name: '超级效率者',
    description: '用少于标准步数30%完成拼图',
    icon: '🚀',
    category: 'performance'
  },

  expert_speedster: {
    id: 'expert_speedster',
    name: '专家速度王',
    description: '在10分钟内完成专家难度拼图',
    icon: '🏎️',
    category: 'performance'
  },
  consecutive_days: {
    id: 'consecutive_days',
    name: '坚持不懈',
    description: '连续7天完成拼图',
    icon: '📅',
    category: 'special'
  }
};

/**
 * 计算游戏完成奖励
 * @param difficulty 难度等级
 * @param completionTime 完成时间(秒)
 * @param moves 使用步数
 * @param perfectMoves 理想步数
 * @returns 奖励信息
 */
export function calculateGameRewards(
  difficulty: DifficultyLevel,
  completionTime: number,
  moves: number,
  perfectMoves?: number
): GameReward {
  const baseReward = BASE_REWARDS[difficulty];
  let coinMultiplier = 1;
  let expMultiplier = 1;

  // 时间奖励
  const timeThresholds = {
    easy: 120,    // 2分钟
    medium: 180,  // 3分钟
    hard: 300,    // 5分钟
    expert: 600   // 10分钟
  };

  if (completionTime <= timeThresholds[difficulty]) {
    coinMultiplier += 0.5; // 快速完成奖励50%金币
    expMultiplier += 0.3;  // 快速完成奖励30%经验
  }

  // 步数效率奖励
  if (perfectMoves && moves <= perfectMoves) {
    coinMultiplier += 1.0; // 完美步数奖励100%金币
    expMultiplier += 0.5;  // 完美步数奖励50%经验
  } else if (perfectMoves && moves <= perfectMoves * 1.2) {
    coinMultiplier += 0.3; // 优秀步数奖励30%金币
    expMultiplier += 0.2;  // 优秀步数奖励20%经验
  }

  // 难度奖励
  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
    expert: 2.0
  };

  const finalCoinMultiplier = coinMultiplier * difficultyMultipliers[difficulty];
  const finalExpMultiplier = expMultiplier * difficultyMultipliers[difficulty];

  return {
    coins: Math.round(baseReward.coins * finalCoinMultiplier),
    experience: Math.round(baseReward.experience * finalExpMultiplier),
  };
}

/**
 * 检查并解锁成就
 * @param userStats 用户统计信息
 * @param gameResult 游戏结果
 * @returns 新解锁的成就列表
 */
export function checkAchievements(
  userStats: {
    gamesCompleted: number;
    level: number;
    lastPlayDate?: Date;
    bestTimes?: Record<string, number>;
    recentGameResults?: Array<{
      moves: number;
      totalPieces: number;
      timestamp: Date;
    }>;
  },
  gameResult: {
    difficulty: DifficultyLevel;
    completionTime: number;
    moves: number;
    perfectMoves?: number;
    totalPieces?: number;
  },
  unlockedAchievements: string[] = []
): Achievement[] {
  const newAchievements: Achievement[] = [];
  const now = new Date();

  // ✅ 在成就检查时使用即将完成的游戏数（当前值+1）
  const completedGamesAfterThis = userStats.gamesCompleted + 1;

  // 调试输出
  console.log('🔍 成就检查开始:', {
    当前游戏完成数: userStats.gamesCompleted,
    完成本局后游戏数: completedGamesAfterThis,
    gameResult,
    currentTime: now.toLocaleString(),
    hour: now.getHours(),
    day: now.getDay(),
    unlockedAchievements
  });

  // 创建一个增强的成就检查函数，包含多重验证
  const shouldUnlockAchievement = (achievementId: string, condition: boolean, reason: string): boolean => {
    // 基础检查：条件是否满足
    if (!condition) {
      return false;
    }

    // 检查是否已在解锁列表中
    if (unlockedAchievements.includes(achievementId)) {
      console.log(`⚠️ 成就 ${achievementId} 已解锁，跳过重复触发 (${reason})`);
      return false;
    }

    // 检查是否已在本次检查中解锁（防止函数内重复）
    if (newAchievements.some(a => a.id === achievementId)) {
      console.log(`⚠️ 成就 ${achievementId} 已在本次检查中解锁，跳过 (${reason})`);
      return false;
    }

    console.log(`✅ 成就 ${achievementId} 满足解锁条件 (${reason})`);
    return true;
  };

  // 检查进度成就（基于完成本局后的游戏数）
  if (shouldUnlockAchievement('first_game', completedGamesAfterThis === 1, `首次游戏: ${completedGamesAfterThis}局`)) {
    console.log('🎉 触发首次游戏成就');
    newAchievements.push({
      ...ACHIEVEMENTS.first_game,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (shouldUnlockAchievement('games_10', completedGamesAfterThis === 10, `10局游戏: ${completedGamesAfterThis}局`)) {
    console.log('🎉 触发10局游戏成就');
    newAchievements.push({
      ...ACHIEVEMENTS.games_10,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (shouldUnlockAchievement('games_50', completedGamesAfterThis === 50, `50局游戏: ${completedGamesAfterThis}局`)) {
    console.log('🎉 触发50局游戏成就');
    newAchievements.push({
      ...ACHIEVEMENTS.games_50,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (shouldUnlockAchievement('games_100', completedGamesAfterThis === 100, `100局游戏: ${completedGamesAfterThis}局`)) {
    console.log('🎉 触发100局游戏成就');
    newAchievements.push({
      ...ACHIEVEMENTS.games_100,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 检查表现成就（可以叠加）
  if (shouldUnlockAchievement('speed_demon', 
      gameResult.difficulty === 'medium' && gameResult.completionTime <= 180,
      `速度恶魔: ${gameResult.difficulty}难度 ${gameResult.completionTime}秒`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.speed_demon,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 闪电快手：1分钟内完成简单难度拼图
  if (shouldUnlockAchievement('lightning_fast',
      gameResult.difficulty === 'easy' && gameResult.completionTime <= 60,
      `闪电快手: ${gameResult.difficulty}难度 ${gameResult.completionTime}秒`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.lightning_fast,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 难度相关成就 - 需要基于统计数据判断
  // 注意：这些成就需要在用户数据中跟踪各难度的完成次数
  // 目前的实现是简化版，实际应该在游戏完成时更新用户的难度统计
  
  // 由于没有准确的难度统计，这些成就暂时不在此处自动解锁
  // 应该在用户数据更新时，根据累计的难度完成次数来判断
  
  // 如果要启用，需要先实现用户数据中的难度统计：
  // - easyCompleted: number
  // - mediumCompleted: number  
  // - hardCompleted: number
  // - expertCompleted: number

  // 检查步数相关成就（允许同时获得多个）
  if (gameResult.perfectMoves) {
    // 完美主义者：用最少步数完成
    if (shouldUnlockAchievement('perfectionist',
        gameResult.moves === gameResult.perfectMoves,
        `完美主义者: ${gameResult.moves}/${gameResult.perfectMoves}步`)) {
      newAchievements.push({
        ...ACHIEVEMENTS.perfectionist,
        unlocked: true,
        unlockedAt: now
      });
    }

    // 高效解密者：连续三次使用步数不超过总拼图数的1.5倍
    if (gameResult.totalPieces && !unlockedAchievements.includes('efficient_solver')) {
      // 获取最近的游戏结果（不包括当前这局）
      const recentGames = userStats.recentGameResults || [];
      const currentGame = {
        moves: gameResult.moves,
        totalPieces: gameResult.totalPieces,
        timestamp: new Date()
      };
      
      // 将当前游戏结果加入历史记录
      const allGames = [...recentGames, currentGame];
      
      console.log('🧠 高效解密者检查:', {
        recentGames: recentGames.length,
        currentGame,
        allGames: allGames.length,
        requirement: '连续三次步数 <= 总拼图数 * 1.5'
      });
      
      // 检查最近的三局游戏是否都符合条件
      if (allGames.length >= 3) {
        const lastThreeGames = allGames.slice(-3);
        const criteria = lastThreeGames.map(game => ({
          moves: game.moves,
          maxAllowed: game.totalPieces * 1.5,
          meets: game.moves <= game.totalPieces * 1.5
        }));
        
        const allMeetCriteria = criteria.every(c => c.meets);
        
        console.log('🧠 高效解密者详细检查:', {
          lastThreeGames: criteria,
          allMeetCriteria
        });
        
        if (shouldUnlockAchievement('efficient_solver', allMeetCriteria, '高效解密者: 连续三局游戏符合条件')) {
          newAchievements.push({
            ...ACHIEVEMENTS.efficient_solver,
            unlocked: true,
            unlockedAt: now
          });
        }
      } else {
        console.log('🧠 高效解密者: 游戏次数不足3次', { totalGames: allGames.length });
      }
    }

    // 新增：超级效率者成就（用不超过标准步数25%完成）
    if (shouldUnlockAchievement('super_efficient',
        gameResult.moves <= gameResult.perfectMoves * 0.3,
        `超级效率者: ${gameResult.moves}/${gameResult.perfectMoves}步`)) {
      newAchievements.push({
        ...ACHIEVEMENTS.super_efficient,
        unlocked: true,
        unlockedAt: now
      });
    }
  }

  // 检查特殊时间和难度组合成就
  const hour = now.getHours();
  if (shouldUnlockAchievement('night_owl', hour >= 2 && hour <= 6, `夜猫子: ${hour}点`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.night_owl,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 早起鸟成就（5-7点完成游戏）
  if (shouldUnlockAchievement('early_bird', hour >= 5 && hour <= 7, `早起鸟儿: ${hour}点`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.early_bird,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 新增：周末战士（周末完成游戏）
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  if (shouldUnlockAchievement('weekend_warrior', isWeekend, `周末战士: 星期${now.getDay()}`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.weekend_warrior,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 新增：专家难度+速度双重成就
  if (shouldUnlockAchievement('expert_speedster', 
      gameResult.difficulty === 'expert' && gameResult.completionTime <= 600,
      `专家速度手: ${gameResult.difficulty}难度 ${gameResult.completionTime}秒`)) {
    newAchievements.push({
      ...ACHIEVEMENTS.expert_speedster,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 时间大师成就 - 打破个人最佳记录
  if (userStats.bestTimes) {
    const difficultyKey = `${gameResult.difficulty}_time`;
    const previousBest = userStats.bestTimes[difficultyKey];
    if (shouldUnlockAchievement('time_master',
        !!(previousBest && gameResult.completionTime < previousBest),
        `时间大师: ${gameResult.completionTime}秒 < ${previousBest}秒`)) {
      newAchievements.push({
        ...ACHIEVEMENTS.time_master,
        unlocked: true,
        unlockedAt: now
      });
    }
  }

  // 调试输出最终结果
  console.log('🎉 成就检查完成:', {
    totalAchievements: newAchievements.length,
    achievements: newAchievements.map(a => ({ id: a.id, name: a.name }))
  });

  return newAchievements;
}

/**
 * 计算完整的游戏完成结果
 * @param difficulty 难度
 * @param completionTime 完成时间
 * @param moves 步数
 * @param userStats 用户统计
 * @param unlockedAchievements 已解锁成就
 * @param perfectMoves 理想步数
 * @param totalPieces 总拼图块数
 * @returns 完整的游戏结果
 */
export function calculateGameCompletion(
  difficulty: DifficultyLevel,
  completionTime: number,
  moves: number,
  userStats: {
    gamesCompleted: number;
    level: number;
    experience: number;
    bestTimes?: Record<string, number>;
    recentGameResults?: Array<{
      moves: number;
      totalPieces: number;
      timestamp: Date;
    }>;
    difficultyStats?: {
      easyCompleted: number;
      mediumCompleted: number;
      hardCompleted: number;
      expertCompleted: number;
    };
  },
  unlockedAchievements: string[] = [],
  perfectMoves?: number,
  totalPieces?: number
): GameCompletionResult {
  // 计算基础奖励
  const baseRewards = calculateGameRewards(difficulty, completionTime, moves, perfectMoves);
  
  // 检查新解锁的成就
  const newAchievements = checkAchievements(
    userStats,
    { difficulty, completionTime, moves, perfectMoves, totalPieces },
    unlockedAchievements
  );

  // 过滤掉不在官方成就列表中的成就，防止显示未定义的成就
  const officialAchievementIds = getOfficialAchievementIds();
  const filteredAchievements = newAchievements.filter(achievement => 
    officialAchievementIds.includes(achievement.id)
  );

  console.log('🔍 成就过滤结果:', {
    原始成就数量: newAchievements.length,
    过滤后成就数量: filteredAchievements.length,
    被过滤的成就: newAchievements.filter(a => !officialAchievementIds.includes(a.id)).map(a => a.name),
    保留的成就: filteredAchievements.map(a => a.name)
  });

  // 成就奖励（基于过滤后的成就）
  let achievementCoins = 0;
  let achievementExp = 0;
  
  filteredAchievements.forEach(achievement => {
    switch (achievement.category) {
      case 'progress':
        achievementCoins += 25;
        achievementExp += 20;
        break;
      case 'performance':
        achievementCoins += 50;
        achievementExp += 40;
        break;
      case 'special':
        achievementCoins += 30;
        achievementExp += 25;
        break;
      case 'milestone':
        achievementCoins += 100;
        achievementExp += 80;
        break;
    }
  });

  // 检查是否是新记录
  const difficultyKey = `${difficulty}_time`;
  const isNewRecord = !userStats.bestTimes?.[difficultyKey] || 
                     completionTime < userStats.bestTimes[difficultyKey];

  // 新记录奖励
  if (isNewRecord) {
    achievementCoins += 20;
    achievementExp += 15;
  }

  const finalRewards: GameReward = {
    coins: baseRewards.coins + achievementCoins,
    experience: baseRewards.experience + achievementExp,
    achievements: filteredAchievements.length > 0 ? filteredAchievements : undefined
  };

  return {
    completionTime,
    moves,
    difficulty,
    isNewRecord,
    totalPieces,
    rewards: finalRewards
  };
}

/**
 * 获取官方成就ID列表（从成就数据文件中提取）
 * 只有在这个列表中的成就才会在游戏结算时显示
 */
function getOfficialAchievementIds(): string[] {
  return [
    // 基础进度成就
    'first_game',
    'games_10', 
    'games_50',
    'games_100',
    'games_500',
    
    // 难度专精成就
    'easy_master',
    'hard_challenger', 
    'expert_elite',
    
    // 速度成就
    'speed_demon',
    // 'speed_runner', // 移除：速度跑者成就
    'lightning_fast',
    'time_master',
    
    // 技巧成就
    'perfectionist',
    'efficient_solver',
    'no_mistakes',
    
    // 特殊时间成就
    'night_owl',
    'early_bird', 
    'weekend_warrior',
    
    // 等级成就
    // 'level_up', // 移除：等级提升成就
    'level_10',
    'level_25',
    'max_level'
  ];
}

/**
 * 获取所有可用成就
 * @returns 成就列表
 */
export function getAllAchievements(): Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> {
  return ACHIEVEMENTS;
}
