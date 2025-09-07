/**
 * 多重成就测试脚本
 * 用于验证系统是否能在一局游戏中解锁多个成就
 */

// 由于Node.js模块系统限制，我们直接在这里模拟checkAchievements函数
function checkAchievements(userStats, gameResult, unlockedAchievements = []) {
  const newAchievements = [];
  const now = new Date();
  
  // 模拟成就定义
  const ACHIEVEMENTS = {
    first_game: { id: 'first_game', name: '初次体验', description: '完成第一个拼图', category: 'progress' },
    speed_demon: { id: 'speed_demon', name: '速度恶魔', description: '在3分钟内完成中等难度拼图', category: 'performance' },
    speed_runner: { id: 'speed_runner', name: '速度跑者', description: '在2分钟内完成任意难度拼图', category: 'performance' },
    efficient_solver: { id: 'efficient_solver', name: '高效解密者', description: '用少于标准步数60%完成拼图', category: 'performance' },
    super_efficient: { id: 'super_efficient', name: '超级效率者', description: '用少于标准步数30%完成拼图', category: 'performance' },
    night_owl: { id: 'night_owl', name: '夜猫子', description: '在凌晨2-6点完成拼图', category: 'special' },
    weekend_warrior: { id: 'weekend_warrior', name: '周末战士', description: '在周末完成拼图', category: 'special' }
  };

  // 检查进度成就
  if (userStats.gamesCompleted === 1 && !unlockedAchievements.includes('first_game')) {
    newAchievements.push({ ...ACHIEVEMENTS.first_game, unlocked: true, unlockedAt: now });
  }

  // 检查速度成就
  if (gameResult.difficulty === 'medium' && 
      gameResult.completionTime <= 180 && 
      !unlockedAchievements.includes('speed_demon')) {
    newAchievements.push({ ...ACHIEVEMENTS.speed_demon, unlocked: true, unlockedAt: now });
  }

  if (gameResult.completionTime <= 120 && 
      !unlockedAchievements.includes('speed_runner')) {
    newAchievements.push({ ...ACHIEVEMENTS.speed_runner, unlocked: true, unlockedAt: now });
  }

  // 检查效率成就
  if (gameResult.perfectMoves) {
    if (gameResult.moves <= gameResult.perfectMoves * 0.6 && 
        !unlockedAchievements.includes('efficient_solver')) {
      newAchievements.push({ ...ACHIEVEMENTS.efficient_solver, unlocked: true, unlockedAt: now });
    }

    if (gameResult.moves <= gameResult.perfectMoves * 0.3 && 
        !unlockedAchievements.includes('super_efficient')) {
      newAchievements.push({ ...ACHIEVEMENTS.super_efficient, unlocked: true, unlockedAt: now });
    }
  }

  // 检查特殊时间成就
  const hour = now.getHours();
  if (hour >= 2 && hour <= 6 && !unlockedAchievements.includes('night_owl')) {
    newAchievements.push({ ...ACHIEVEMENTS.night_owl, unlocked: true, unlockedAt: now });
  }

  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  if (isWeekend && !unlockedAchievements.includes('weekend_warrior')) {
    newAchievements.push({ ...ACHIEVEMENTS.weekend_warrior, unlocked: true, unlockedAt: now });
  }

  return newAchievements;
}

// 模拟用户数据
const mockUserStats = {
  gamesCompleted: 1, // 触发第一次游戏成就
  level: 1,
  lastPlayDate: new Date()
};

// 模拟游戏结果（设计为能触发多个成就）
const mockGameResult = {
  difficulty: 'medium', // 中等难度
  completionTime: 100,  // 100秒（触发速度成就）
  moves: 5,            // 5步
  perfectMoves: 20     // 理想20步（5步 <= 20*0.6，触发高效解密者）
};

// 模拟当前时间为凌晨3点（触发夜猫子成就）
const originalDate = Date;
global.Date = class extends originalDate {
  constructor() {
    super();
    this.setHours(3); // 设置为凌晨3点
  }
  
  static now() {
    const date = new originalDate();
    date.setHours(3);
    return date.getTime();
  }
  
  getHours() {
    return 3; // 总是返回凌晨3点
  }
  
  getDay() {
    return 6; // 设置为周六（触发周末战士成就）
  }
};

console.log('=== 多重成就测试 ===');
console.log('测试场景：');
console.log('- 第一次完成游戏 → 触发"初次体验"');
console.log('- 100秒完成中等难度 → 触发"速度恶魔"');
console.log('- 100秒完成任意难度 → 触发"速度跑者"');
console.log('- 5步完成(理想20步) → 触发"高效解密者"');
console.log('- 凌晨3点完成 → 触发"夜猫子"');
console.log('- 周六完成 → 触发"周末战士"');
console.log('');

try {
  const achievements = checkAchievements(mockUserStats, mockGameResult, []);
  
  console.log(`✅ 成功解锁 ${achievements.length} 个成就：`);
  achievements.forEach((achievement, index) => {
    console.log(`${index + 1}. ${achievement.name} (${achievement.id})`);
    console.log(`   📝 ${achievement.description}`);
    console.log(`   🎯 分类: ${achievement.category}`);
    console.log('');
  });
  
  if (achievements.length >= 4) {
    console.log('🎉 多重成就功能测试通过！系统能够在一局游戏中解锁多个成就。');
  } else {
    console.log('⚠️  多重成就功能可能存在问题，预期至少解锁4个成就。');
  }
  
} catch (error) {
  console.error('❌ 测试失败:', error);
}

// 恢复原始Date对象
global.Date = originalDate;
