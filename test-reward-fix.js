/**
 * 金币奖励同步问题修复验证脚本
 * 用于验证修复后的奖励计算系统是否正常工作
 */

import { runRewardTests, validateGameReward, compareRewards } from '../src/utils/rewardDebugger';
import { DifficultyLevel } from '../src/types';

console.log('🚀 开始验证金币奖励同步修复...\n');

// 1. 运行预定义的测试用例
console.log('📋 Step 1: 运行预定义测试用例');
runRewardTests();

console.log('\n📋 Step 2: 验证具体场景的奖励计算');

// 2. 测试各种场景的奖励计算
const testScenarios = [
  {
    name: '简单难度 - 正常完成',
    difficulty: 'easy' as DifficultyLevel,
    completionTime: 150,
    moves: 25,
    perfectMoves: 20
  },
  {
    name: '中等难度 - 快速完成',
    difficulty: 'medium' as DifficultyLevel,
    completionTime: 120,
    moves: 18,
    perfectMoves: 18
  },
  {
    name: '困难难度 - 优秀步数',
    difficulty: 'hard' as DifficultyLevel,
    completionTime: 400,
    moves: 22,
    perfectMoves: 20
  },
  {
    name: '专家难度 - 完美组合',
    difficulty: 'expert' as DifficultyLevel,
    completionTime: 500,
    moves: 15,
    perfectMoves: 15
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n🎯 测试场景 ${index + 1}: ${scenario.name}`);
  
  const result = validateGameReward(
    scenario.difficulty,
    scenario.completionTime,
    scenario.moves,
    scenario.perfectMoves
  );
  
  console.log('✅ 基础奖励:', result.baseReward);
  console.log('🏆 完整奖励:', result.finalReward.rewards);
});

console.log('\n📋 Step 3: 测试前后端奖励差异比较');

// 3. 模拟前后端奖励差异的情况
const mockScenarios = [
  {
    name: '完全匹配',
    frontend: { coins: 30, experience: 18 },
    backend: { coins: 30, experience: 18 }
  },
  {
    name: '金币少给',
    frontend: { coins: 50, experience: 30 },
    backend: { coins: 35, experience: 30 }
  },
  {
    name: '经验少给',
    frontend: { coins: 25, experience: 20 },
    backend: { coins: 25, experience: 15 }
  },
  {
    name: '都有差异',
    frontend: { coins: 75, experience: 45 },
    backend: { coins: 60, experience: 35 }
  }
];

mockScenarios.forEach((scenario, index) => {
  console.log(`\n🔍 差异测试 ${index + 1}: ${scenario.name}`);
  compareRewards(scenario.frontend, scenario.backend);
});

console.log('\n✅ 验证完成！');
console.log('\n📋 使用说明:');
console.log('1. 在游戏中完成拼图时，查看浏览器控制台的详细日志');
console.log('2. 检查是否有奖励不匹配的警告信息');
console.log('3. 使用 rewardDebug.* 系列函数进行实时调试');
console.log('4. 配置可以在 src/utils/rewardConfig.ts 中调整');
