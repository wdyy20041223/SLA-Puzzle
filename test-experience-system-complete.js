/**
 * 经验值系统完整测试
 * 验证等级计算、经验值进度和升级逻辑的正确性
 */

console.log('📊 经验值系统完整测试');
console.log('='.repeat(60));

// 完全独立的模拟实现，不依赖实际的TypeScript模块

// 计算指定等级所需的总经验值
function getRequiredExpForLevel(level) {
  // 确保等级至少为1
  level = Math.max(1, level);
  
  // 基础经验值公式：300 * level + 50 * (level-1) * (level-1) - 50 * (level-1)
  // 简化后：300 * level + 50 * (level-1) * (level-2)
  if (level === 1) return 0; // 1级不需要经验值
  return Math.floor(300 * (level - 1) + 50 * (level - 1) * (level - 2));
}

// 计算从当前等级升到下一级所需的经验值
function getExpToNextLevel(currentLevel) {
  // 确保等级至少为1
  currentLevel = Math.max(1, currentLevel);
  
  // 下一级所需经验值减去当前等级所需经验值
  return getRequiredExpForLevel(currentLevel + 1) - getRequiredExpForLevel(currentLevel);
}

// 计算当前等级的进度信息
function getLevelProgress(level, currentExp) {
  // 确保等级至少为1
  level = Math.max(1, level);
  
  // 计算当前等级所需的基础经验值
  const baseExp = getRequiredExpForLevel(level);
  
  // 计算下一级所需的经验值
  const nextLevelExp = getRequiredExpForLevel(level + 1);
  
  // 计算当前等级内的进度
  const levelExpRange = nextLevelExp - baseExp;
  const currentLevelExp = Math.max(0, currentExp - baseExp);
  
  // 计算进度百分比（确保不会超过100%）
  const progressPercentage = Math.min(100, (currentLevelExp / levelExpRange) * 100);
  
  // 返回进度信息
  return {
    currentLevel: level,
    currentExp,
    baseExp,
    nextLevelExp,
    currentLevelExp,
    expToNext: nextLevelExp - currentExp,
    progressPercentage
  };
}

// 根据总经验值计算当前等级
function calculateLevelFromExp(totalExp) {
  // 确保经验值不会为负数
  totalExp = Math.max(0, totalExp);
  
  // 基础等级为1
  let level = 1;
  
  // 循环计算当前经验值能达到的最高等级
  while (true) {
    const nextLevelExp = getRequiredExpForLevel(level + 1);
    if (totalExp >= nextLevelExp) {
      level++;
    } else {
      break;
    }
  }
  
  return level;
}

// 添加经验值并检查是否升级
function addExperience(currentLevel, currentExp, expToAdd) {
  // 确保经验值不会为负数
  currentExp = Math.max(0, currentExp);
  expToAdd = Math.max(0, expToAdd);
  
  // 计算添加后的总经验值
  const newExp = currentExp + expToAdd;
  
  // 计算添加经验后达到的新等级
  const newLevel = calculateLevelFromExp(newExp);
  
  // 计算升级次数
  const levelsGained = Math.max(0, newLevel - currentLevel);
  
  // 检查是否升级
  const leveledUp = levelsGained > 0;
  
  // 返回结果
  return {
    newLevel,
    newExp,
    leveledUp,
    levelsGained,
    totalExp: newExp,
    currentLevelExp: newExp - getRequiredExpForLevel(newLevel),
    expToNextLevel: getRequiredExpForLevel(newLevel + 1) - newExp
  };
}

console.log('1. 测试等级所需经验值计算...');

// 测试不同等级所需的经验值
const levelTests = [1, 2, 5, 10, 20, 50, 100];
levelTests.forEach(level => {
  const requiredExp = getRequiredExpForLevel(level);
  console.log(`   等级 ${level} 所需经验值: ${requiredExp}`);
});

console.log('\n2. 测试下一级所需经验值...');

// 测试不同等级下一级所需的经验值
levelTests.forEach(level => {
  const expToNext = getExpToNextLevel(level);
  console.log(`   等级 ${level} 升下一级需要: ${expToNext}`);
});

console.log('\n3. 测试等级进度计算...');

