import { LeaderboardEntry, DifficultyLevel, PieceShape, DailyChallengeLeaderboardEntry, PuzzleLeaderboardEntry } from '../types';

export class LeaderboardService {
  private static readonly STORAGE_KEY = 'puzzle_leaderboard';
  private static readonly DAILY_CHALLENGE_STORAGE_KEY = 'daily_challenge_leaderboard';

  /**
   * 获取所有排行榜记录
   */
  static getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry: any) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      return [];
    }
  }

  /**
   * 获取每日挑战排行榜记录
   */
  static getDailyChallengeLeaderboard(): DailyChallengeLeaderboardEntry[] {
    try {
      const data = localStorage.getItem(this.DAILY_CHALLENGE_STORAGE_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry: any) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));
    } catch (error) {
      console.error('获取每日挑战排行榜数据失败:', error);
      return [];
    }
  }

  /**
   * 保存每日挑战排行榜记录
   */
  private static saveDailyChallengeLeaderboard(entries: DailyChallengeLeaderboardEntry[]): void {
    try {
      localStorage.setItem(this.DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存每日挑战排行榜数据失败:', error);
    }
  }

  /**
   * 添加新的排行榜记录
   */
  static addEntry(entry: Omit<LeaderboardEntry, 'id' | 'completedAt'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: this.generateId(),
      completedAt: new Date()
    };

    const entries = this.getLeaderboard();
    entries.push(newEntry);
    this.saveLeaderboard(entries);
    
    return newEntry;
  }

  /**
   * 获取合并后的单拼图排行榜（同一张地图的所有成绩合并为一个榜单）
   */
  static getPuzzleConsolidatedLeaderboard(limit: number = 50): PuzzleLeaderboardEntry[] {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map<string, PuzzleLeaderboardEntry>();

    entries.forEach(entry => {
      // 提取基础拼图ID（去除可能的子关卡后缀）
      const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
      const key = `${basePuzzleId}_${entry.pieceShape}`;

      if (!puzzleMap.has(key)) {
        // 创建新的拼图排行榜条目
        puzzleMap.set(key, {
          id: `consolidated_${basePuzzleId}_${entry.pieceShape}`,
          puzzleId: basePuzzleId,
          puzzleName: this.extractBasePuzzleName(entry.puzzleName),
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
        const existing = puzzleMap.get(key)!;
        
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

  /**
   * 获取包含前3名的拼图排行榜（同一玩家可有多个成绩）
   */
  static getPuzzleLeaderboardWithTop3(limit: number = 50): any[] {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map<string, any>();

    entries.forEach(entry => {
      // 提取基础拼图ID（去除可能的子关卡后缀）
      const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
      const key = `${basePuzzleId}_${entry.pieceShape}`;

      if (!puzzleMap.has(key)) {
        // 创建新的拼图排行榜条目
        puzzleMap.set(key, {
          id: `consolidated_${basePuzzleId}_${entry.pieceShape}`,
          puzzleId: basePuzzleId,
          puzzleName: this.extractBasePuzzleName(entry.puzzleName),
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
        const existing = puzzleMap.get(key)!;
        
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
        existing.topPlayers.sort((a: any, b: any) => {
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

  /**
   * 添加或更新每日挑战记录
   */
  static addDailyChallengeEntry(entry: Omit<DailyChallengeLeaderboardEntry, 'id' | 'completedAt'>): DailyChallengeLeaderboardEntry {
    const newEntry: DailyChallengeLeaderboardEntry = {
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

  /**
   * 获取每日挑战排行榜（按指定日期）
   */
  static getDailyChallengeRanking(date?: string, limit: number = 50): DailyChallengeLeaderboardEntry[] {
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

  /**
   * 获取玩家的每日挑战统计信息
   */
  static getPlayerDailyChallengeStats(playerName: string): {
    totalChallenges: number;
    averageScore: number;
    consecutiveDays: number;
    bestScore: number;
    completionRate: number;
  } {
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

  /**
   * 提取基础拼图ID（去除子关卡后缀）
   */
  private static extractBasePuzzleId(puzzleId: string): string {
    // 移除常见的子关卡后缀，如 "_level1", "_part2", "-1", 等
    return puzzleId.replace(/[-_](level|part|stage)?\d+$/i, '').replace(/[-_]\d+$/, '');
  }

  /**
   * 提取基础拼图名称（去除子关卡后缀）
   */
  private static extractBasePuzzleName(puzzleName: string): string {
    // 移除常见的子关卡后缀
    return puzzleName.replace(/\s*[-_]?\s*(关卡|部分|阶段|level|part|stage)\s*\d+$/i, '')
                    .replace(/\s*\d+$/, '');
  }
  static getPuzzleLeaderboard(
    puzzleId: string, 
    difficulty?: DifficultyLevel,
    pieceShape?: PieceShape,
    limit: number = 10
  ): LeaderboardEntry[] {
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

  /**
   * 获取特定难度和形状的全部排行榜
   */
  static getDifficultyLeaderboard(
    difficulty: DifficultyLevel,
    pieceShape?: PieceShape,
    limit: number = 50
  ): LeaderboardEntry[] {
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

  /**
   * 获取玩家的最佳记录
   */
  static getPlayerBestRecords(playerName: string): LeaderboardEntry[] {
    const entries = this.getLeaderboard();
    const playerEntries = entries.filter(entry => entry.playerName === playerName);
    
    // 按拼图、难度和形状分组，获取每组的最佳记录
    const bestRecords = new Map<string, LeaderboardEntry>();
    
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

  /**
   * 检查是否为新记录
   */
  static isNewRecord(
    puzzleId: string,
    difficulty: DifficultyLevel,
    pieceShape: PieceShape,
    playerName: string,
    moves: number,
    completionTime: number
  ): boolean {
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

  /**
   * 获取玩家在特定拼图中的排名
   */
  static getPlayerRank(
    puzzleId: string,
    difficulty: DifficultyLevel,
    pieceShape: PieceShape,
    playerName: string
  ): number | null {
    const leaderboard = this.getPuzzleLeaderboard(puzzleId, difficulty, pieceShape);
    const playerEntries = leaderboard.filter(entry => entry.playerName === playerName);
    
    if (playerEntries.length === 0) return null;
    
    const bestPlayerEntry = playerEntries.reduce((best, current) => 
      this.compareEntries(current, best) < 0 ? current : best
    );

    return leaderboard.findIndex(entry => entry.id === bestPlayerEntry.id) + 1;
  }

  /**
   * 获取所有独特的拼图列表
   */
  static getUniquePuzzles(): Array<{id: string, name: string, pieceShape: PieceShape}> {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map<string, {id: string, name: string, pieceShape: PieceShape}>();
    
    entries.forEach(entry => {
      if (!puzzleMap.has(entry.puzzleId)) {
        puzzleMap.set(entry.puzzleId, {
          id: entry.puzzleId,
          name: entry.puzzleName || '未知拼图',
          pieceShape: entry.pieceShape
        });
      }
    });
    
    return Array.from(puzzleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 获取指定拼图的所有难度记录
   */
  static getPuzzleAllDifficultiesLeaderboard(
    puzzleId: string,
    pieceShape: PieceShape,
    limit: number = 50
  ): Record<DifficultyLevel, LeaderboardEntry[]> {
    const entries = this.getLeaderboard();
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[];
    const result: Record<DifficultyLevel, LeaderboardEntry[]> = {} as any;

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

  /**
   * 获取统计信息
   */
  static getStats() {
    const entries = this.getLeaderboard();
    
    const uniquePlayers = new Set(entries.map(entry => entry.playerName)).size;
    const totalGames = entries.length;
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[];
    
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

  /**
   * 清除过期记录（可选功能）
   */
  static clearOldRecords(daysOld: number = 30): number {
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

  // 私有方法

  private static saveLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存排行榜数据失败:', error);
    }
  }

  private static generateId(): string {
    return `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 比较两个记录，返回 -1, 0, 1
   * 优先步数少，其次用时短
   */
  private static compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
    if (a.moves !== b.moves) {
      return a.moves - b.moves;
    }
    return a.completionTime - b.completionTime;
  }

  private static calculateAverageTime(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.completionTime, 0);
    return Math.round(total / entries.length);
  }

  private static calculateAverageMoves(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.moves, 0);
    return Math.round(total / entries.length * 10) / 10; // 保留一位小数
  }
}
