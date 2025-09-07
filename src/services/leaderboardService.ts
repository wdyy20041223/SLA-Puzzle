import { LeaderboardEntry, DifficultyLevel, PieceShape } from '../types';

export class LeaderboardService {
  private static readonly STORAGE_KEY = 'puzzle_leaderboard';

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
   * 获取特定拼图的排行榜
   */
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