// 测试不同等级和经验值的进度
const progressTests = [
  { level: 1, exp: 0, expectedProgress: 0 },
  { level: 1, exp: 150, expectedProgress: 50 },
  { level: 1, exp: 300, expectedProgress: 100 },
  { level: 2, exp: 300, expectedProgress: 0 },
  { level: 2, exp: 400, expectedProgress: 50 },
  { level: 2, exp: 500, expectedProgress: 100 },
  { level: 5, exp: 900, expectedProgress: 0 },
  { level: 5, exp: 1000, expectedProgress: 25 },
  { level: 5, exp: 1100, expectedProgress: 100 }
];

progressTests.forEach(test => {
  const progress = getLevelProgress(test.level, test.exp);
  console.log(`   等级 ${test.level}, 经验 ${test.exp}: 进度 ${progress.progressPercentage.toFixed(2)}% (预期: ~${test.expectedProgress}%)`);
  console.log(`     当前等级经验: ${progress.currentLevelExp}, 下一级经验: ${progress.nextLevelExp}`);
  console.log(`     到下一级还需: ${progress.expToNext} 经验值`);
});

console.log('\n4. 测试根据经验值计算等级...');

// 测试不同经验值对应的等级
const expToLevelTests = [
  { exp: 0, expectedLevel: 1 },
  { exp: 100, expectedLevel: 1 },
  { exp: 299, expectedLevel: 1 },
  { exp: 300, expectedLevel: 2 },
  { exp: 499, expectedLevel: 2 },
  { exp: 500, expectedLevel: 3 },
  { exp: 899, expectedLevel: 3 },
  { exp: 900, expectedLevel: 4 },
  { exp: 1000, expectedLevel: 4 },
  { exp: 1900, expectedLevel: 10 },
  { exp: 3900, expectedLevel: 20 },
  { exp: 9900, expectedLevel: 50 }
];

expToLevelTests.forEach(test => {
  const level = calculateLevelFromExp(test.exp);
  console.log(`   经验值 ${test.exp}: 等级 ${level} (${level === test.expectedLevel ? '✓' : '✗'})`);
});

console.log('\n5. 测试添加经验值和升级...');

// 测试添加经验值并检查升级结果
const addExpTests = [
  { currentLevel: 1, currentExp: 250, addExp: 100, expectedLevel: 2, expectLevelUp: true },
  { currentLevel: 2, currentExp: 350, addExp: 200, expectedLevel: 3, expectLevelUp: true },
  { currentLevel: 3, currentExp: 600, addExp: 100, expectedLevel: 3, expectLevelUp: false },
  { currentLevel: 5, currentExp: 950, addExp: 500, expectedLevel: 6, expectLevelUp: true },
  { currentLevel: 10, currentExp: 1950, addExp: 1000, expectedLevel: 11, expectLevelUp: true },
  { currentLevel: 1, currentExp: 0, addExp: 10000, expectedLevel: 50, expectLevelUp: true }
];

addExpTests.forEach(test => {
  const result = addExperience(test.currentLevel, test.currentExp, test.addExp);
  const levelUpCorrect = (result.leveledUp === test.expectLevelUp);
  const levelCorrect = (result.newLevel === test.expectedLevel);
  
  console.log(`   等级 ${test.currentLevel}, 经验 ${test.currentExp}, 添加 ${test.addExp} 经验:`);
  console.log(`     新等级: ${result.newLevel} (${levelCorrect ? '✓' : '✗'})`);
  console.log(`     新经验: ${result.newExp}`);
  console.log(`     升级: ${result.leveledUp ? '✓' : '✗'} (${levelUpCorrect ? '✓' : '✗'})`);
  console.log(`     升级次数: ${result.levelsGained}`);
});

console.log('\n6. 测试边界条件...');

// 测试边界条件
console.log('   测试负数经验值:');
console.log(`     等级: ${calculateLevelFromExp(-100)} (预期: 1)`);

console.log('   测试超大经验值:');
const bigExp = 1000000;
const bigLevel = calculateLevelFromExp(bigExp);
console.log(`     ${bigExp.toLocaleString()} 经验值对应等级: ${bigLevel}`);

console.log('   测试连续升级:');
const multiLevelUp = addExperience(1, 0, 10000);
console.log(`     从1级0经验添加10000经验: 升到 ${multiLevelUp.newLevel} 级, 升级 ${multiLevelUp.levelsGained} 次`);

console.log('\n='.repeat(60));
console.log('✅ 经验值系统完整测试完成');