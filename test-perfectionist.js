/**
 * 完美主义者成就测试脚本
 * 用于验证完美主义者成就的触发和显示逻辑
 */

import { calculateGameCompletion } from '../src/utils/rewardSystem';
import { DifficultyLevel } from '../src/types';

// 测试数据
const testUserStats = {
  gamesCompleted: 5,
  level: 2,
  experience: 150,
  bestTimes: {
    easy_time: 120,
    medium_time: 300
  },
  recentGameResults: [
    { moves: 16, totalPieces: 9, timestamp: new Date() },
    { moves: 25, totalPieces: 16, timestamp: new Date() }
  ],
  difficultyStats: {
    easyCompleted: 3,
    mediumCompleted: 2,
    hardCompleted: 0,
    expertCompleted: 0
  }
};

const testCases = [
  {
    name: '完美主义者成就 - 简单难度，最少步数',
    difficulty: 'easy' as DifficultyLevel,
    completionTime: 60,
    moves: 9, // 3x3拼图的最少步数
    perfectMoves: 9,
    totalPieces: 9,
    expectedAchievement: 'perfectionist'
  },
  {
    name: '完美主义者成就 - 中等难度，最少步数',
    difficulty: 'medium' as DifficultyLevel,
    completionTime: 120,
    moves: 16, // 4x4拼图的最少步数
    perfectMoves: 16,
    totalPieces: 16,
    expectedAchievement: 'perfectionist'
  },
  {
    name: '非完美主义者 - 步数多于最少步数',
    difficulty: 'easy' as DifficultyLevel,
    completionTime: 80,
    moves: 15, // 多于最少步数
    perfectMoves: 9,
    totalPieces: 9,
    expectedAchievement: null
  }
];

console.log('🧪 开始测试完美主义者成就逻辑...\n');

testCases.forEach((testCase, index) => {
  console.log(`📋 测试用例 ${index + 1}: ${testCase.name}`);

  const result = calculateGameCompletion(
    testCase.difficulty,
    testCase.completionTime,
    testCase.moves,
    testUserStats,
    [], // 空成就列表
    testCase.perfectMoves,
    testCase.totalPieces
  );

  console.log('  输入参数:', {
    难度: testCase.difficulty,
    完成时间: testCase.completionTime,
    实际步数: testCase.moves,
    理想步数: testCase.perfectMoves,
    总拼图块: testCase.totalPieces
  });

  console.log('  计算结果:', {
    金币奖励: result.rewards.coins,
    经验奖励: result.rewards.experience,
    新成就数量: result.rewards.achievements?.length || 0,
    新成就列表: result.rewards.achievements?.map(a => a.name) || []
  });

  const hasPerfectionist = result.rewards.achievements?.some(a => a.id === 'perfectionist');

  if (testCase.expectedAchievement === 'perfectionist') {
    if (hasPerfectionist) {
      console.log('  ✅ 结果正确：完美主义者成就已触发');
    } else {
      console.log('  ❌ 结果错误：完美主义者成就未触发');
    }
  } else {
    if (!hasPerfectionist) {
      console.log('  ✅ 结果正确：完美主义者成就未触发');
    } else {
      console.log('  ❌ 结果错误：完美主义者成就不应触发');
    }
  }

  console.log('');
});

console.log('🎉 完美主义者成就测试完成！');</content>
<parameter name="filePath">c:\Users\invain\Desktop\SLA-Puzzle\test-perfectionist.js
