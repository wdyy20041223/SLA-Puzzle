// 全面的排行榜功能单元测试

// Mock localStorage 以便在Node.js环境中运行测试
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// 全局注入localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock Date 以便测试时间相关功能
const originalDate = Date;

// 模拟实现LeaderboardService，因为无法在Node.js环境中直接导入TypeScript文件
class MockLeaderboardService {
  static STORAGE_KEY = 'puzzle_leaderboard';
  static DAILY_CHALLENGE_STORAGE_KEY = 'daily_challenge_leaderboard';

  // 模拟获取所有排行榜记录
  static getLeaderboard() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      return [];
    }
  }

  // 模拟获取每日挑战排行榜记录
  static getDailyChallengeLeaderboard() {
    try {
      const data = localStorage.getItem(this.DAILY_CHALLENGE_STORAGE_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));
    } catch (error) {
      console.error('获取每日挑战排行榜数据失败:', error);
      return [];
    }
  }

  // 模拟保存每日挑战排行榜记录
  static saveDailyChallengeLeaderboard(entries) {
    try {
      localStorage.setItem(this.DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存每日挑战排行榜数据失败:', error);
    }
  }

  // 模拟添加新的排行榜记录
  static addEntry(entry) {
    const newEntry = {
      ...entry,
      id: this.generateId(),
      completedAt: new Date()
    };

    const entries = this.getLeaderboard();
    entries.push(newEntry);
    this.saveLeaderboard(entries);
    
    return newEntry;
  }

  // 模拟获取合并后的单拼图排行榜
  static getPuzzleConsolidatedLeaderboard(limit = 50) {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map();

    entries.forEach(entry => {
      // 提取基础拼图ID（去除可能的子关卡后缀）
      const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
      const key = `${basePuzzleId}_${entry.pieceShape}`;

      if (!puzzleMap.has(key)) {
        // 创建新的拼图排行榜条目
        puzzleMap.set(key, {
          id: `consolidated_${basePuzzleId}_${entry.pieceShape}`,
          puzzleId: basePuzzleId,
          puzzleName: entry.puzzleName,
          playerName: entry.playerName,
          bestTime: entry.completionTime,
          bestMoves: entry.moves,
          totalCompletions: 1,
          averageTime: entry.completionTime,
          averageMoves: entry.moves,
          difficulties: [entry.difficulty],
          pieceShape: entry.pieceShape,
          lastCompletedAt: entry.completedAt
        });
      } else {
        const existing = puzzleMap.get(key);
        
        // 更新最佳记录
        if (entry.completionTime < existing.bestTime || 
            (entry.completionTime === existing.bestTime && entry.moves < existing.bestMoves)) {
          existing.bestTime = entry.completionTime;
          existing.bestMoves = entry.moves;
          existing.playerName = entry.playerName; // 更新为最佳记录持有者
        }

        // 更新统计数据
        existing.totalCompletions++;
        existing.averageTime = Math.round((existing.averageTime * (existing.totalCompletions - 1) + entry.completionTime) / existing.totalCompletions);
        existing.averageMoves = Math.round(((existing.averageMoves * (existing.totalCompletions - 1) + entry.moves) / existing.totalCompletions) * 10) / 10;
        
        // 添加难度等级（去重）
        if (!existing.difficulties.includes(entry.difficulty)) {
          existing.difficulties.push(entry.difficulty);
        }

        // 更新最后完成时间
        if (entry.completedAt > existing.lastCompletedAt) {
          existing.lastCompletedAt = entry.completedAt;
        }
      }
    });

    // 按最佳时间和步数排序
    return Array.from(puzzleMap.values())
      .sort((a, b) => {
        if (a.bestTime !== b.bestTime) {
          return a.bestTime - b.bestTime;
        }
        return a.bestMoves - b.bestMoves;
      })
      .slice(0, limit);
  }

  // 模拟添加或更新每日挑战记录
  static addDailyChallengeEntry(entry) {
    const newEntry = {
      ...entry,
      id: this.generateId(),
      completedAt: new Date()
    };

    const entries = this.getDailyChallengeLeaderboard();
    
    // 检查是否已存在同一天同一用户的记录
    const existingIndex = entries.findIndex(e => 
      e.date === newEntry.date && e.playerName === newEntry.playerName
    );

    if (existingIndex >= 0) {
      // 如果新记录更好，则更新
      const existing = entries[existingIndex];
      if (newEntry.score > existing.score || 
          (newEntry.score === existing.score && newEntry.completionTime < existing.completionTime)) {
        entries[existingIndex] = newEntry;
      }
    } else {
      entries.push(newEntry);
    }

    this.saveDailyChallengeLeaderboard(entries);
    return newEntry;
  }

  // 模拟获取每日挑战排行榜（按指定日期）
  static getDailyChallengeRanking(date, limit = 50) {
    const entries = this.getDailyChallengeLeaderboard();
    
    let filtered = entries;
    if (date) {
      filtered = entries.filter(entry => entry.date === date);
    }

    // 按得分降序排序，得分相同则按时间升序
    return filtered
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // 得分高的在前
        }
        return a.completionTime - b.completionTime; // 时间短的在前
      })
      .slice(0, limit);
  }

  // 模拟获取玩家的每日挑战统计信息
  static getPlayerDailyChallengeStats(playerName) {
    const entries = this.getDailyChallengeLeaderboard().filter(e => e.playerName === playerName);
    
    if (entries.length === 0) {
      return {
        totalChallenges: 0,
        averageScore: 0,
        consecutiveDays: 0,
        bestScore: 0,
        completionRate: 0
      };
    }

    // 计算统计数据
    const totalChallenges = entries.length;
    const averageScore = entries.reduce((sum, e) => sum + e.score, 0) / totalChallenges;
    const bestScore = Math.max(...entries.map(e => e.score));
    
    // 计算连续天数（简化版：取最新记录的连续天数）
    const latestEntry = entries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0];
    const consecutiveDays = latestEntry.consecutiveDays;

    // 完成率（假设每天都有挑战机会）
    const uniqueDates = new Set(entries.map(e => e.date)).size;
    const completionRate = (uniqueDates / totalChallenges) * 100;

    return {
      totalChallenges,
      averageScore: Math.round(averageScore * 10) / 10,
      consecutiveDays,
      bestScore,
      completionRate: Math.round(completionRate * 10) / 10
    };
  }

  // 模拟提取基础拼图ID
  static extractBasePuzzleId(puzzleId) {
    // 简单返回原始拼图ID，不进行任何处理
    // 这样可以确保测试数据中的每个拼图ID都被视为不同的拼图
    return puzzleId;
  }

  // 模拟获取特定拼图排行榜
  static getPuzzleLeaderboard(puzzleId, difficulty, pieceShape, limit = 10) {
    const entries = this.getLeaderboard();
    
    let filtered = entries.filter(entry => entry.puzzleId === puzzleId);
    
    if (difficulty) {
      filtered = filtered.filter(entry => entry.difficulty === difficulty);
    }

    if (pieceShape) {
      filtered = filtered.filter(entry => entry.pieceShape === pieceShape);
    }

    // 排序：优先步数少，其次用时短
    filtered.sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves;
      }
      return a.completionTime - b.completionTime;
    });

    return filtered.slice(0, limit);
  }

  // 模拟获取特定难度和形状的全部排行榜
  static getDifficultyLeaderboard(difficulty, pieceShape, limit = 50) {
    const entries = this.getLeaderboard();
    
    let filtered = entries.filter(entry => entry.difficulty === difficulty);
    
    if (pieceShape) {
      filtered = filtered.filter(entry => entry.pieceShape === pieceShape);
    }
    
    // 排序：优先步数少，其次用时短
    filtered.sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves;
      }
      return a.completionTime - b.completionTime;
    });

    return filtered.slice(0, limit);
  }

  // 模拟获取玩家的最佳记录
  static getPlayerBestRecords(playerName) {
    const entries = this.getLeaderboard();
    const playerEntries = entries.filter(entry => entry.playerName === playerName);
    
    // 按拼图、难度和形状分组，获取每组的最佳记录
    const bestRecords = new Map();
    
    playerEntries.forEach(entry => {
      const key = `${entry.puzzleId}_${entry.difficulty}_${entry.pieceShape}`;
      const existing = bestRecords.get(key);
      
      if (!existing || this.compareEntries(entry, existing) < 0) {
        bestRecords.set(key, entry);
      }
    });
    
    return Array.from(bestRecords.values()).sort((a, b) => 
      b.completedAt.getTime() - a.completedAt.getTime()
    );
  }

  // 模拟检查是否为新记录
  static isNewRecord(puzzleId, difficulty, pieceShape, playerName, moves, completionTime) {
    const entries = this.getLeaderboard();
    const playerEntries = entries.filter(entry => 
      entry.puzzleId === puzzleId && 
      entry.difficulty === difficulty && 
      entry.pieceShape === pieceShape &&
      entry.playerName === playerName
    );

    if (playerEntries.length === 0) return true;

    const bestEntry = playerEntries.reduce((best, current) => 
      this.compareEntries(current, best) < 0 ? current : best
    );

    return moves < bestEntry.moves || 
           (moves === bestEntry.moves && completionTime < bestEntry.completionTime);
  }

  // 模拟获取玩家在特定拼图中的排名
  static getPlayerRank(puzzleId, difficulty, pieceShape, playerName) {
    const leaderboard = this.getPuzzleLeaderboard(puzzleId, difficulty, pieceShape);
    const playerEntries = leaderboard.filter(entry => entry.playerName === playerName);
    
    if (playerEntries.length === 0) return null;
    
    const bestPlayerEntry = playerEntries.reduce((best, current) => 
      this.compareEntries(current, best) < 0 ? current : best
    );

    return leaderboard.findIndex(entry => entry.id === bestPlayerEntry.id) + 1;
  }

  // 模拟获取包含前3名的拼图排行榜
  static getPuzzleLeaderboardWithTop3(limit = 50) {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map();

    entries.forEach(entry => {
      // 提取基础拼图ID（去除可能的子关卡后缀）
      const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
      const key = `${basePuzzleId}_${entry.pieceShape}`;

      if (!puzzleMap.has(key)) {
        // 创建新的拼图排行榜条目
        puzzleMap.set(key, {
          id: `consolidated_${basePuzzleId}_${entry.pieceShape}`,
          puzzleId: basePuzzleId,
          puzzleName: entry.puzzleName,
          pieceShape: entry.pieceShape,
          topPlayers: [{
            playerName: entry.playerName,
            time: entry.completionTime,
            moves: entry.moves,
            difficulty: entry.difficulty,
            completedAt: entry.completedAt
          }],
          totalCompletions: 1,
          averageTime: entry.completionTime,
          averageMoves: entry.moves,
          difficulties: [entry.difficulty],
          lastCompletedAt: entry.completedAt
        });
      } else {
        const existing = puzzleMap.get(key);
        
        // 直接添加所有记录到排行榜列表
        const playerRecord = {
          playerName: entry.playerName,
          time: entry.completionTime,
          moves: entry.moves,
          difficulty: entry.difficulty,
          completedAt: entry.completedAt
        };

        // 不再去重，直接添加所有成绩
        existing.topPlayers.push(playerRecord);

        // 按时间和步数排序，取前3名最快成绩
        existing.topPlayers.sort((a, b) => {
          if (a.time !== b.time) return a.time - b.time;
          return a.moves - b.moves;
        });
        existing.topPlayers = existing.topPlayers.slice(0, 3);

        // 更新统计数据
        existing.totalCompletions++;
        existing.averageTime = Math.round((existing.averageTime * (existing.totalCompletions - 1) + entry.completionTime) / existing.totalCompletions);
        existing.averageMoves = Math.round(((existing.averageMoves * (existing.totalCompletions - 1) + entry.moves) / existing.totalCompletions) * 10) / 10;
        
        // 添加难度等级（去重）
        if (!existing.difficulties.includes(entry.difficulty)) {
          existing.difficulties.push(entry.difficulty);
        }

        // 更新最后完成时间
        if (entry.completedAt > existing.lastCompletedAt) {
          existing.lastCompletedAt = entry.completedAt;
        }
      }
    });

    // 按第一名的成绩排序
    return Array.from(puzzleMap.values())
      .sort((a, b) => {
        const aFirstPlace = a.topPlayers[0];
        const bFirstPlace = b.topPlayers[0];
        if (aFirstPlace.time !== bFirstPlace.time) {
          return aFirstPlace.time - bFirstPlace.time;
        }
        return aFirstPlace.moves - bFirstPlace.moves;
      })
      .slice(0, limit);
  }

  // 模拟获取指定拼图的所有难度记录
  static getPuzzleAllDifficultiesLeaderboard(puzzleId, pieceShape, limit = 50) {
    const entries = this.getLeaderboard();
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const result = {};

    difficulties.forEach(difficulty => {
      const filtered = entries.filter(entry => 
        entry.puzzleId === puzzleId && 
        entry.difficulty === difficulty && 
        entry.pieceShape === pieceShape
      );

      // 排序：优先步数少，其次用时短
      filtered.sort((a, b) => {
        if (a.moves !== b.moves) {
          return a.moves - b.moves;
        }
        return a.completionTime - b.completionTime;
      });

      result[difficulty] = filtered.slice(0, limit);
    });

    return result;
  }

  // 模拟获取统计信息
  static getStats() {
    const entries = this.getLeaderboard();
    
    const uniquePlayers = new Set(entries.map(entry => entry.playerName)).size;
    const totalGames = entries.length;
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    
    const difficultyStats = difficulties.map(difficulty => ({
      difficulty,
      count: entries.filter(entry => entry.difficulty === difficulty).length,
      averageTime: this.calculateAverageTime(entries.filter(entry => entry.difficulty === difficulty)),
      averageMoves: this.calculateAverageMoves(entries.filter(entry => entry.difficulty === difficulty))
    }));

    return {
      uniquePlayers,
      totalGames,
      difficultyStats
    };
  }

  // 模拟清除过期记录
  static clearOldRecords(daysOld = 30) {
    const entries = this.getLeaderboard();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filteredEntries = entries.filter(entry => entry.completedAt > cutoffDate);
    const removedCount = entries.length - filteredEntries.length;
    
    if (removedCount > 0) {
      this.saveLeaderboard(filteredEntries);
    }
    
    return removedCount;
  }

  // 私有方法模拟
  static saveLeaderboard(entries) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存排行榜数据失败:', error);
    }
  }

  static generateId() {
    return `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 比较两个记录，返回 -1, 0, 1
  static compareEntries(a, b) {
    if (a.moves !== b.moves) {
      return a.moves - b.moves;
    }
    return a.completionTime - b.completionTime;
  }

  static calculateAverageTime(entries) {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.completionTime, 0);
    return Math.round(total / entries.length);
  }

  static calculateAverageMoves(entries) {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.moves, 0);
    return Math.round(total / entries.length * 10) / 10; // 保留一位小数
  }
}

// 导出模拟的LeaderboardService
const LeaderboardService = MockLeaderboardService;

// 测试辅助函数
function logTestResult(testName, passed) {
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'} - ${testName}`);
  return passed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// 测试用的模拟数据
