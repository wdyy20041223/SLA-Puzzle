import { DailyChallengeLeaderboardEntry, DifficultyLevel, PieceShape } from '../types';
import { APILeaderboardService } from './apiLeaderboardService';

/**
 * 每日挑战排行榜服务
 * 基于Tauri + React + Vite架构，集成后端API和本地存储
 */
export class DailyChallengeLeaderboardService {
  private static readonly STORAGE_KEY = 'daily_challenge_leaderboard';
  private static readonly CACHE_DURATION = 30000; // 30秒缓存
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * 提交每日挑战完成记录
   * 优先使用Tauri调用后端，失败时回退到本地存储
   */
  static async submitDailyChallengeCompletion(challengeData: {
    date: string;
    challengeId: string;
    puzzleName: string;
    difficulty: DifficultyLevel;
    pieceShape: PieceShape;
    gridSize: string;
    totalPieces: number;
    completionTime: number;
    moves: number;
    score: number;
    isPerfect: boolean;
    totalStars: number;
    consecutiveDays: number;
    playerName: string;
  }): Promise<{
    gameId: string;
    score: number;
    rewards: { coins: number; experience: number };
    isNewRecord: boolean;
    rank: number;
    leaderboardUpdated: boolean;
  }> {
    console.log('🚀 提交每日挑战完成记录:', challengeData);

    try {
      // 1. 优先尝试通过Tauri调用后端API
      if (this.isTauriAvailable()) {
        try {
          const result = await this.submitViaTauri(challengeData);
          console.log('✅ Tauri提交成功:', result);
          this.clearCache(); // 清除缓存，强制下次获取最新数据
          return result;
        } catch (tauriError) {
          console.warn('⚠️ Tauri提交失败，尝试API方式:', tauriError);
        }
      }

      // 2. 尝试通过HTTP API提交
      try {
        const result = await this.submitViaAPI(challengeData);
        console.log('✅ API提交成功:', result);
        this.clearCache();
        return result;
      } catch (apiError) {
        console.warn('⚠️ API提交失败，回退到本地存储:', apiError);
      }

      // 3. 回退到本地存储
      return this.submitToLocalStorage(challengeData);

    } catch (error) {
      console.error('❌ 所有提交方式都失败:', error);
      throw error;
    }
  }

  /**
   * 通过Tauri调用后端API
   */
  private static async submitViaTauri(challengeData: any): Promise<any> {
    // 检查是否有Tauri命令可用
    if (typeof (window as any).__TAURI__ === 'undefined') {
      throw new Error('Tauri不可用');
    }

    // 动态导入Tauri API
    const { invoke } = await import('@tauri-apps/api/core');

    // 调用Tauri命令提交每日挑战记录
    const result = await invoke('submit_daily_challenge', {
      challengeData: {
        date: challengeData.date,
        challengeId: challengeData.challengeId,
        puzzleName: challengeData.puzzleName,
        difficulty: challengeData.difficulty,
        pieceShape: challengeData.pieceShape,
        gridSize: challengeData.gridSize,
        totalPieces: challengeData.totalPieces,
        completionTime: challengeData.completionTime,
        moves: challengeData.moves,
        score: challengeData.score,
        isPerfect: challengeData.isPerfect,
        totalStars: challengeData.totalStars,
        consecutiveDays: challengeData.consecutiveDays,
        playerName: challengeData.playerName
      }
    });

    return {
      gameId: (result as any).gameId,
      score: challengeData.score,
      rewards: {
        coins: challengeData.isPerfect ? 100 : 50,
        experience: challengeData.isPerfect ? 50 : 25
      },
      isNewRecord: (result as any).isNewRecord || true,
      rank: (result as any).rank || 1,
      leaderboardUpdated: true
    };
  }

