// 测试成就去重逻辑

console.log('开始测试成就去重逻辑...');

// 模拟用户数据
const mockUser = {
  id: 'test_user',
  username: 'test_player',
  email: 'test@example.com',
  level: 5,
  experience: 1000,
  coins: 500,
  totalScore: 50000,
  gamesCompleted: 15,
  achievements: ['first_game', 'games_10'], // 已经解锁的成就
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date()
};

// 模拟游戏完成结果
const mockGameResult = {
  completionTime: 45, // 小于60秒，应该触发speed_demon
  moves: 25,
  difficulty: 'easy', // 应该触发easy_master
  isNewRecord: true, // 应该触发record_breaker
  totalPieces: 9,
  gridSize: '3x3',
  pieceShape: 'square'
};

// 测试成就检查逻辑
console.log('\n测试场景1: 用户已有部分成就');
console.log('用户现有成就:', mockUser.achievements);
console.log('游戏结果:', {
  完成时间: mockGameResult.completionTime + '秒',
  难度: mockGameResult.difficulty,
  是否新记录: mockGameResult.isNewRecord,
  总游戏数: mockUser.gamesCompleted + 1
});

// 模拟成就检查函数
function checkAchievements(gameResult, user) {
  const achievementsToUnlock = [];
  const userAchievements = user.achievements || [];
  
  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.includes(achievementId);
  };

  const gamesCompleted = (user.gamesCompleted || 0) + 1;

  // 进度成就
  if (gamesCompleted === 1 && !isAchievementUnlocked('first_game')) {
    achievementsToUnlock.push('first_game');
  }
  if (gamesCompleted === 10 && !isAchievementUnlocked('games_10')) {
    achievementsToUnlock.push('games_10');
  }
  if (gamesCompleted === 50 && !isAchievementUnlocked('games_50')) {
    achievementsToUnlock.push('games_50');
  }

  // 难度成就
  if (gameResult.difficulty === 'easy' && !isAchievementUnlocked('easy_master')) {
    achievementsToUnlock.push('easy_master');
  }
  if (gameResult.difficulty === 'hard' && !isAchievementUnlocked('hard_challenger')) {
    achievementsToUnlock.push('hard_challenger');
  }
  if (gameResult.difficulty === 'expert' && !isAchievementUnlocked('expert_solver')) {
    achievementsToUnlock.push('expert_solver');
  }

  // 速度成就
  if (gameResult.completionTime < 60 && !isAchievementUnlocked('speed_demon')) {
    achievementsToUnlock.push('speed_demon');
  }

  // 新记录成就
  if (gameResult.isNewRecord && !isAchievementUnlocked('record_breaker')) {
    achievementsToUnlock.push('record_breaker');
  }

  return achievementsToUnlock;
}

const newAchievements = checkAchievements(mockGameResult, mockUser);
console.log('\n修复后应该解锁的新成就:', newAchievements);

// 验证去重效果
console.log('\n验证去重效果:');
console.log('- first_game 已解锁，不应重复:', !newAchievements.includes('first_game'));
console.log('- games_10 已解锁，不应重复:', !newAchievements.includes('games_10'));
console.log('- easy_master 未解锁，应该解锁:', newAchievements.includes('easy_master'));
console.log('- speed_demon 未解锁，应该解锁:', newAchievements.includes('speed_demon'));
console.log('- record_breaker 未解锁，应该解锁:', newAchievements.includes('record_breaker'));

// 测试场景2: 已经解锁所有可能触发的成就
console.log('\n\n测试场景2: 用户已解锁所有可能的成就');
const userWithAllAchievements = {
  ...mockUser,
  achievements: ['first_game', 'games_10', 'easy_master', 'speed_demon', 'record_breaker']
};

const noNewAchievements = checkAchievements(mockGameResult, userWithAllAchievements);
console.log('用户现有成就:', userWithAllAchievements.achievements);
console.log('应该解锁的新成就:', noNewAchievements);
console.log('✅ 没有重复成就:', noNewAchievements.length === 0);

console.log('\n成就去重逻辑测试完成！');