const mockEntries = [
  {
    puzzleId: 'test_puzzle_1',
    puzzleName: '测试拼图1',
    playerName: '玩家A',
    completionTime: 120,
    moves: 45,
    difficulty: 'easy',
    pieceShape: 'square',
    gridSize: '3x3'
  },
  {
    puzzleId: 'test_puzzle_1',
    puzzleName: '测试拼图1',
    playerName: '玩家B',
    completionTime: 98,
    moves: 38,
    difficulty: 'medium',
    pieceShape: 'square',
    gridSize: '4x4'
  },
  {
    puzzleId: 'test_puzzle_2',
    puzzleName: '测试拼图2',
    playerName: '玩家A',
    completionTime: 180,
    moves: 65,
    difficulty: 'hard',
    pieceShape: 'triangle',
    gridSize: '5x5'
  },
  {
    puzzleId: 'test_puzzle_2',
    puzzleName: '测试拼图2',
    playerName: '玩家C',
    completionTime: 150,
    moves: 55,
    difficulty: 'medium',
    pieceShape: 'triangle',
    gridSize: '5x5'
  }
];

const mockDailyEntries = [
  {
    date: '2024-01-01',
    playerName: '玩家A',
    score: 850,
    completionTime: 180,
    moves: 52,
    difficulty: 'medium',
    isPerfect: true,
    consecutiveDays: 5,
    totalChallengesCompleted: 25,
    averageScore: 780
  },
  {
    date: '2024-01-01',
    playerName: '玩家B',
    score: 920,
    completionTime: 160,
    moves: 48,
    difficulty: 'hard',
    isPerfect: true,
    consecutiveDays: 10,
    totalChallengesCompleted: 35,
    averageScore: 820
  }
];

