/**
 * 奖励系统配置文件
 * 用于控制奖励计算和调试功能
 */

// 调试配置
export const REWARD_DEBUG_CONFIG = {
  // 是否启用详细日志
  enableDetailedLogging: import.meta.env.DEV, // 只在开发模式启用
  
  // 是否启用奖励验证
  enableRewardValidation: true,
  
  // 是否启用自动补偿机制
  enableAutoCompensation: true,
  
  // 补偿阈值（金币/经验差异超过此值时不自动补偿）
  compensationThreshold: {
    coins: 1000, // 金币差异超过1000时不补偿
    experience: 500 // 经验差异超过500时不补偿
  },
  
  // 是否在控制台暴露调试工具
  exposeDebugTools: import.meta.env.DEV
};

// 奖励计算配置
export const REWARD_CALCULATION_CONFIG = {
  // 基础奖励
  baseRewards: {
    easy: { coins: 10, experience: 5 },
    medium: { coins: 20, experience: 15 },
    hard: { coins: 35, experience: 30 },
    expert: { coins: 50, experience: 50 },
  },
  
  // 时间阈值（秒）
  timeThresholds: {
    easy: 120,    // 2分钟
    medium: 180,  // 3分钟
    hard: 300,    // 5分钟
    expert: 600   // 10分钟
  },
  
  // 倍数配置
  multipliers: {
    // 时间奖励倍数
    fastCompletion: {
      coins: 0.5,
      experience: 0.3
    },
    
    // 步数奖励倍数
    perfectMoves: {
      coins: 1.0,
      experience: 0.5
    },
    
    excellentMoves: {
      coins: 0.3,
      experience: 0.2
    },
    
    // 难度倍数
    difficulty: {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5,
      expert: 2.0
    }
  },
  
  // 成就奖励
  achievementRewards: {
    progress: { coins: 25, experience: 20 },
    performance: { coins: 50, experience: 40 },
    special: { coins: 30, experience: 25 },
    milestone: { coins: 100, experience: 80 }
  },
  
  // 新记录奖励
  newRecordReward: {
    coins: 20,
    experience: 15
  }
};

/**
 * 获取调试日志函数
 */
export function getLogger(module: string) {
  return {
    info: (message: string, data?: any) => {
      if (REWARD_DEBUG_CONFIG.enableDetailedLogging) {
        console.log(`🎯 [${module}] ${message}`, data || '');
      }
    },
    warn: (message: string, data?: any) => {
      console.warn(`⚠️ [${module}] ${message}`, data || '');
    },
    error: (message: string, data?: any) => {
      console.error(`❌ [${module}] ${message}`, data || '');
    },
    debug: (message: string, data?: any) => {
      if (REWARD_DEBUG_CONFIG.enableDetailedLogging) {
        console.debug(`🔍 [${module}] ${message}`, data || '');
      }
    }
  };
}

/**
 * 验证奖励配置的完整性
 */
export function validateRewardConfig(): boolean {
  const logger = getLogger('Config');
  
  try {
    // 检查基础奖励配置
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
    for (const difficulty of difficulties) {
      if (!REWARD_CALCULATION_CONFIG.baseRewards[difficulty]) {
        logger.error(`缺少 ${difficulty} 难度的基础奖励配置`);
        return false;
      }
    }
    
    // 检查时间阈值配置
    for (const difficulty of difficulties) {
      if (!REWARD_CALCULATION_CONFIG.timeThresholds[difficulty]) {
        logger.error(`缺少 ${difficulty} 难度的时间阈值配置`);
        return false;
      }
    }
    
    logger.info('奖励配置验证通过');
    return true;
  } catch (error) {
    logger.error('奖励配置验证失败:', error);
    return false;
  }
}

// 在模块加载时验证配置
validateRewardConfig();
