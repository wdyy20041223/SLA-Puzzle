/**
 * 奖励系统验证和调试工具
 * 用于验证前后端奖励计算的一致性
 */

import { DifficultyLevel, GameReward } from '../types';
import { calculateGameRewards, calculateGameCompletion } from './rewardSystem';
import { REWARD_DEBUG_CONFIG, getLogger } from './rewardConfig';

const logger = getLogger('RewardDebugger');

// 测试用例接口
interface RewardTestCase {
  name: string;
  difficulty: DifficultyLevel;
  completionTime: number;
  moves: number;
  perfectMoves?: number;
  userStats?: {
    gamesCompleted: number;
    level: number;
    experience: number;
    bestTimes?: Record<string, number>;
  };
  expectedBaseCoins?: number;
  expectedBaseExp?: number;
}

// 预定义测试用例
const TEST_CASES: RewardTestCase[] = [
  {
    name: '简单难度 - 基础奖励',
    difficulty: 'easy',
    completionTime: 180, // 3分钟，超过快速完成时间
    moves: 30,
    perfectMoves: 25,
    expectedBaseCoins: 10, // 基础奖励
    expectedBaseExp: 5
  },
  {
    name: '简单难度 - 快速完成',
    difficulty: 'easy',
    completionTime: 90, // 1.5分钟，快速完成
    moves: 30,
    perfectMoves: 25,
    expectedBaseCoins: 15, // 10 * 1.5 = 15
    expectedBaseExp: 7 // 5 * 1.3 = 6.5 → 7
  },
  {
    name: '中等难度 - 完美步数',
    difficulty: 'medium',
    completionTime: 200, // 超过快速完成时间
    moves: 20,
    perfectMoves: 20, // 完美步数
    expectedBaseCoins: 48, // 20 * 2.0 * 1.2 = 48
    expectedBaseExp: 34 // 15 * 1.5 * 1.2 = 27 → 34
  },
  {
    name: '专家难度 - 完美组合',
    difficulty: 'expert',
    completionTime: 300, // 5分钟，快速完成
    moves: 15,
    perfectMoves: 15, // 完美步数
    expectedBaseCoins: 300, // 50 * (1 + 0.5 + 1.0) * 2.0 = 250
    expectedBaseExp: 180 // 50 * (1 + 0.3 + 0.5) * 2.0 = 180
  }
];

/**
 * 运行奖励计算测试
 */
export function runRewardTests(): void {
  logger.info('开始运行奖励系统测试...\n');
  
  TEST_CASES.forEach((testCase, index) => {
    logger.info(`测试 ${index + 1}: ${testCase.name}`);
    logger.debug('输入参数:', {
      difficulty: testCase.difficulty,
      completionTime: testCase.completionTime,
      moves: testCase.moves,
      perfectMoves: testCase.perfectMoves
    });
    
    const result = calculateGameRewards(
      testCase.difficulty,
      testCase.completionTime,
      testCase.moves,
      testCase.perfectMoves
    );
    
    logger.info('计算结果:', result);
    
    // 验证预期结果
    if (testCase.expectedBaseCoins !== undefined) {
      const coinsMatch = result.coins === testCase.expectedBaseCoins;
      logger.info(`金币验证: ${coinsMatch ? '✅' : '❌'} 预期=${testCase.expectedBaseCoins}, 实际=${result.coins}`);
    }
    
    if (testCase.expectedBaseExp !== undefined) {
      const expMatch = result.experience === testCase.expectedBaseExp;
      logger.info(`经验验证: ${expMatch ? '✅' : '❌'} 预期=${testCase.expectedBaseExp}, 实际=${result.experience}`);
    }
    
    logger.info('---\n');
  });
  
  logger.info('测试完成!');
}

/**
 * 验证特定游戏结果的奖励计算
 */
export function validateGameReward(
  difficulty: DifficultyLevel,
  completionTime: number,
  moves: number,
  perfectMoves?: number,
  userStats?: any
): { baseReward: GameReward; finalReward: any } {
  logger.info('验证游戏奖励计算...');
  
  // 计算基础奖励
  const baseReward = calculateGameRewards(difficulty, completionTime, moves, perfectMoves);
  
  // 计算完整奖励（包括成就等）
  const mockUserStats = userStats || {
    gamesCompleted: 0,
    level: 1,
    experience: 0,
    bestTimes: {}
  };
  
  const finalReward = calculateGameCompletion(
    difficulty,
    completionTime,
    moves,
    mockUserStats,
    [],
    perfectMoves
  );
  
  return { baseReward, finalReward };
}

/**
 * 比较前后端奖励差异
 */
export function compareRewards(
  frontendReward: GameReward,
  backendActualGain: { coins: number; experience: number }
): void {
  logger.info('比较前后端奖励差异:');
  
  const coinDiff = backendActualGain.coins - frontendReward.coins;
  const expDiff = backendActualGain.experience - frontendReward.experience;
  
  logger.info('金币对比:', {
    前端计算: frontendReward.coins,
    后端实际: backendActualGain.coins,
    差异: coinDiff,
    匹配: coinDiff === 0 ? '✅' : '❌'
  });
  
  logger.info('经验对比:', {
    前端计算: frontendReward.experience,
    后端实际: backendActualGain.experience,
    差异: expDiff,
    匹配: expDiff === 0 ? '✅' : '❌'
  });
  
  if (coinDiff !== 0 || expDiff !== 0) {
    logger.warn('发现前后端奖励不匹配!');
    if (Math.abs(coinDiff) > frontendReward.coins * 0.1) {
      logger.error('金币差异超过10%，可能存在严重问题!');
    }
    if (Math.abs(expDiff) > frontendReward.experience * 0.1) {
      logger.error('经验差异超过10%，可能存在严重问题!');
    }
  } else {
    logger.info('前后端奖励完全匹配!');
  }
}

/**
 * 开发者工具：在控制台运行测试
 */
if (typeof window !== 'undefined' && REWARD_DEBUG_CONFIG.exposeDebugTools) {
  // 将工具函数暴露到全局，方便在浏览器控制台调试
  (window as any).rewardDebug = {
    runTests: runRewardTests,
    validate: validateGameReward,
    compare: compareRewards
  };
  
  logger.info('奖励调试工具已加载，可在控制台使用:');
  logger.info('  rewardDebug.runTests() - 运行测试');
  logger.info('  rewardDebug.validate(difficulty, time, moves, perfect) - 验证计算');
  logger.info('  rewardDebug.compare(frontend, backend) - 比较差异');
}
