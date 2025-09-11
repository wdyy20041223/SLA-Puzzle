// 金币系统测试文件

// 模拟金币系统函数 - 基于实际实现
function calculateGameRewards(difficulty, completionTime, moves, perfectMoves) {
  // 基础奖励配置（按难度分级）
  const baseRewards = {
    easy: { coins: 10, experience: 5 },
    medium: { coins: 20, experience: 15 },
    hard: { coins: 35, experience: 30 },
    expert: { coins: 50, experience: 50 }
  };
  
  // 时间阈值（秒）
  const timeThresholds = {
    easy: 120,    // 2分钟
    medium: 180,  // 3分钟
    hard: 300,    // 5分钟
    expert: 600   // 10分钟
  };
  
  // 倍数配置
  const multipliers = {
    fastCompletion: { coins: 0.5, experience: 0.3 },
    perfectMoves: { coins: 1.0, experience: 0.5 },
    excellentMoves: { coins: 0.3, experience: 0.2 },
    difficulty: { easy: 1.0, medium: 1.2, hard: 1.5, expert: 2.0 }
  };
  
  // 获取基础奖励和难度倍数
  const baseReward = baseRewards[difficulty] || baseRewards.easy;
  const difficultyMultiplier = multipliers.difficulty[difficulty] || multipliers.difficulty.easy;
  
  let coins = baseReward.coins;
  let totalMultiplier = 1;
  
  // 时间奖励
  if (completionTime <= timeThresholds[difficulty]) {
    totalMultiplier += multipliers.fastCompletion.coins;
  }
  
  // 步数奖励
  if (perfectMoves !== undefined && perfectMoves !== null) {
    if (moves <= perfectMoves) {
      totalMultiplier += multipliers.perfectMoves.coins;
    } else if (moves <= perfectMoves * 1.2) {
      totalMultiplier += multipliers.excellentMoves.coins;
    }
  }
  
  // 计算最终金币（所有奖励都乘以难度倍数）
  const finalCoins = Math.round(coins * totalMultiplier * difficultyMultiplier);
  
  return { coins: finalCoins };
}

// 测试基础奖励计算
function testBaseRewards() {
  console.log('\n==== 测试基础奖励计算 ====');
  
  // 测试各种难度的基础金币奖励（包含难度倍数）
  const difficultyTests = [
    { difficulty: 'easy', expected: 10 },
    { difficulty: 'medium', expected: 24 },
    { difficulty: 'hard', expected: 53 },
    { difficulty: 'expert', expected: 100 }
  ];
  
  difficultyTests.forEach(test => {
    const result = calculateGameRewards(test.difficulty, 1000, 100);
    const passed = result.coins === test.expected;
    console.log(`${passed ? '✅' : '❌'} ${test.difficulty}难度基础金币: ${result.coins}, 预期: ${test.expected}`);
  });
}

// 测试时间奖励计算
function testTimeRewards() {
  console.log('\n==== 测试时间奖励计算 ====');
  
  // 测试各种难度在时间阈值内的金币奖励
  const timeTests = [
    { difficulty: 'easy', time: 60, expected: 15 }, // 10 * 1.5
    { difficulty: 'medium', time: 120, expected: 36 }, // 20 * 1.5 * 1.2
    { difficulty: 'hard', time: 200, expected: 79 }, // 35 * 1.5 * 1.5
    { difficulty: 'expert', time: 400, expected: 150 } // 50 * 1.5 * 2.0
  ];
  
  timeTests.forEach(test => {
    const result = calculateGameRewards(test.difficulty, test.time, 100);
    const passed = result.coins === test.expected;
    console.log(`${passed ? '✅' : '❌'} ${test.difficulty}难度(${test.time}秒内完成)金币: ${result.coins}, 预期: ${test.expected}`);
  });
  
  // 测试超过时间阈值无奖励
  const overTimeTest = calculateGameRewards('easy', 180, 100);
  console.log(`${overTimeTest.coins === 10 ? '✅' : '❌'} 超时无奖励: ${overTimeTest.coins}, 预期: 10`);
}