  /**
   * 通过HTTP API提交
   */
  private static async submitViaAPI(challengeData: any): Promise<any> {
    // 使用fetch直接调用API
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/games/daily-challenge/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(challengeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * 提交到本地存储
   */
  private static submitToLocalStorage(challengeData: any): any {
    console.log('🔄 回退到本地存储模式');
    
    const newEntry: DailyChallengeLeaderboardEntry = {
      id: this.generateId(),
      date: challengeData.date,
      playerName: challengeData.playerName,
      score: challengeData.score,
      completionTime: challengeData.completionTime,
      moves: challengeData.moves,
      difficulty: challengeData.difficulty,
      isPerfect: challengeData.isPerfect,
      consecutiveDays: challengeData.consecutiveDays,
      totalChallengesCompleted: 1, // 本地模式下简化计算
      averageScore: challengeData.score,
      totalStars: challengeData.totalStars,
      completedAt: new Date()
    };

    // 保存到本地存储
    this.saveToLocalStorage(newEntry);

    return {
      gameId: `local_${Date.now()}`,
      score: challengeData.score,
      rewards: {
        coins: challengeData.isPerfect ? 100 : 50,
        experience: challengeData.isPerfect ? 50 : 25
      },
      isNewRecord: true,
      rank: 1, // 本地模式下无法准确计算排名
      leaderboardUpdated: true
    };
  }

  /**
   * 获取实时每日挑战排行榜
   * 支持多种数据源：Tauri > API > 本地存储
   */
  static async getRealtimeDailyChallengeLeaderboard(
    date?: string, 
    limit: number = 50,
    forceRefresh: boolean = false
  ): Promise<{
    leaderboard: DailyChallengeLeaderboardEntry[];
    userRank?: number;
    lastUpdated: string;
    isRealtime: boolean;
    dataSource: 'tauri' | 'api' | 'local';
  }> {
    const cacheKey = `daily_leaderboard_${date || 'today'}_${limit}`;
    
    // 检查缓存
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📱 使用缓存的排行榜数据');
        return cached.data;
      }
    }

    try {
      // 1. 优先尝试Tauri方式
      if (this.isTauriAvailable()) {
        try {
          const data = await this.getViaTauri(date, limit);
          const result = {
            leaderboard: data.leaderboard || [],
            userRank: data.userRank,
            lastUpdated: new Date().toISOString(),
            isRealtime: true,
            dataSource: 'tauri' as const
          };

          this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
          console.log('✅ Tauri获取排行榜成功:', result);
          return result;
        } catch (tauriError) {
          console.warn('⚠️ Tauri获取失败，尝试API方式:', tauriError);
        }
      }

      // 2. 尝试API方式
      try {
        const data = await this.getViaAPI(date, limit);
        const result = {
          leaderboard: data.leaderboard || [],
          userRank: data.userRank,
          lastUpdated: new Date().toISOString(),
          isRealtime: true,
          dataSource: 'api' as const
        };

        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        console.log('✅ API获取排行榜成功:', result);
        return result;
      } catch (apiError) {
        console.warn('⚠️ API获取失败，使用本地数据:', apiError);
      }

      // 3. 回退到本地存储
      const result = this.getFromLocalStorage(date, limit);
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      console.log('📱 使用本地排行榜数据:', result);
      return result;

    } catch (error) {
      console.error('❌ 获取排行榜数据失败:', error);
      throw error;
    }
  }

  /**
   * 通过Tauri获取排行榜
   */
  private static async getViaTauri(date?: string, limit: number = 50): Promise<any> {
    if (typeof (window as any).__TAURI__ === 'undefined') {
      throw new Error('Tauri不可用');
    }

    // 动态导入Tauri API
    const { invoke } = await import('@tauri-apps/api/core');

    return await invoke('get_daily_challenge_leaderboard', {
      date: date || new Date().toISOString().split('T')[0],
      limit: limit
    });
  }

