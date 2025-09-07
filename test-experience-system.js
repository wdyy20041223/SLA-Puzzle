/**
 * 测试经验值系统功能
 */

import { 
  getRequiredExpForLevel, 
  getExpToNextLevel,
  getLevelProgress,
  calculateLevelFromExp,
  addExperience 
} from '../src/utils/experienceSystem';

// 测试经验值公式
console.log('=== 经验值公式测试 ===');
console.log('升到2级需要经验:', getRequiredExpForLevel(2)); // 应该是 200 * 2 - 100 = 300
console.log('升到3级需要经验:', getRequiredExpForLevel(3)); // 应该是 200 * 3 - 100 = 500
console.log('升到5级需要经验:', getRequiredExpForLevel(5)); // 应该是 200 * 5 - 100 = 900
console.log('升到10级需要经验:', getRequiredExpForLevel(10)); // 应该是 200 * 10 - 100 = 1900

// 测试下一级经验
console.log('\n=== 下一级经验测试 ===');
console.log('1级用户下一级需要经验:', getExpToNextLevel(1)); // 300
console.log('3级用户下一级需要经验:', getExpToNextLevel(3)); // 700
console.log('5级用户下一级需要经验:', getExpToNextLevel(5)); // 1100

// 测试等级进度
console.log('\n=== 等级进度测试 ===');
const progress1 = getLevelProgress(2, 350);
console.log('2级用户，350经验的进度:', progress1);

const progress2 = getLevelProgress(3, 600);
console.log('3级用户，600经验的进度:', progress2);

// 测试根据经验计算等级
console.log('\n=== 根据经验计算等级测试 ===');
console.log('100经验对应等级:', calculateLevelFromExp(100)); // 1级
console.log('300经验对应等级:', calculateLevelFromExp(300)); // 2级
console.log('500经验对应等级:', calculateLevelFromExp(500)); // 3级
console.log('800经验对应等级:', calculateLevelFromExp(800)); // 3级
console.log('900经验对应等级:', calculateLevelFromExp(900)); // 4级

// 测试添加经验
console.log('\n=== 添加经验测试 ===');
const expResult1 = addExperience(2, 350, 200);
console.log('2级350经验，添加200经验后:', expResult1);

const expResult2 = addExperience(1, 250, 100);
console.log('1级250经验，添加100经验后:', expResult2);