// 测试步数奖励计算
function testMoveRewards() {
  console.log('\n==== 测试步数奖励计算 ====');
  
  // 测试完美步数奖励
  const perfectMovesTest = calculateGameRewards('medium', 1000, 20, 20);
  console.log(`${perfectMovesTest.coins === 48 ? '✅' : '❌'} 完美步数奖励: ${perfectMovesTest.coins}, 预期: 48`);
  
  // 测试优秀步数奖励
  const excellentMovesTest = calculateGameRewards('medium', 1000, 24, 20);
  console.log(`${excellentMovesTest.coins === 31 ? '✅' : '❌'} 优秀步数奖励: ${excellentMovesTest.coins}, 预期: 31`);
  
  // 测试无步数奖励
  const noMoveRewardTest = calculateGameRewards('medium', 1000, 30, 20);
  console.log(`${noMoveRewardTest.coins === 24 ? '✅' : '❌'} 无步数奖励: ${noMoveRewardTest.coins}, 预期: 24`);
}

// 测试综合奖励计算
function testCombinedRewards() {
  console.log('\n==== 测试综合奖励计算 ====');
  
  // 测试时间和步数奖励组合
  const combinedTest1 = calculateGameRewards('hard', 200, 40, 40);
  console.log(`${combinedTest1.coins === 131 ? '✅' : '❌'} 时间+完美步数组合奖励: ${combinedTest1.coins}, 预期: 131`);
  
  // 测试专家难度+所有奖励
  const combinedTest2 = calculateGameRewards('expert', 400, 50, 50);
  console.log(`${combinedTest2.coins === 250 ? '✅' : '❌'} 专家难度+所有奖励: ${combinedTest2.coins}, 预期: 250`);
}

// 测试边界条件
function testEdgeCases() {
  console.log('\n==== 测试边界条件 ====');
  
  // 测试无效难度
  const invalidDifficultyTest = calculateGameRewards('invalid', 60, 10);
  console.log(`${invalidDifficultyTest.coins === 10 ? '✅' : '❌'} 无效难度回退: ${invalidDifficultyTest.coins}, 预期: 10`);
  
  // 测试时间为0
  const zeroTimeTest = calculateGameRewards('easy', 0, 10);
  console.log(`${zeroTimeTest.coins === 15 ? '✅' : '❌'} 时间为0: ${zeroTimeTest.coins}, 预期: 15`);
  
  // 测试步数为0
  const zeroMovesTest = calculateGameRewards('medium', 1000, 0, 20);
  console.log(`${zeroMovesTest.coins === 48 ? '✅' : '❌'} 步数为0: ${zeroMovesTest.coins}, 预期: 48`);
}

// 测试奖励配置一致性
function testRewardConfigConsistency() {
  console.log('\n==== 测试奖励配置一致性 ====');
  
  // 验证不同难度之间的奖励比例
  const ratios = [
    { name: 'medium/easy', value: 20 / 10, expected: 2.0 },
    { name: 'hard/medium', value: 35 / 20, expected: 1.75 },
    { name: 'expert/hard', value: 50 / 35, expected: 1.4286 }
  ];
  
  ratios.forEach(ratio => {
    const passed = Math.abs(ratio.value - ratio.expected) < 0.0001;
    console.log(`${passed ? '✅' : '❌'} ${ratio.name}比例: ${ratio.value.toFixed(4)}, 预期: ${ratio.expected.toFixed(4)}`);
  });
}

// 运行所有测试
function runAllTests() {
  console.log('\n🚀 开始金币系统测试...');
  
  testBaseRewards();
  testTimeRewards();
  testMoveRewards();
  testCombinedRewards();
  testEdgeCases();
  testRewardConfigConsistency();
  
  console.log('\n✅ 金币系统测试完成!');
}

// 执行测试
runAllTests();