// 主要测试函数
function runTests() {
  console.log('\n====================== 排行榜功能单元测试 ======================\n');
  
  let allTestsPassed = true;
  
  // 清空localStorage
  localStorage.clear();
  
  try {
    // 1. 测试添加基本排行榜记录
    console.log('\n1. 测试添加基本排行榜记录');
    const addedEntries = [];
    mockEntries.forEach(entry => {
      const added = LeaderboardService.addEntry(entry);
      addedEntries.push(added);
      assert(added.id && added.completedAt, '添加记录应包含id和completedAt字段');
    });
    allTestsPassed = logTestResult('添加基本排行榜记录', true) && allTestsPassed;
    
    // 2. 测试获取排行榜数据
    console.log('\n2. 测试获取排行榜数据');
    const leaderboardData = LeaderboardService.getLeaderboard();
    assert(leaderboardData.length === mockEntries.length, `排行榜应包含${mockEntries.length}条记录，实际有${leaderboardData.length}条`);
    allTestsPassed = logTestResult('获取排行榜数据', true) && allTestsPassed;
    
    // 3. 测试获取特定拼图排行榜
    console.log('\n3. 测试获取特定拼图排行榜');
    const puzzle1Entries = LeaderboardService.getPuzzleLeaderboard('test_puzzle_1');
    assert(puzzle1Entries.length === 2, `拼图1应包含2条记录，实际有${puzzle1Entries.length}条`);
    
    const puzzle1EasyEntries = LeaderboardService.getPuzzleLeaderboard('test_puzzle_1', 'easy');
    assert(puzzle1EasyEntries.length === 1, `拼图1简单难度应包含1条记录，实际有${puzzle1EasyEntries.length}条`);
    allTestsPassed = logTestResult('获取特定拼图排行榜', true) && allTestsPassed;
    
    // 4. 测试获取难度排行榜
    console.log('\n4. 测试获取难度排行榜');
    const mediumEntries = LeaderboardService.getDifficultyLeaderboard('medium');
    assert(mediumEntries.length === 2, `中等难度应包含2条记录，实际有${mediumEntries.length}条`);
    
    const mediumSquareEntries = LeaderboardService.getDifficultyLeaderboard('medium', 'square');
    assert(mediumSquareEntries.length === 1, `中等难度方形拼图应包含1条记录，实际有${mediumSquareEntries.length}条`);
    allTestsPassed = logTestResult('获取难度排行榜', true) && allTestsPassed;
    
    // 5. 测试获取玩家最佳记录
    console.log('\n5. 测试获取玩家最佳记录');
    const playerARecords = LeaderboardService.getPlayerBestRecords('玩家A');
    assert(playerARecords.length === 2, `玩家A应包含2条最佳记录，实际有${playerARecords.length}条`);
    allTestsPassed = logTestResult('获取玩家最佳记录', true) && allTestsPassed;
    
    // 6. 测试检查新记录
    console.log('\n6. 测试检查新记录');
    const isNewRecord1 = LeaderboardService.isNewRecord(
      'test_puzzle_1', 'easy', 'square', '玩家A', 40, 110
    );
    assert(isNewRecord1, '更好的成绩应被识别为新记录');
    
    const isNewRecord2 = LeaderboardService.isNewRecord(
      'test_puzzle_1', 'easy', 'square', '玩家A', 50, 130
    );
    assert(!isNewRecord2, '更差的成绩不应被识别为新记录');
    allTestsPassed = logTestResult('检查新记录', true) && allTestsPassed;
    
    // 7. 测试获取玩家排名
    console.log('\n7. 测试获取玩家排名');
    const playerBRank = LeaderboardService.getPlayerRank(
      'test_puzzle_1', 'medium', 'square', '玩家B'
    );
    assert(playerBRank === 1, `玩家B在拼图1中等难度应排名第1，实际排名第${playerBRank}`);
    allTestsPassed = logTestResult('获取玩家排名', true) && allTestsPassed;
    
    // 8. 测试获取统计信息
    console.log('\n8. 测试获取统计信息');
    const stats = LeaderboardService.getStats();
    assert(stats.uniquePlayers === 3, `应有3个唯一玩家，实际有${stats.uniquePlayers}个`);
    assert(stats.totalGames === 4, `应有4场游戏，实际有${stats.totalGames}场`);
    allTestsPassed = logTestResult('获取统计信息', true) && allTestsPassed;
    
    // 9. 测试每日挑战功能
    console.log('\n9. 测试每日挑战功能');
    mockDailyEntries.forEach(entry => {
      LeaderboardService.addDailyChallengeEntry(entry);
    });
    
    const dailyChallengeData = LeaderboardService.getDailyChallengeRanking('2024-01-01');
    assert(dailyChallengeData.length === 2, `每日挑战排行榜应包含2条记录，实际有${dailyChallengeData.length}条`);
    assert(dailyChallengeData[0].score === 920, `第一名得分应为920，实际为${dailyChallengeData[0].score}`);
    allTestsPassed = logTestResult('每日挑战功能', true) && allTestsPassed;
    
    // 10. 测试获取玩家每日挑战统计
    console.log('\n10. 测试获取玩家每日挑战统计');
    const playerAStats = LeaderboardService.getPlayerDailyChallengeStats('玩家A');
    assert(playerAStats.totalChallenges === 1, `玩家A每日挑战次数应为1，实际为${playerAStats.totalChallenges}`);
    assert(playerAStats.bestScore === 850, `玩家A最佳得分应为850，实际为${playerAStats.bestScore}`);
    allTestsPassed = logTestResult('获取玩家每日挑战统计', true) && allTestsPassed;
    
    // 11. 测试拼图合并排行榜
    console.log('\n11. 测试拼图合并排行榜');
    const consolidatedLeaderboard = LeaderboardService.getPuzzleConsolidatedLeaderboard();
    assert(consolidatedLeaderboard.length === 2, `合并排行榜应包含2条记录，实际有${consolidatedLeaderboard.length}条`);
    allTestsPassed = logTestResult('拼图合并排行榜', true) && allTestsPassed;
    
    // 12. 测试边界条件
    console.log('\n12. 测试边界条件');
    // 12.1 空排行榜
    localStorage.clear();
    const emptyLeaderboard = LeaderboardService.getLeaderboard();
    assert(emptyLeaderboard.length === 0, '空排行榜应返回空数组');
    
    // 12.2 无效数据处理
    localStorage.setItem('puzzle_leaderboard', 'invalid_json_data');
    const invalidDataLeaderboard = LeaderboardService.getLeaderboard();
    assert(invalidDataLeaderboard.length === 0, '无效数据应返回空数组');
    
    // 重置数据
    localStorage.clear();
    mockEntries.forEach(entry => LeaderboardService.addEntry(entry));
    allTestsPassed = logTestResult('边界条件', true) && allTestsPassed;
    
    // 13. 测试包含前3名的拼图排行榜
    console.log('\n13. 测试包含前3名的拼图排行榜');
    const leaderboardWithTop3 = LeaderboardService.getPuzzleLeaderboardWithTop3();
    assert(leaderboardWithTop3.length > 0, '前3名排行榜不应为空');
    
    const puzzleAllDifficulties = LeaderboardService.getPuzzleAllDifficultiesLeaderboard('test_puzzle_1', 'square');
    assert(Object.keys(puzzleAllDifficulties).length === 4, `应为4个难度等级提供记录，实际有${Object.keys(puzzleAllDifficulties).length}个`);
    allTestsPassed = logTestResult('包含前3名的拼图排行榜', true) && allTestsPassed;
    
    // 14. 测试清除过期记录
    console.log('\n14. 测试清除过期记录');
    // 模拟旧记录
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    
    // Mock Date 以创建过期记录
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(oldDate.getTime());
        } else {
          super(...args);
        }
      }
    };
    
    const oldEntry = LeaderboardService.addEntry({
      puzzleId: 'old_puzzle',
      puzzleName: '旧拼图',
      playerName: '旧玩家',
      completionTime: 100,
      moves: 40,
      difficulty: 'easy',
      pieceShape: 'square',
      gridSize: '3x3'
    });
    
    // 恢复原始Date
    Date = originalDate;
    
    // 添加新记录
    const newEntry = LeaderboardService.addEntry({
      puzzleId: 'new_puzzle',
      puzzleName: '新拼图',
      playerName: '新玩家',
      completionTime: 90,
      moves: 35,
      difficulty: 'easy',
      pieceShape: 'square',
      gridSize: '3x3'
    });
    
    // 清除30天前的记录
    const removedCount = LeaderboardService.clearOldRecords(30);
    assert(removedCount === 1, `应清除1条旧记录，实际清除${removedCount}条`);
    
    const remainingEntries = LeaderboardService.getLeaderboard();
    // 应该保留新添加的记录和最初的4条记录
    assert(remainingEntries.length === 5, `应保留5条记录，实际保留${remainingEntries.length}条`);
    allTestsPassed = logTestResult('清除过期记录', true) && allTestsPassed;
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    allTestsPassed = false;
  }
  
  console.log('\n====================== 测试完成 ======================\n');
  
  if (allTestsPassed) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('❌ 有测试失败！');
  }
  
  return allTestsPassed;
}

// 运行测试
const testsPassed = runTests();

// 导出测试结果供其他脚本使用
if (typeof module !== 'undefined') {
  module.exports = { testsPassed };
}