  /**
   * 通过API获取排行榜
   */
  private static async getViaAPI(date?: string, limit: number = 50): Promise<any> {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/api/games/daily-challenge/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * 从本地存储获取排行榜
   */
  private static getFromLocalStorage(
    date?: string, 
    limit: number = 50
  ): {
    leaderboard: DailyChallengeLeaderboardEntry[];
    userRank?: number;
    lastUpdated: string;
    isRealtime: boolean;
    dataSource: 'local';
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {
          leaderboard: [],
          lastUpdated: new Date().toISOString(),
          isRealtime: false,
          dataSource: 'local'
        };
      }
      
      const entries: DailyChallengeLeaderboardEntry[] = JSON.parse(data).map((entry: any) => ({
        ...entry,
        completedAt: new Date(entry.completedAt)
      }));

      const targetDate = date || new Date().toISOString().split('T')[0];
      const filteredEntries = entries
        .filter(entry => !date || entry.date === targetDate)
        .sort((a, b) => {
          if (a.score !== b.score) {
            return b.score - a.score; // 按分数降序
          }
          return a.completionTime - b.completionTime; // 分数相同时按时间升序
        })
        .slice(0, limit);

      return {
        leaderboard: filteredEntries,
        lastUpdated: new Date().toISOString(),
        isRealtime: false,
        dataSource: 'local'
      };
    } catch (error) {
      console.error('获取本地每日挑战排行榜失败:', error);
      return {
        leaderboard: [],
        lastUpdated: new Date().toISOString(),
        isRealtime: false,
        dataSource: 'local'
      };
    }
  }

  /**
   * 获取用户每日挑战统计
   */
  static async getUserDailyChallengeStats(): Promise<{
    totalChallenges: number;
    averageScore: number;
    consecutiveDays: number;
    bestScore: number;
    completionRate: number;
    currentRank?: number;
  }> {
    try {
      // 1. 优先尝试Tauri方式
      if (this.isTauriAvailable()) {
        try {
          // 用 Function 动态导入，防止 Vite 静态分析
          const { invoke } = await (new Function('return import("@tauri-apps/api/tauri")')());
          const result = await invoke('get_daily_challenge_stats');
          return (result as any).data || result;
        } catch (tauriError) {
          console.warn('⚠️ Tauri获取统计失败，尝试API方式:', tauriError);
        }
      }

      // 2. 尝试API方式
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/games/daily-challenge/stats', {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data || data;
      } catch (apiError) {
        console.warn('⚠️ API获取统计失败，使用本地数据:', apiError);
      }

      // 3. 回退到本地统计
      return this.getLocalUserStats();

    } catch (error) {
      console.error('❌ 获取用户统计失败:', error);
      return this.getLocalUserStats();
    }
  }

  /**
   * 获取本地用户统计
   */
  private static getLocalUserStats(): {
    totalChallenges: number;
    averageScore: number;
    consecutiveDays: number;
    bestScore: number;
    completionRate: number;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {
          totalChallenges: 0,
          averageScore: 0,
          consecutiveDays: 0,
          bestScore: 0,
          completionRate: 0
        };
      }

      const entries: DailyChallengeLeaderboardEntry[] = JSON.parse(data);
      const totalChallenges = entries.length;
      const averageScore = totalChallenges > 0 ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / totalChallenges) : 0;
      const bestScore = totalChallenges > 0 ? Math.max(...entries.map(e => e.score)) : 0;
      
      // 计算连续天数
      const consecutiveDays = this.calculateConsecutiveDays(entries);

      return {
        totalChallenges,
        averageScore,
        consecutiveDays,
        bestScore,
        completionRate: 100 // 本地模式下假设100%完成率
      };
    } catch (error) {
      console.error('获取本地用户统计失败:', error);
      return {
        totalChallenges: 0,
        averageScore: 0,
        consecutiveDays: 0,
        bestScore: 0,
        completionRate: 0
      };
    }
  }

  /**
   * 计算连续天数
   */
  private static calculateConsecutiveDays(entries: DailyChallengeLeaderboardEntry[]): number {
    const dates = [...new Set(entries.map(entry => entry.date))].sort();
    let consecutive = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  /**
   * 保存到本地存储
   */
  private static saveToLocalStorage(entry: DailyChallengeLeaderboardEntry): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const entries: DailyChallengeLeaderboardEntry[] = data ? JSON.parse(data) : [];
      
      // 检查是否已存在同一天同一用户的记录
      const existingIndex = entries.findIndex(e => 
        e.date === entry.date && e.playerName === entry.playerName
      );

      if (existingIndex >= 0) {
        // 如果新记录更好，则更新
        const existing = entries[existingIndex];
        if (entry.score > existing.score || 
            (entry.score === existing.score && entry.completionTime < existing.completionTime)) {
          entries[existingIndex] = entry;
        }
      } else {
        entries.push(entry);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
      console.log('💾 本地存储保存成功');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  /**
   * 检查Tauri是否可用
   */
  private static isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).__TAURI__ !== 'undefined';
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `daily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清除缓存
   */
  private static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 缓存已清除');
  }

  /**
   * 启动实时更新
   */
  static startRealtimeUpdates(
    callback: (data: {
      leaderboard: DailyChallengeLeaderboardEntry[];
      userRank?: number;
      lastUpdated: string;
      isRealtime: boolean;
      dataSource: 'tauri' | 'api' | 'local';
    }) => void,
    interval: number = 10000,
    date?: string,
    limit: number = 50
  ): () => void {
    console.log('🔄 启动实时更新，间隔:', interval + 'ms');
    
    const refresh = async () => {
      try {
        const data = await this.getRealtimeDailyChallengeLeaderboard(date, limit, true);
        callback(data);
        console.log('🔄 实时更新完成，数据源:', data.dataSource);
      } catch (error) {
        console.error('实时更新失败:', error);
      }
    };

    // 立即执行一次
    refresh();
    
    // 设置定时器
    const timer = setInterval(refresh, interval);
    
    // 返回停止函数
    return () => {
      console.log('⏹️ 停止实时更新');
      clearInterval(timer);
    };
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * 获取服务状态
   */
  static getServiceStatus(): {
    tauriAvailable: boolean;
    apiAvailable: boolean;
    localAvailable: boolean;
    isLoggedIn: boolean;
    dataSource: 'tauri' | 'api' | 'local';
  } {
    return {
      tauriAvailable: this.isTauriAvailable(),
      apiAvailable: APILeaderboardService.isLoggedIn(),
      localAvailable: true,
      isLoggedIn: this.isLoggedIn(),
      dataSource: this.isTauriAvailable() ? 'tauri' : 
                  APILeaderboardService.isLoggedIn() ? 'api' : 'local'
    };
  }
}
