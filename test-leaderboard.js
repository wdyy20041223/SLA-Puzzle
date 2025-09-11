// 测试排行榜功能的简单脚本
import { LeaderboardService } from './src/services/leaderboardService.ts';

console.log('开始测试排行榜功能...');

// 测试添加排行榜条目
console.log('\n1. 测试添加排行榜条目');

// 添加一些测试数据
LeaderboardService.addEntry({
  playerName: '测试玩家1',
  time: 120.5,
  moves: 45,
  date: '2024-01-01',
  difficulty: 'easy',
  shape: 'square',
  gridSize: '3x3',
  totalPieces: 9
});

LeaderboardService.addEntry({
  playerName: '测试玩家2',
  time: 98.2,
  moves: 38,
  date: '2024-01-02',
  difficulty: 'medium',
  shape: 'square',
  gridSize: '4x4',
  totalPieces: 16
});

// 添加每日挑战记录
LeaderboardService.addDailyChallengeEntry({
  date: '2024-01-01',
  playerName: '挑战玩家1',
  score: 850,
  completionTime: 180.5,
  moves: 52,
  difficulty: 'medium',
  isPerfect: true,
  consecutiveDays: 5,
  totalChallengesCompleted: 25,
  averageScore: 780.5
});

// 添加拼图排行榜记录
LeaderboardService.addPuzzleEntry({
  puzzleId: 'puzzle_001',
  puzzleName: '测试拼图',
  playerName: '拼图玩家1',
  time: 245.8,
  moves: 68,
  date: '2024-01-01',
  difficulty: 'hard',
  isPerfect: false
});

console.log('添加测试数据完成');

// 测试获取排行榜数据
console.log('\n2. 测试获取全部排行榜');
const allLeaderboard = LeaderboardService.getLeaderboard();
console.log('全部排行榜条目数:', allLeaderboard.length);

console.log('\n3. 测试获取每日挑战排行榜');
const dailyLeaderboard = LeaderboardService.getDailyChallengeRanking();
console.log('每日挑战排行榜条目数:', dailyLeaderboard.length);

console.log('\n4. 测试获取拼图合并排行榜');
const puzzleLeaderboard = LeaderboardService.getPuzzleConsolidatedLeaderboard();
console.log('拼图排行榜条目数:', puzzleLeaderboard.length);

console.log('\n5. 测试按难度筛选');
const easyEntries = LeaderboardService.getLeaderboardByDifficulty('easy');
console.log('简单难度条目数:', easyEntries.length);

console.log('\n6. 测试按形状筛选');
const squareEntries = LeaderboardService.getLeaderboardByShape('square');
console.log('方形拼图条目数:', squareEntries.length);

console.log('\n排行榜功能测试完成！');
