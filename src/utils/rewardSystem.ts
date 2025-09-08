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
    description: '用少于标准步数50%完成拼图',
    icon: '🧠',
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
  consecutive_days: {
    id: 'consecutive_days',
    name: '坚持不懈',
    description: '连续7天完成拼图',
    icon: '📅',
    category: 'special'
  },
  level_up: {
    id: 'level_up',
    name: '等级提升',
    description: '升级到新等级',
    icon: '⬆️',
    category: 'milestone'
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
  },
  gameResult: {
    difficulty: DifficultyLevel;
    completionTime: number;
    moves: number;
    perfectMoves?: number;
  },
  unlockedAchievements: string[] = []
): Achievement[] {
  const newAchievements: Achievement[] = [];
  const now = new Date();

  // 检查进度成就
  if (userStats.gamesCompleted === 1 && !unlockedAchievements.includes('first_game')) {
    newAchievements.push({
      ...ACHIEVEMENTS.first_game,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (userStats.gamesCompleted === 10 && !unlockedAchievements.includes('games_10')) {
    newAchievements.push({
      ...ACHIEVEMENTS.games_10,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (userStats.gamesCompleted === 50 && !unlockedAchievements.includes('games_50')) {
    newAchievements.push({
      ...ACHIEVEMENTS.games_50,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (userStats.gamesCompleted === 100 && !unlockedAchievements.includes('games_100')) {
    newAchievements.push({
      ...ACHIEVEMENTS.games_100,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 检查表现成就
  if (gameResult.difficulty === 'medium' && 
      gameResult.completionTime <= 180 && 
      !unlockedAchievements.includes('speed_demon')) {
    newAchievements.push({
      ...ACHIEVEMENTS.speed_demon,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (gameResult.perfectMoves && 
      gameResult.moves === gameResult.perfectMoves && 
      !unlockedAchievements.includes('perfectionist')) {
    newAchievements.push({
      ...ACHIEVEMENTS.perfectionist,
      unlocked: true,
      unlockedAt: now
    });
  }

  if (gameResult.perfectMoves && 
      gameResult.moves <= gameResult.perfectMoves * 0.5 && 
      !unlockedAchievements.includes('efficient_solver')) {
    newAchievements.push({
      ...ACHIEVEMENTS.efficient_solver,
      unlocked: true,
      unlockedAt: now
    });
  }

  // 检查特殊成就
  const hour = now.getHours();
  if (hour >= 2 && hour <= 6 && !unlockedAchievements.includes('night_owl')) {
    newAchievements.push({
      ...ACHIEVEMENTS.night_owl,
      unlocked: true,
      unlockedAt: now
    });
  }

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
  },
  unlockedAchievements: string[] = [],
  perfectMoves?: number
): GameCompletionResult {
  // 计算基础奖励
  const baseRewards = calculateGameRewards(difficulty, completionTime, moves, perfectMoves);
  
  // 检查新解锁的成就
  const newAchievements = checkAchievements(
    userStats,
    { difficulty, completionTime, moves, perfectMoves },
    unlockedAchievements
  );

  // 成就奖励
  let achievementCoins = 0;
  let achievementExp = 0;
  
  newAchievements.forEach(achievement => {
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
    achievements: newAchievements.length > 0 ? newAchievements : undefined
  };

  return {
    completionTime,
    moves,
    difficulty,
    isNewRecord,
    rewards: finalRewards
  };
}

/**
 * 获取所有可用成就
 * @returns 成就列表
 */
export function getAllAchievements(): Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> {
  return ACHIEVEMENTS;
}
