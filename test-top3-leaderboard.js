// 测试前3名排行榜功能
import { LeaderboardService } from './src/services/leaderboardService.ts';

console.log('开始测试前3名排行榜功能...');

// 清空现有数据
localStorage.removeItem('leaderboard');

// 添加测试数据 - 同一个拼图的多个玩家记录
const testEntries = [
  // 拼图1 - 测试拼图A
  {
    playerName: '玩家A',
    time: 120.5,
    moves: 45,
    date: '2024-01-01',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  {
    playerName: '玩家B',
    time: 98.2,
    moves: 38,
    date: '2024-01-02',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  {
    playerName: '玩家C',
    time: 156.8,
    moves: 52,
    date: '2024-01-03',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  {
    playerName: '玩家D',
    time: 89.3,
    moves: 35,
    date: '2024-01-04',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  {
    playerName: '玩家E',
    time: 134.7,
    moves: 48,
    date: '2024-01-05',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  
  // 拼图2 - 测试拼图B（只有2个玩家）
  {
    playerName: '玩家X',
    time: 200.1,
    moves: 60,
    date: '2024-01-06',
    difficulty: 'medium',
    shape: 'square',
    gridSize: '4x4',
    totalPieces: 16,
    puzzleId: 'puzzle_002',
    puzzleName: '测试拼图B'
  },
  {
    playerName: '玩家Y',
    time: 178.5,
    moves: 55,
    date: '2024-01-07',
    difficulty: 'medium',
    shape: 'square',
    gridSize: '4x4',
    totalPieces: 16,
    puzzleId: 'puzzle_002',
    puzzleName: '测试拼图B'
  }
];

console.log('添加测试数据...');
testEntries.forEach(entry => {
  LeaderboardService.addEntry(entry);
});

console.log('\n测试前3名功能...');
const top3Results = LeaderboardService.getPuzzleLeaderboardWithTop3();

console.log('前3名结果:', JSON.stringify(top3Results, null, 2));

// 验证第一个拼图的前3名
const puzzle1 = top3Results.find(p => p.puzzleId === 'puzzle_001');
if (puzzle1) {
  console.log('\n拼图A的前3名:');
  puzzle1.topPlayers.forEach((player, index) => {
    console.log(`第${index + 1}名: ${player.playerName} - ${player.time}秒, ${player.moves}步`);
  });
  
  // 验证排序正确性（应该是玩家D、玩家B、玩家A）
  const expectedOrder = ['玩家D', '玩家B', '玩家A'];
  const actualOrder = puzzle1.topPlayers.map(p => p.playerName);
  console.log('期望顺序:', expectedOrder);
  console.log('实际顺序:', actualOrder);
  console.log('排序正确:', JSON.stringify(expectedOrder) === JSON.stringify(actualOrder));
}

// 验证第二个拼图的前3名
const puzzle2 = top3Results.find(p => p.puzzleId === 'puzzle_002');
if (puzzle2) {
  console.log('\n拼图B的前3名:');
  puzzle2.topPlayers.forEach((player, index) => {
    console.log(`第${index + 1}名: ${player.playerName} - ${player.time}秒, ${player.moves}步`);
  });
  console.log('拼图B玩家数量正确:', puzzle2.topPlayers.length === 2);
}

console.log('\n前3名排行榜功能测试完成！');
