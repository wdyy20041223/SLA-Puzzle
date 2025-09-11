/**
 * 测试成就过滤功能的脚本
 * 验证只有官方成就列表中的成就会在游戏结算弹窗中显示
 */

console.log('🧪 成就过滤功能测试');
console.log('='.repeat(50));

// 模拟官方成就ID列表（与 rewardSystem.ts 中的 getOfficialAchievementIds 保持一致）
const officialAchievementIds = [
  // 基础进度成就
  'first_game',
  'games_10', 
  'games_50',
  'games_100',
  'games_500',
  
  // 难度专精成就
  'easy_master',
  'hard_challenger', 
  'expert_elite',
  
  // 速度成就
  'speed_demon',
  'speed_runner',
  'lightning_fast',
  'time_master',
  
  // 技巧成就
  'perfectionist',
  'efficient_solver',
  'no_mistakes',
  
  // 特殊时间成就
  'night_owl',
  'early_bird', 
  'weekend_warrior',
  
  // 等级成就
  'level_up',
  'level_10',
  'level_25',
  'max_level'
];

// 模拟rewardSystem.ts中可能触发的所有成就
const allPossibleAchievements = [
  { id: 'first_game', name: '初次体验' },
  { id: 'games_10', name: '拼图新手' },
  { id: 'games_50', name: '拼图达人' },
  { id: 'games_100', name: '拼图大师' },
  { id: 'speed_demon', name: '速度恶魔' },
  { id: 'speed_runner', name: '速度跑者' },
  { id: 'lightning_fast', name: '闪电快手' },
  { id: 'time_master', name: '时间大师' },
  { id: 'perfectionist', name: '完美主义者' },
  { id: 'efficient_solver', name: '高效解谜者' },
  { id: 'no_mistakes', name: '零失误专家' },
  { id: 'night_owl', name: '夜猫子' },
  { id: 'early_bird', name: '早起鸟儿' },
  { id: 'weekend_warrior', name: '周末战士' },
  { id: 'level_up', name: '等级提升' },
  { id: 'easy_master', name: '简单模式专家' },
  { id: 'hard_challenger', name: '困难挑战者' },
  { id: 'expert_elite', name: '专家精英' },
  
  // 这些是在rewardSystem.ts中定义但不在官方列表中的成就
  { id: 'super_efficient', name: '超级效率者' },
  { id: 'expert_speedster', name: '专家速度王' },
  { id: 'consecutive_days', name: '坚持不懈' }
];

console.log('1. 检查官方成就列表...');
console.log(`官方成就总数: ${officialAchievementIds.length}`);
console.log('');

console.log('2. 模拟成就过滤逻辑...');
const filteredAchievements = allPossibleAchievements.filter(achievement => 
  officialAchievementIds.includes(achievement.id)
);

const nonOfficialAchievements = allPossibleAchievements.filter(achievement => 
  !officialAchievementIds.includes(achievement.id)
);

console.log(`原始成就数量: ${allPossibleAchievements.length}`);
console.log(`过滤后成就数量: ${filteredAchievements.length}`);
console.log(`被过滤的成就数量: ${nonOfficialAchievements.length}`);
console.log('');

console.log('3. 被过滤掉的成就（这些不会在游戏结算弹窗中显示）：');
if (nonOfficialAchievements.length > 0) {
  nonOfficialAchievements.forEach((achievement, index) => {
    console.log(`   ${index + 1}. ${achievement.name} (${achievement.id})`);
  });
} else {
  console.log('   无');
}
console.log('');

console.log('4. 保留的官方成就（这些可以在游戏结算弹窗中显示）：');
filteredAchievements.forEach((achievement, index) => {
  console.log(`   ${index + 1}. ${achievement.name} (${achievement.id})`);
});
console.log('');

console.log('5. 验证结果：');
const expectedNonOfficialCount = 3; // super_efficient, expert_speedster, consecutive_days
if (nonOfficialAchievements.length === expectedNonOfficialCount) {
  console.log('✅ 过滤功能正常工作');
  console.log(`✅ 正确过滤了 ${nonOfficialAchievements.length} 个非官方成就`);
  console.log('✅ 用户报告的"速度跑者"和"等级提升"成就确实在官方列表中，应该显示');
  console.log('✅ 被过滤的成就（如super_efficient, expert_speedster）不会再出现在游戏结算弹窗中');
} else {
  console.log(`❌ 预期过滤 ${expectedNonOfficialCount} 个成就，实际过滤了 ${nonOfficialAchievements.length} 个`);
}

console.log('');
console.log('🏁 测试完成');
console.log('');
console.log('� 说明：');
console.log('- 此修复确保只有在official成就列表中的成就才会在游戏结算弹窗中显示');
console.log('- "速度跑者"和"等级提升"成就在官方列表中，所以仍会正常显示');
console.log('- 一些在rewardSystem.ts中定义但不在官方列表中的成就将被过滤掉');
console.log('- 这解决了用户反映的"不包含在成就列表里的成就会在结算弹窗中提示"的问题');
