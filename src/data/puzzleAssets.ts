/**
 * 拼图素材配置
 * 包含可用于联机对战的预设拼图
 */

export interface PuzzleAsset {
  id: string;
  name: string;
  imagePath: string;
  category: 'nature' | 'animals' | 'architecture' | 'art';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  tags: string[];
}

// 预设拼图素材 (使用实际存在的SVG文件)
export const puzzleAssets: PuzzleAsset[] = [
  // Logo类别
  {
    id: 'tauri_logo',
    name: 'Tauri Logo',
    imagePath: '/tauri.svg',
    category: 'art',
    difficulty: 'easy',
    description: 'Tauri框架官方标志',
    tags: ['Logo', '科技', '框架']
  },
  {
    id: 'vite_logo',
    name: 'Vite Logo',
    imagePath: '/vite.svg',
    category: 'art',
    difficulty: 'easy',
    description: 'Vite构建工具标志',
    tags: ['Logo', '开发', '工具']
  },
  {
    id: 'react_logo',
    name: 'React Logo',
    imagePath: '/react.svg',
    category: 'art',
    difficulty: 'medium',
    description: 'React前端框架标志',
    tags: ['Logo', 'React', '前端']
  },
  
  // 自然风光
  {
    id: 'landscape1',
    name: '山景风光',
    imagePath: '/images/nature/landscape1.svg',
    category: 'nature',
    difficulty: 'medium',
    description: '美丽的山景风光',
    tags: ['山景', '风景', '自然']
  },
  {
    id: 'landscape2',
    name: '落日海景',
    imagePath: '/images/nature/landscape2.svg',
    category: 'nature',
    difficulty: 'hard',
    description: '壮丽的落日海景',
    tags: ['海景', '落日', '浪漫']
  },
  {
    id: 'landscape3',
    name: '森林风光',
    imagePath: '/images/nature/landscape3.svg',
    category: 'nature',
    difficulty: 'hard',
    description: '茂密的森林风光',
    tags: ['森林', '绿色', '自然']
  },
  
  // 动物
  {
    id: 'cat',
    name: '可爱小猫',
    imagePath: '/images/animals/cat.svg',
    category: 'animals',
    difficulty: 'easy',
    description: '萌萌的小猫咪',
    tags: ['猫咪', '萌宠', '可爱']
  },
  
  // 建筑
  {
    id: 'castle',
    name: '古典建筑',
    imagePath: '/images/buildings/castle.svg',
    category: 'architecture',
    difficulty: 'expert',
    description: '古典的城堡建筑',
    tags: ['城堡', '建筑', '历史']
  },
  
  // 动漫角色
  {
    id: 'character',
    name: '动漫角色',
    imagePath: '/images/anime/character.svg',
    category: 'art',
    difficulty: 'medium',
    description: '可爱的动漫角色',
    tags: ['动漫', '角色', '艺术']
  },
  
  // 测试图片
  {
    id: 'test1',
    name: '森林花园',
    imagePath: '/images/test1.svg',
    category: 'nature',
    difficulty: 'medium',
    description: '美丽的森林花园场景',
    tags: ['花园', '森林', '美景']
  },
  {
    id: 'test2',
    name: '黄昏日落',
    imagePath: '/images/test2.svg',
    category: 'nature',
    difficulty: 'hard',
    description: '温暖的黄昏日落',
    tags: ['黄昏', '日落', '温暖']
  },
  {
    id: 'test3',
    name: '玫瑰花园',
    imagePath: '/images/test3.svg',
    category: 'nature',
    difficulty: 'easy',
    description: '浪漫的玫瑰花园',
    tags: ['玫瑰', '花园', '浪漫']
  }
];

// 根据难度获取拼图
export const getPuzzlesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): PuzzleAsset[] => {
  return puzzleAssets.filter(puzzle => puzzle.difficulty === difficulty);
};

// 根据类别获取拼图
export const getPuzzlesByCategory = (category: string): PuzzleAsset[] => {
  return puzzleAssets.filter(puzzle => puzzle.category === category);
};

// 获取随机拼图
export const getRandomPuzzle = (): PuzzleAsset => {
  const randomIndex = Math.floor(Math.random() * puzzleAssets.length);
  return puzzleAssets[randomIndex];
};

// 根据ID获取拼图
export const getPuzzleById = (id: string): PuzzleAsset | undefined => {
  return puzzleAssets.find(puzzle => puzzle.id === id);
};

// 获取所有类别
export const getAllCategories = (): string[] => {
  return Array.from(new Set(puzzleAssets.map(puzzle => puzzle.category)));
};

// 获取所有难度
export const getAllDifficulties = (): string[] => {
  return ['easy', 'medium', 'hard', 'expert'];
};

// 难度标签映射
export const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  expert: '专家'
};

// 类别标签映射
export const categoryLabels = {
  nature: '自然风光',
  animals: '动物世界',
  architecture: '建筑艺术',
  art: '艺术作品'
};
