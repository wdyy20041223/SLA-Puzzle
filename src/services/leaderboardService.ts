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
   * 获取特定拼图的完整排行榜（仿照总排行榜逻辑）
   */
  static getSinglePuzzleLeaderboard(
    puzzleId: string, 
    difficulty: DifficultyLevel, 
    shape: PieceShape, 
    limit: number = 50
  ): LeaderboardEntry[] {
    const entries = this.getLeaderboard();
    
    // 首先根据puzzleId找到对应的拼图名称
    const puzzleConfig = this.getAllPuzzleConfigs().find(p => p.id === puzzleId);
    if (!puzzleConfig) {
      return []; // 如果找不到对应的拼图配置，返回空数组
    }
    
    // 筛选特定拼图名称、难度和形状的记录
    const filteredEntries = entries.filter(entry => {
      const basePuzzleName = this.extractBasePuzzleName(entry.puzzleName);
      return basePuzzleName === puzzleConfig.name && 
             entry.difficulty === difficulty && 
             entry.pieceShape === shape;
    });

    // 按时间升序排序，时间相同则按步数升序排序
    return filteredEntries
      .sort((a, b) => {
        if (a.completionTime !== b.completionTime) {
          return a.completionTime - b.completionTime;
        }
        return a.moves - b.moves;
      })
      .slice(0, limit);
  }

  /**
   * 获取所有拼图的筛选排行榜（每个拼图显示筛选后的完整排行榜）
   */
  static getAllPuzzleFilteredLeaderboards(
    difficulty: DifficultyLevel, 
    shape: PieceShape
  ): Array<{
    puzzleId: string;
    puzzleName: string;
    hasRecords: boolean;
    leaderboard: LeaderboardEntry[];
    totalPlayers: number;
    bestTime: number | null;
    bestMoves: number | null;
    totalCompletions: number;
  }> {
    const allPuzzles = this.getAllPuzzleConfigs();
    const result: Array<{
      puzzleId: string;
      puzzleName: string;
      hasRecords: boolean;
      leaderboard: LeaderboardEntry[];
      totalPlayers: number;
      bestTime: number | null;
      bestMoves: number | null;
      totalCompletions: number;
    }> = [];

    allPuzzles.forEach(puzzle => {
      const leaderboard = this.getSinglePuzzleLeaderboard(puzzle.id, difficulty, shape);
      const hasRecords = leaderboard.length > 0;
      
      let bestTime: number | null = null;
      let bestMoves: number | null = null;
      if (hasRecords) {
        bestTime = leaderboard[0].completionTime;
        bestMoves = leaderboard[0].moves;
      }

      result.push({
        puzzleId: puzzle.id,
        puzzleName: puzzle.name,
        hasRecords,
        leaderboard,
        totalPlayers: new Set(leaderboard.map(entry => entry.playerName)).size,
        bestTime,
        bestMoves,
        totalCompletions: leaderboard.length
      });
    });

    // 按是否有记录排序，有记录的在前，然后按最佳时间排序
    return result.sort((a, b) => {
      if (a.hasRecords && !b.hasRecords) return -1;
      if (!a.hasRecords && b.hasRecords) return 1;
      if (!a.hasRecords && !b.hasRecords) return 0;
      
      // 都有记录时，按最佳时间排序
      if (a.bestTime !== null && b.bestTime !== null) {
        if (a.bestTime !== b.bestTime) {
          return a.bestTime - b.bestTime;
        }
        return (a.bestMoves || 0) - (b.bestMoves || 0);
      }
      return 0;
    });
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
   * 获取所有拼图配置
   */
  static getAllPuzzleConfigs(): Array<{ id: string; name: string }> {
    return [
      // 图标类拼图 - 对应首页主要拼图（使用实际的拼图名称）
      { id: 'tauri_logo', name: 'Tauri Logo' },
      { id: 'vite_logo', name: 'Vite Logo' },
      { id: 'react_logo', name: 'React Logo' },
      
      // 自然风光拼图
      { id: 'landscape1', name: '山景风光' },
      { id: 'landscape2', name: '日落海景' },
      { id: 'landscape3', name: '森林风光' },
      
      // 动物拼图
      { id: 'cat1', name: '可爱小猫' },
      
      // 建筑拼图
      { id: 'castle1', name: '古典建筑' },
      
      // 动漫拼图
      { id: 'anime1', name: '动漫角色' },
      
      // 商店拼图素材 - 使用与AssetLibrary一致的名称
      { id: 'puzzle_image_1', name: '森林花园' },
      { id: 'puzzle_image_2', name: '黄昏日落' },
      { id: 'puzzle_image_3', name: '玫瑰花园' },
    ];
  }

  /**
   * 获取包含所有拼图的排行榜（包含前3名），没有成绩的显示"暂无成绩"
   */
  static getAllPuzzleLeaderboardWithTop3(): any[] {
    try {
      const entries = this.getLeaderboard();
      const allPuzzles = this.getAllPuzzleConfigs();
      const pieceShapes: PieceShape[] = ['square', 'irregular', 'triangle'];
      
      const result: any[] = [];

      // 为每个拼图和每种拼块形状创建排行榜条目
      allPuzzles.forEach(puzzle => {
        pieceShapes.forEach(shape => {
          try {
            // 查找该拼图和形状的所有记录
            const puzzleEntries = entries.filter(entry => {
              if (!entry || !entry.puzzleId || !entry.pieceShape) return false;
              const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
              return basePuzzleId === puzzle.id && entry.pieceShape === shape;
            });

            if (puzzleEntries.length > 0) {
              // 有记录，按时间和步数排序，取前3名
              const sortedEntries = puzzleEntries
                .map(entry => ({
                  playerName: entry.playerName || '未知玩家',
                  time: entry.completionTime || 0,
                  moves: entry.moves || 0,
                  difficulty: entry.difficulty || 'easy',
                  completedAt: entry.completedAt || new Date()
                }))
                .sort((a, b) => {
                  if (a.time !== b.time) return a.time - b.time;
                  return a.moves - b.moves;
                })
                .slice(0, 3);

              result.push({
                id: `${puzzle.id}_${shape}`,
                puzzleId: puzzle.id,
                puzzleName: puzzle.name,
                pieceShape: shape,
                hasRecords: true,
                topPlayers: sortedEntries
              });
            } else {
              // 没有记录
              result.push({
                id: `${puzzle.id}_${shape}_empty`,
                puzzleId: puzzle.id,
                puzzleName: puzzle.name,
                pieceShape: shape,
                hasRecords: false,
                topPlayers: []
              });
            }
          } catch (error) {
            console.error(`处理拼图 ${puzzle.id} (${shape}) 时出错:`, error);
            // 出错时也创建一个空的条目
            result.push({
              id: `${puzzle.id}_${shape}_error`,
              puzzleId: puzzle.id,
              puzzleName: puzzle.name,
              pieceShape: shape,
              hasRecords: false,
              topPlayers: []
            });
          }
        });
      });

      return result;
    } catch (error) {
      console.error('获取所有拼图排行榜失败:', error);
      return [];
    }
  }

  /**
   * 获取包含前3名的拼图排行榜（同一玩家可有多个成绩）- 原有方法保持兼容
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

    const totalChallenges = entries.length;
    const averageScore = Math.round(entries.reduce((sum, e) => sum + e.score, 0) / totalChallenges);
    const bestScore = Math.max(...entries.map(e => e.score));
    
    // 计算连续天数（简化计算）
    const sortedDates = entries.map(e => e.date).sort();
    let consecutiveDays = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return {
      totalChallenges,
      averageScore,
      consecutiveDays,
      bestScore,
      completionRate: 100 // 简化为100%，实际应该根据可用挑战天数计算
    };
  }

  /**
   * 保存排行榜记录
   */
  private static saveLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存排行榜数据失败:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 提取基础拼图ID（去除子关卡后缀）
   */
  static extractBasePuzzleId(puzzleId: string): string {
    return puzzleId.replace(/_level\d+$/, '');
  }

  /**
   * 提取基础拼图名称（去除子关卡后缀）
   */
  static extractBasePuzzleName(puzzleName: string): string {
    return puzzleName.replace(/\s*-\s*第\d+关$/, '').replace(/\s*Level\s*\d+$/, '');
  }

  /**
   * 根据拼图ID和关卡获取特定的排行榜
   */
  static getPuzzleSpecificLeaderboard(
    puzzleId: string,
    difficulty?: DifficultyLevel,
    pieceShape?: PieceShape,
    limit: number = 50
  ): LeaderboardEntry[] {
    const entries = this.getLeaderboard();
    
    let filtered = entries.filter(entry => entry.puzzleId === puzzleId);
    
    if (difficulty) {
      filtered = filtered.filter(entry => entry.difficulty === difficulty);
    }
    
    if (pieceShape) {
      filtered = filtered.filter(entry => entry.pieceShape === pieceShape);
    }
    
    // 按时间升序排序，时间相同则按步数升序
    filtered.sort((a, b) => {
      if (a.completionTime !== b.completionTime) {
        return a.completionTime - b.completionTime;
      }
      return a.moves - b.moves;
    });
    
    return filtered.slice(0, limit);
  }

  /**
   * 获取按难度筛选的排行榜
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
    
    // 按时间升序排序，时间相同则按步数升序
    filtered.sort((a, b) => {
      if (a.completionTime !== b.completionTime) {
        return a.completionTime - b.completionTime;
      }
      return a.moves - b.moves;
    });
    
    return filtered.slice(0, limit);
  }

  /**
   * 获取按形状筛选的排行榜
   */
  static getLeaderboardByShape(pieceShape: PieceShape, limit: number = 50): LeaderboardEntry[] {
    const entries = this.getLeaderboard();
    const playerEntries = entries.filter(entry => entry.pieceShape === pieceShape);
    
    // 按时间升序排序，时间相同则按步数升序
    playerEntries.sort((a, b) => {
      if (a.completionTime !== b.completionTime) {
        return a.completionTime - b.completionTime;
      }
      return a.moves - b.moves;
    });
    
    return playerEntries.slice(0, limit);
  }

  /**
   * 获取玩家个人最佳记录
   */
  static getPlayerBestRecord(
    playerName: string,
    difficulty?: DifficultyLevel,
    pieceShape?: PieceShape
  ): LeaderboardEntry | null {
    const entries = this.getLeaderboard();
    const playerEntries = entries.filter(entry =>
      entry.playerName === playerName &&
      (!difficulty || entry.difficulty === difficulty) &&
      (!pieceShape || entry.pieceShape === pieceShape)
    );
    
    if (playerEntries.length === 0) return null;
    
    // 找到时间最短的记录，时间相同则选择步数最少的
    const bestEntry = playerEntries.reduce((best, current) =>
      current.completionTime < best.completionTime ||
      (current.completionTime === best.completionTime && current.moves < best.moves)
        ? current
        : best
    );
    
    return bestEntry;
  }

  /**
   * 获取玩家排名
   */
  static getPlayerRank(
    playerName: string,
    difficulty?: DifficultyLevel,
    pieceShape?: PieceShape
  ): number {
    const entries = this.getLeaderboard();
    let filtered = entries;
    
    if (difficulty) {
      filtered = filtered.filter(entry => entry.difficulty === difficulty);
    }
    
    if (pieceShape) {
      filtered = filtered.filter(entry => entry.pieceShape === pieceShape);
    }
    
    // 按时间升序排序
    filtered.sort((a, b) => {
      if (a.completionTime !== b.completionTime) {
        return a.completionTime - b.completionTime;
      }
      return a.moves - b.moves;
    });
    
    // 查找玩家排名
    const playerIndex = filtered.findIndex(entry => entry.playerName === playerName);
    return playerIndex === -1 ? 0 : playerIndex + 1;
  }

  /**
   * 获取拼图排行榜（仅返回不重复的拼图条目）
   */
  static getPuzzleLeaderboard(limit: number = 50): any[] {
    const entries = this.getLeaderboard();
    const puzzleMap = new Map<string, any>();

    entries.forEach(entry => {
      // 提取基础拼图ID（去除可能的子关卡后缀）
      const basePuzzleId = this.extractBasePuzzleId(entry.puzzleId);
      const key = `${basePuzzleId}_${entry.pieceShape}`;

      if (!puzzleMap.has(key)) {
        // 创建新的拼图排行榜条目
        puzzleMap.set(key, {
          id: `puzzle_${basePuzzleId}_${entry.pieceShape}`,
          puzzleId: basePuzzleId,
          puzzleName: this.extractBasePuzzleName(entry.puzzleName),
          pieceShape: entry.pieceShape,
          bestTime: entry.completionTime,
          bestMoves: entry.moves,
          playerName: entry.playerName,
          completedAt: entry.completedAt,
          difficulty: entry.difficulty
        });
      } else {
        const existing = puzzleMap.get(key)!;
        
        // 如果找到更好的记录，更新
        if (entry.completionTime < existing.bestTime ||
            (entry.completionTime === existing.bestTime && entry.moves < existing.bestMoves)) {
          existing.bestTime = entry.completionTime;
          existing.bestMoves = entry.moves;
          existing.playerName = entry.playerName;
          existing.completedAt = entry.completedAt;
          existing.difficulty = entry.difficulty;
        }
      }
    });

    // 按最佳时间排序，然后按步数排序
    const sortedResults = Array.from(puzzleMap.values()).sort((a, b) => {
      if (a.bestTime !== b.bestTime) {
        return a.bestTime - b.bestTime;
      }
      return a.bestMoves - b.bestMoves;
    });

    return sortedResults.slice(0, limit);
  }

  /**
   * 获取统计信息
   */
  static getStats(): any {
    const entries = this.getLeaderboard();
    const uniquePlayers = new Set(entries.map(entry => entry.playerName)).size;
    const totalGames = entries.length;

    const difficultyStats = {
      easy: {
        count: entries.filter(entry => entry.difficulty === 'easy').length,
        averageTime: this.calculateAverageTime(entries.filter(entry => entry.difficulty === 'easy')),
        averageMoves: this.calculateAverageMoves(entries.filter(entry => entry.difficulty === 'easy'))
      },
      medium: {
        count: entries.filter(entry => entry.difficulty === 'medium').length,
        averageTime: this.calculateAverageTime(entries.filter(entry => entry.difficulty === 'medium')),
        averageMoves: this.calculateAverageMoves(entries.filter(entry => entry.difficulty === 'medium'))
      },
      hard: {
        count: entries.filter(entry => entry.difficulty === 'hard').length,
        averageTime: this.calculateAverageTime(entries.filter(entry => entry.difficulty === 'hard')),
        averageMoves: this.calculateAverageMoves(entries.filter(entry => entry.difficulty === 'hard'))
      }
    };

    return {
      totalGames,
      uniquePlayers,
      difficulty: difficultyStats
    };
  }

  /**
   * 清理旧记录
   */
  static cleanupOldRecords(daysToKeep: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const entries = this.getLeaderboard();
    const filteredEntries = entries.filter(entry => entry.completedAt > cutoffDate);
    const removedCount = entries.length - filteredEntries.length;
    
    if (removedCount > 0) {
      this.saveLeaderboard(filteredEntries);
    }
    
    return removedCount;
  }

  /**
   * 导出排行榜数据
   */
  static exportData(): string {
    const allData = {
      leaderboard: this.getLeaderboard(),
      dailyChallenge: this.getDailyChallengeLeaderboard(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(allData, null, 2);
  }

  /**
   * 导入排行榜数据
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.leaderboard));
      }
      
      if (data.dailyChallenge && Array.isArray(data.dailyChallenge)) {
        localStorage.setItem(this.DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(data.dailyChallenge));
      }
      
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  /**
   * 计算平均时间
   */
  private static calculateAverageTime(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;
    const totalTime = entries.reduce((sum, entry) => sum + entry.completionTime, 0);
    return Math.round(totalTime / entries.length);
  }

  /**
   * 计算平均步数
   */
  private static calculateAverageMoves(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;
    const totalMoves = entries.reduce((sum, entry) => sum + entry.moves, 0);
    return Math.round(totalMoves / entries.length);
  }
}
