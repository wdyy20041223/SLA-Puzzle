import { LeaderboardEntry, DifficultyLevel, PieceShape } from '../types';

/**
 * API排行榜服务 - 与后端数据库连接
 */
export class APILeaderboardService {
  private static readonly API_BASE_URL = (() => {
    // 从环境变量获取API URL，支持HTTPS/HTTP自动检测
    const configuredUrl = (window as any).env?.REACT_APP_API_URL || 
                         import.meta.env.VITE_API_BASE_URL || 
                         'http://localhost:3001/api';
    
    // 如果是localhost开发环境，根据当前页面协议选择
    if (configuredUrl.includes('localhost')) {
      const protocol = window.location.protocol;
      return configuredUrl.replace(/^https?:/, protocol);
    }
    
    // 生产环境优先使用HTTPS
    const supportHttps = import.meta.env.VITE_API_SUPPORT_HTTPS !== 'false';
    if (supportHttps && !configuredUrl.startsWith('https:')) {
      return configuredUrl.replace(/^http:/, 'https:');
    }
    
    return configuredUrl;
  })();
  
  /**
   * 获取JWT Token
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * 发送HTTP请求的通用方法
   */
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`API请求失败: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * 添加游戏完成记录
   */
  static async addGameRecord(gameData: {
    puzzleName?: string;
    difficulty: DifficultyLevel;
    pieceShape: PieceShape;
    gridSize: string;
    totalPieces: number;
    completionTime: number;
    moves: number;
  }): Promise<{
    gameId: string;
    score: number;
    rewards: { coins: number; experience: number };
    isNewRecord: boolean;
    leveledUp: boolean;
    addedToLeaderboard: boolean;
  }> {
    return this.request('/games/complete', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  /**
   * 获取总排行榜
   */
  static async getLeaderboard(filters: {
    difficulty?: DifficultyLevel;
    pieceShape?: PieceShape;
    sortBy?: 'completion_time' | 'moves' | 'score';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    leaderboard: Array<{
      rank: number;
      username: string;
      puzzleName?: string;
      difficulty: DifficultyLevel;
      pieceShape: PieceShape;
      gridSize: string;
      completionTime: number;
      moves: number;
      score: number;
      completedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    userRank?: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
    if (filters.pieceShape) queryParams.append('pieceShape', filters.pieceShape);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const endpoint = `/games/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 获取用户游戏历史
   */
  static async getGameHistory(filters: {
    difficulty?: DifficultyLevel;
    pieceShape?: PieceShape;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    games: Array<{
      id: string;
      puzzleName?: string;
      difficulty: DifficultyLevel;
      pieceShape: PieceShape;
      gridSize: string;
      completionTime: number;
      moves: number;
      score: number;
      completedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
    if (filters.pieceShape) queryParams.append('pieceShape', filters.pieceShape);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const endpoint = `/games/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(): Promise<{
    basic: {
      totalGames: number;
      avgCompletionTime: number;
      bestTime: number;
      avgMoves: number;
      bestMoves: number;
      bestScore: number;
      totalCoinsEarned: number;
      totalExperienceEarned: number;
    };
    byDifficulty: Record<string, {
      count: number;
      avgTime: number;
      bestTime: number;
      avgMoves: number;
      bestMoves: number;
      bestScore: number;
    }>;
    byShape: Record<string, {
      count: number;
      avgTime: number;
      bestTime: number;
    }>;
    recentActivity: Array<{
      date: string;
      gamesCount: number;
      coinsEarned: number;
      experienceEarned: number;
    }>;
    bestRecords: Record<string, {
      time: number;
      moves: number;
    }>;
  }> {
    return this.request('/games/stats');
  }

  /**
   * 检查用户是否已登录
   */
  static isLoggedIn(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * 从本地存储迁移数据到后端（一次性操作）
   */
  static async migrateLocalDataToAPI(): Promise<void> {
    if (!this.isLoggedIn()) {
      console.warn('用户未登录，无法迁移数据到服务器');
      return;
    }

    try {
      // 获取本地排行榜数据
      const localData = localStorage.getItem('puzzle_leaderboard');
      if (!localData) {
        console.log('没有本地数据需要迁移');
        return;
      }

      const entries: LeaderboardEntry[] = JSON.parse(localData);
      console.log(`开始迁移 ${entries.length} 条本地数据到服务器...`);

      let successCount = 0;
      let errorCount = 0;

      for (const entry of entries) {
        try {
          await this.addGameRecord({
            puzzleName: entry.puzzleName,
            difficulty: entry.difficulty,
            pieceShape: entry.pieceShape,
            gridSize: entry.gridSize,
            totalPieces: this.calculateTotalPieces(entry.gridSize),
            completionTime: entry.completionTime,
            moves: entry.moves,
          });
          successCount++;
        } catch (error) {
          console.error(`迁移记录失败:`, entry, error);
          errorCount++;
        }
      }

      console.log(`数据迁移完成: ${successCount} 成功, ${errorCount} 失败`);
      
      // 迁移成功后，可以选择备份本地数据然后清空
      if (successCount > 0 && errorCount === 0) {
        localStorage.setItem('puzzle_leaderboard_backup', localData);
        localStorage.removeItem('puzzle_leaderboard');
        console.log('本地数据已备份并清空，现在使用服务器数据');
      }
    } catch (error) {
      console.error('数据迁移过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 根据网格大小计算总拼图块数
   */
  private static calculateTotalPieces(gridSize: string): number {
    const [rows, cols] = gridSize.split('x').map(Number);
    return rows * cols;
  }

  /**
   * 将API数据转换为LeaderboardEntry格式
   */
  static convertAPIToLeaderboardEntry(apiEntry: any): LeaderboardEntry {
    return {
      id: `api_${apiEntry.rank}_${Date.now()}`, // 生成临时ID
      puzzleId: apiEntry.puzzleName || 'unknown',
      puzzleName: apiEntry.puzzleName || '未知拼图',
      playerName: apiEntry.username,
      completionTime: apiEntry.completionTime,
      moves: apiEntry.moves,
      difficulty: apiEntry.difficulty,
      pieceShape: apiEntry.pieceShape,
      gridSize: apiEntry.gridSize,
      completedAt: new Date(apiEntry.completedAt),
    };
  }

  /**
   * 获取格式化的排行榜数据（兼容现有接口）
   */
  static async getFormattedLeaderboard(
    difficulty: DifficultyLevel,
    shape: PieceShape,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const response = await this.getLeaderboard({
        difficulty,
        pieceShape: shape,
        sortBy: 'completion_time',
        limit,
      });

      return response.leaderboard.map(entry => this.convertAPIToLeaderboardEntry(entry));
    } catch (error) {
      console.error('获取API排行榜失败，使用本地数据:', error);
      // 如果API失败，回退到本地数据
      return this.getLocalLeaderboard(difficulty, shape, limit);
    }
  }

  /**
   * 获取本地排行榜数据（回退方案）
   */
  private static getLocalLeaderboard(
    difficulty: DifficultyLevel,
    shape: PieceShape,
    limit: number
  ): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem('puzzle_leaderboard');
      if (!data) return [];
      
      const entries: LeaderboardEntry[] = JSON.parse(data).map((entry: any) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));

      return entries
        .filter(entry => entry.difficulty === difficulty && entry.pieceShape === shape)
        .sort((a, b) => {
          if (a.completionTime !== b.completionTime) {
            return a.completionTime - b.completionTime;
          }
          return a.moves - b.moves;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('获取本地排行榜数据失败:', error);
      return [];
    }
  }
}
