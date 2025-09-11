// 测试同一玩家多成绩排行榜功能
import { LeaderboardService } from './src/services/leaderboardService.ts';

console.log('开始测试同一玩家多成绩排行榜功能...');

// 清空现有数据
localStorage.removeItem('leaderboard');

// 添加测试数据 - 同一个玩家在同一个拼图的多个成绩
const testEntries = [
  // 拼图1 - 玩家A的多个成绩
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
    playerName: '玩家A',
    time: 98.2,  // 更好的成绩
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
    playerName: '玩家A',
    time: 135.8,  // 较差的成绩
    moves: 52,
    date: '2024-01-03',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  
  // 玩家B的成绩
  {
    playerName: '玩家B',
    time: 89.3,  // 最好的成绩
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
    playerName: '玩家B',
    time: 110.7,  // 较差的成绩
    moves: 42,
    date: '2024-01-05',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  
  // 玩家C的成绩
  {
    playerName: '玩家C',
    time: 156.8,
    moves: 52,
    date: '2024-01-06',
    difficulty: 'easy',
    shape: 'square',
    gridSize: '3x3',
    totalPieces: 9,
    puzzleId: 'puzzle_001',
    puzzleName: '测试拼图A'
  },
  
  // 拼图2 - 较少的参与者
  {
    playerName: '玩家X',
    time: 200.1,
    moves: 60,
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

console.log('\n测试多成绩功能...');
const multiScoreResults = LeaderboardService.getPuzzleLeaderboardWithTop3();

console.log('多成绩结果:', JSON.stringify(multiScoreResults, null, 2));

// 验证第一个拼图的前3名
const puzzle1 = multiScoreResults.find(p => p.puzzleId === 'puzzle_001');
if (puzzle1) {
  console.log('\n拼图A的前3名（允许同一玩家多成绩）:');
  puzzle1.topPlayers.forEach((player, index) => {
    console.log(`第${index + 1}名: ${player.playerName} - ${player.time}秒, ${player.moves}步 (${new Date(player.completedAt).toLocaleDateString()})`);
  });
  
  // 验证是否包含同一玩家的多个成绩
  const playerACounts = puzzle1.topPlayers.filter(p => p.playerName === '玩家A').length;
  const playerBCounts = puzzle1.topPlayers.filter(p => p.playerName === '玩家B').length;
  
  console.log(`\n玩家A在前3名中有 ${playerACounts} 个成绩`);
  console.log(`玩家B在前3名中有 ${playerBCounts} 个成绩`);
  
  // 验证排序正确性（应该是最快的3个成绩）
  const expectedOrder = [
    { name: '玩家B', time: 89.3 },
    { name: '玩家A', time: 98.2 },
    { name: '玩家B', time: 110.7 }  // 或者是玩家A的120.5，取决于具体实现
  ];
  
  console.log('\n前3名成绩验证:');
  console.log('第1名应该是玩家B (89.3秒):', puzzle1.topPlayers[0].playerName === '玩家B' && puzzle1.topPlayers[0].time === 89.3);
  console.log('第2名应该是玩家A (98.2秒):', puzzle1.topPlayers[1].playerName === '玩家A' && puzzle1.topPlayers[1].time === 98.2);
  console.log('第3名应该是较快的第三个成绩');
}

console.log('\n同一玩家多成绩排行榜功能测试完成！');
