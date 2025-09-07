/**
 * 扩展成就数据定义
 * 基于拼图大师项目的各种功能设计的丰富成就系统
 */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special' | 'milestone' | 'social' | 'technical';
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: string;
}

export const createAchievements = (
  userGamesCompleted: number,
  userAchievements: string[],
  userLevel: number
): Achievement[] => [
  // === 基础进度成就 ===
  {
    id: 'first_game',
    title: '初次体验',
    description: '完成第一个拼图',
    icon: '🎯',
    category: 'progress',
    progress: userGamesCompleted >= 1 ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('first_game'),
    unlockedAt: userAchievements.includes('first_game') ? new Date('2024-01-15') : undefined,
    rarity: 'common',
    reward: '经验值 +10'
  },
  {
    id: 'games_10',
    title: '拼图新手',
    description: '完成10个拼图',
    icon: '🏅',
    category: 'progress',
    progress: Math.min(userGamesCompleted, 10),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('games_10'),
    rarity: 'common',
    reward: '金币 +50'
  },
  {
    id: 'games_50',
    title: '拼图达人',
    description: '完成50个拼图',
    icon: '🏆',
    category: 'progress',
    progress: Math.min(userGamesCompleted, 50),
    maxProgress: 50,
    isUnlocked: userAchievements.includes('games_50'),
    rarity: 'rare',
    reward: '特殊称号'
  },
  {
    id: 'games_100',
    title: '拼图大师',
    description: '完成100个拼图',
    icon: '👑',
    category: 'milestone',
    progress: Math.min(userGamesCompleted, 100),
    maxProgress: 100,
    isUnlocked: userAchievements.includes('games_100'),
    rarity: 'epic',
    reward: '解锁特殊边框'
  },
  {
    id: 'games_500',
    title: '拼图宗师',
    description: '完成500个拼图',
    icon: '🎖️',
    category: 'milestone',
    progress: Math.min(userGamesCompleted, 500),
    maxProgress: 500,
    isUnlocked: userAchievements.includes('games_500'),
    rarity: 'legendary',
    reward: '传奇头像框'
  },

  // === 难度成就 ===
  {
    id: 'easy_master',
    title: '简单模式专家',
    description: '完成20个简单难度拼图',
    icon: '😊',
    category: 'progress',
    progress: Math.floor(Math.random() * 15),
    maxProgress: 20,
    isUnlocked: userAchievements.includes('easy_master'),
    rarity: 'common',
    reward: '金币 +30'
  },
  {
    id: 'hard_challenger',
    title: '困难挑战者',
    description: '完成10个困难难度拼图',
    icon: '😤',
    category: 'progress',
    progress: Math.floor(Math.random() * 8),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('hard_challenger'),
    rarity: 'rare',
    reward: '经验值 +100'
  },
  {
    id: 'expert_elite',
    title: '专家精英',
    description: '完成5个专家难度拼图',
    icon: '🔥',
    category: 'milestone',
    progress: Math.floor(Math.random() * 3),
    maxProgress: 5,
    isUnlocked: userAchievements.includes('expert_elite'),
    rarity: 'epic',
    reward: '专家称号'
  },

  // === 速度成就 ===
  {
    id: 'speed_demon',
    title: '速度恶魔',
    description: '在3分钟内完成中等难度拼图',
    icon: '⚡',
    category: 'performance',
    progress: userAchievements.includes('speed_demon') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('speed_demon'),
    rarity: 'rare',
    reward: '称号：闪电手'
  },
  {
    id: 'lightning_fast',
    title: '闪电快手',
    description: '在1分钟内完成简单难度拼图',
    icon: '⚡',
    category: 'performance',
    isUnlocked: userAchievements.includes('lightning_fast'),
    rarity: 'epic',
    reward: '特殊动画效果'
  },
  {
    id: 'time_master',
    title: '时间大师',
    description: '在5次游戏中都打破个人最佳记录',
    icon: '⏱️',
    category: 'performance',
    progress: Math.floor(Math.random() * 3),
    maxProgress: 5,
    isUnlocked: userAchievements.includes('time_master'),
    rarity: 'legendary',
    reward: '时间之神称号'
  },

  // === 技巧成就 ===
  {
    id: 'perfectionist',
    title: '完美主义者',
    description: '用最少步数完成拼图',
    icon: '💎',
    category: 'performance',
    progress: userAchievements.includes('perfectionist') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('perfectionist'),
    rarity: 'legendary',
    reward: '特殊头像框'
  },
  {
    id: 'efficient_solver',
    title: '高效解谜者',
    description: '连续3次游戏都用少于标准步数完成',
    icon: '🧠',
    category: 'performance',
    progress: Math.floor(Math.random() * 2),
    maxProgress: 3,
    isUnlocked: userAchievements.includes('efficient_solver'),
    rarity: 'epic',
    reward: '智慧之光特效'
  },
  {
    id: 'no_mistakes',
    title: '零失误专家',
    description: '完成拼图过程中不放错任何拼块',
    icon: '🎯',
    category: 'performance',
    isUnlocked: userAchievements.includes('no_mistakes'),
    rarity: 'legendary',
    reward: '完美主义者徽章'
  },

  // === 编辑器成就 ===
  {
    id: 'first_creation',
    title: '初次创作',
    description: '使用拼图编辑器创建第一个自定义拼图',
    icon: '🎨',
    category: 'special',
    isUnlocked: userAchievements.includes('first_creation'),
    rarity: 'common',
    reward: '创作者称号'
  },
  {
    id: 'creative_artist',
    title: '创意艺术家',
    description: '创建10个自定义拼图',
    icon: '🖼️',
    category: 'special',
    progress: Math.floor(Math.random() * 7),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('creative_artist'),
    rarity: 'rare',
    reward: '额外素材库'
  },
  {
    id: 'puzzle_designer',
    title: '拼图设计师',
    description: '创建25个自定义拼图',
    icon: '🏗️',
    category: 'milestone',
    progress: Math.floor(Math.random() * 15),
    maxProgress: 25,
    isUnlocked: userAchievements.includes('puzzle_designer'),
    rarity: 'epic',
    reward: '设计师工具包'
  },

  // === 每日挑战成就 ===
  {
    id: 'consecutive_days',
    title: '坚持不懈',
    description: '连续7天完成拼图',
    icon: '📅',
    category: 'special',
    progress: userAchievements.includes('consecutive_days') ? 7 : Math.floor(Math.random() * 5),
    maxProgress: 7,
    isUnlocked: userAchievements.includes('consecutive_days'),
    rarity: 'rare',
    reward: '每日奖励翻倍'
  },
  {
    id: 'monthly_champion',
    title: '月度冠军',
    description: '完成当月所有每日挑战',
    icon: '🗓️',
    category: 'milestone',
    progress: Math.floor(Math.random() * 20),
    maxProgress: 30,
    isUnlocked: userAchievements.includes('monthly_champion'),
    rarity: 'legendary',
    reward: '冠军徽章'
  },
  {
    id: 'streak_master',
    title: '连击大师',
    description: '连续30天完成每日挑战',
    icon: '🔥',
    category: 'milestone',
    progress: Math.floor(Math.random() * 20),
    maxProgress: 30,
    isUnlocked: userAchievements.includes('streak_master'),
    rarity: 'legendary',
    reward: '永恒火焰特效'
  },

  // === 社交成就 ===
  {
    id: 'first_multiplayer',
    title: '多人初体验',
    description: '参加第一场多人游戏',
    icon: '👥',
    category: 'special',
    isUnlocked: userAchievements.includes('first_multiplayer'),
    rarity: 'common',
    reward: '社交达人称号'
  },
  {
    id: 'multiplayer_winner',
    title: '多人游戏胜者',
    description: '在多人游戏中获胜5次',
    icon: '🥇',
    category: 'special',
    progress: Math.floor(Math.random() * 3),
    maxProgress: 5,
    isUnlocked: userAchievements.includes('multiplayer_winner'),
    rarity: 'rare',
    reward: '胜利者光环'
  },
  {
    id: 'host_master',
    title: '房主大师',
    description: '创建10个多人游戏房间',
    icon: '🏠',
    category: 'special',
    progress: Math.floor(Math.random() * 6),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('host_master'),
    rarity: 'epic',
    reward: '房主专属装饰'
  },
  {
    id: 'team_player',
    title: '团队协作者',
    description: '与不同玩家合作完成20场多人游戏',
    icon: '🤝',
    category: 'special',
    progress: Math.floor(Math.random() * 12),
    maxProgress: 20,
    isUnlocked: userAchievements.includes('team_player'),
    rarity: 'rare',
    reward: '合作精神徽章'
  },

  // === 收集成就 ===
  {
    id: 'image_collector',
    title: '图片收藏家',
    description: '解锁所有内置拼图图片',
    icon: '🖼️',
    category: 'special',
    progress: Math.floor(Math.random() * 15),
    maxProgress: 20,
    isUnlocked: userAchievements.includes('image_collector'),
    rarity: 'epic',
    reward: '收藏家徽章'
  },
  {
    id: 'theme_explorer',
    title: '主题探索者',
    description: '尝试所有拼图主题类别',
    icon: '🌈',
    category: 'special',
    progress: Math.floor(Math.random() * 4),
    maxProgress: 6,
    isUnlocked: userAchievements.includes('theme_explorer'),
    rarity: 'rare',
    reward: '探索者指南'
  },
  {
    id: 'pattern_master',
    title: '图案大师',
    description: '完成每种图案类型的拼图至少一次',
    icon: '🎭',
    category: 'special',
    progress: Math.floor(Math.random() * 6),
    maxProgress: 8,
    isUnlocked: userAchievements.includes('pattern_master'),
    rarity: 'epic',
    reward: '图案识别大师称号'
  },

  // === 特殊时间成就 ===
  {
    id: 'night_owl',
    title: '夜猫子',
    description: '在凌晨2-6点完成拼图',
    icon: '🦉',
    category: 'special',
    isUnlocked: userAchievements.includes('night_owl'),
    rarity: 'rare',
    reward: '夜行者称号'
  },
  {
    id: 'early_bird',
    title: '早起鸟儿',
    description: '在早上5-7点完成拼图',
    icon: '🐦',
    category: 'special',
    isUnlocked: userAchievements.includes('early_bird'),
    rarity: 'rare',
    reward: '晨光加成'
  },
  {
    id: 'weekend_warrior',
    title: '周末战士',
    description: '在周末完成20个拼图',
    icon: '🏖️',
    category: 'special',
    progress: Math.floor(Math.random() * 12),
    maxProgress: 20,
    isUnlocked: userAchievements.includes('weekend_warrior'),
    rarity: 'epic',
    reward: '休闲大师称号'
  },
  {
    id: 'holiday_player',
    title: '节日玩家',
    description: '在节假日完成特殊主题拼图',
    icon: '🎄',
    category: 'special',
    isUnlocked: userAchievements.includes('holiday_player'),
    rarity: 'rare',
    reward: '节日限定装饰'
  },

  // === 等级和经验成就 ===
  {
    id: 'level_up',
    title: '等级提升',
    description: '升级到新等级',
    icon: '⬆️',
    category: 'milestone',
    progress: userLevel,
    maxProgress: userLevel,
    isUnlocked: userAchievements.includes('level_up') || userLevel > 1,
    rarity: 'common',
    reward: '解锁新功能'
  },
  {
    id: 'level_10',
    title: '十级达人',
    description: '达到10级',
    icon: '🔟',
    category: 'milestone',
    isUnlocked: userAchievements.includes('level_10') || userLevel >= 10,
    rarity: 'rare',
    reward: '达人称号'
  },
  {
    id: 'level_25',
    title: '二十五级大师',
    description: '达到25级',
    icon: '🌟',
    category: 'milestone',
    isUnlocked: userAchievements.includes('level_25') || userLevel >= 25,
    rarity: 'epic',
    reward: '大师光环'
  },
  {
    id: 'max_level',
    title: '满级传说',
    description: '达到50级（最高等级）',
    icon: '💫',
    category: 'milestone',
    isUnlocked: userAchievements.includes('max_level') || userLevel >= 50,
    rarity: 'legendary',
    reward: '传说级称号'
  },

  // === 技术与探索成就 ===
  {
    id: 'irregular_master',
    title: '异形拼图大师',
    description: '完成10个不规则形状拼图',
    icon: '🔷',
    category: 'milestone',
    progress: Math.floor(Math.random() * 6),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('irregular_master'),
    rarity: 'epic',
    reward: '异形拼图专家称号'
  },
  {
    id: 'size_challenger',
    title: '尺寸挑战者',
    description: '完成每种网格尺寸的拼图',
    icon: '📏',
    category: 'special',
    progress: Math.floor(Math.random() * 3),
    maxProgress: 4,
    isUnlocked: userAchievements.includes('size_challenger'),
    rarity: 'rare',
    reward: '全尺寸掌握者'
  },
  {
    id: 'persistence_king',
    title: '坚持之王',
    description: '在同一个困难拼图上尝试超过100次',
    icon: '💪',
    category: 'special',
    isUnlocked: userAchievements.includes('persistence_king'),
    rarity: 'legendary',
    reward: '永不放弃精神徽章'
  }
];

export default createAchievements;
