import { DailyChallengeLeaderboardEntry } from '../types';

/**
 * 实时每日挑战排行榜服务
 * 模仿用户信息与后端数据库的交互形式，实现实时更新
 */
export class RealtimeDailyChallengeService {
  private static readonly API_BASE_URL = (() => {
    const configuredUrl = (window as any).env?.REACT_APP_API_URL || 
                         import.meta.env.VITE_API_BASE_URL || 
                         'http://localhost:3001/api';
    
    if (configuredUrl.includes('localhost')) {
      const protocol = window.location.protocol;
      return configuredUrl.replace(/^https?:/, protocol);
    }
    
    const supportHttps = import.meta.env.VITE_API_SUPPORT_HTTPS !== 'false';
    if (supportHttps && !configuredUrl.startsWith('https:')) {
      return configuredUrl.replace(/^http:/, 'https:');
    }
    
    return configuredUrl;
  })();

  private static readonly STORAGE_KEY = 'realtime_daily_challenge_leaderboard';
  private static readonly CACHE_DURATION = 30000; // 30秒缓存
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();

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
   * 提交每日挑战完成记录到后端
   */
  static async submitDailyChallengeCompletion(challengeData: {
    date: string;
    challengeId: string;
    puzzleName: string;
    difficulty: string;
    pieceShape: string;
    gridSize: string;
    totalPieces: number;
    completionTime: number;
    moves: number;
    score: number;
    isPerfect: boolean;
    totalStars: number;
    consecutiveDays: number;
  }): Promise<{
    gameId: string;
    score: number;
    rewards: { coins: number; experience: number };
    isNewRecord: boolean;
    rank: number;
    leaderboardUpdated: boolean;
  }> {
    try {
      console.log('🚀 提交每日挑战完成记录到后端:', challengeData);
      
      const result = await this.request('/games/daily-challenge/complete', {
        method: 'POST',
        body: JSON.stringify(challengeData),
      });

      console.log('✅ 每日挑战记录提交成功:', result);
      
      // 清除相关缓存，强制下次获取最新数据
      this.clearCache();
      
      return {
        ...result,
        leaderboardUpdated: true
      };
    } catch (error) {
      console.error('❌ 提交每日挑战记录失败:', error);
      
      // 如果API失败，回退到本地存储
      return this.fallbackToLocalStorage(challengeData);
    }
  }

  /**
   * 获取实时每日挑战排行榜
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
      console.log('🌐 从后端获取实时每日挑战排行榜...');
      
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      queryParams.append('limit', limit.toString());
      
      const endpoint = `/games/daily-challenge/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request(endpoint);
      
      const leaderboardData = {
        leaderboard: response.leaderboard || [],
        userRank: response.userRank,
        lastUpdated: new Date().toISOString(),
        isRealtime: true
      };

      // 缓存结果
      this.cache.set(cacheKey, {
        data: leaderboardData,
        timestamp: Date.now()
      });

      console.log('✅ 实时排行榜数据获取成功:', leaderboardData);
      return leaderboardData;
      
    } catch (error) {
      console.warn('⚠️ 后端API失败，使用本地数据:', error);
      
      // 回退到本地存储
      return this.getLocalDailyChallengeLeaderboard(date, limit);
    }
  }

  /**
   * 获取本地每日挑战排行榜（回退方案）
   */
  private static getLocalDailyChallengeLeaderboard(
    date?: string, 
    limit: number = 50
  ): {
    leaderboard: DailyChallengeLeaderboardEntry[];
    userRank?: number;
    lastUpdated: string;
    isRealtime: boolean;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {
          leaderboard: [],
          lastUpdated: new Date().toISOString(),
          isRealtime: false
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
        isRealtime: false
      };
    } catch (error) {
      console.error('获取本地每日挑战排行榜失败:', error);
      return {
        leaderboard: [],
        lastUpdated: new Date().toISOString(),
        isRealtime: false
      };
    }
  }

  /**
   * 回退到本地存储（当API失败时）
   */
  private static fallbackToLocalStorage(challengeData: any): {
    gameId: string;
    score: number;
    rewards: { coins: number; experience: number };
    isNewRecord: boolean;
    rank: number;
    leaderboardUpdated: boolean;
  } {
    console.log('🔄 回退到本地存储模式');
    
    const newEntry: Omit<DailyChallengeLeaderboardEntry, 'id' | 'completedAt'> = {
      playerName: challengeData.playerName || '未知玩家',
      date: challengeData.date,
      puzzleName: challengeData.puzzleName,
      difficulty: challengeData.difficulty,
      pieceShape: challengeData.pieceShape,
      gridSize: challengeData.gridSize,
      completionTime: challengeData.completionTime,
      moves: challengeData.moves,
      score: challengeData.score,
      isPerfect: challengeData.isPerfect,
      totalStars: challengeData.totalStars,
      consecutiveDays: challengeData.consecutiveDays
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
   * 保存到本地存储
   */
  private static saveToLocalStorage(entry: Omit<DailyChallengeLeaderboardEntry, 'id' | 'completedAt'>): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const entries: DailyChallengeLeaderboardEntry[] = data ? JSON.parse(data) : [];
      
      const newEntry: DailyChallengeLeaderboardEntry = {
        ...entry,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        completedAt: new Date()
      };

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

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
      console.log('💾 本地存储保存成功');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  /**
   * 清除缓存
   */
  private static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 缓存已清除');
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    return !!this.getAuthToken();
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
      if (this.isLoggedIn()) {
        const response = await this.request('/games/daily-challenge/stats');
        return response;
      } else {
        // 本地统计
        return this.getLocalUserStats();
      }
    } catch (error) {
      console.warn('获取用户统计失败，使用本地数据:', error);
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
      
      // 计算连续天数（简化计算）
      const sortedDates = entries.map(e => e.date).sort();
      let consecutiveDays = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
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
   * 实时刷新排行榜（用于定时更新）
   */
  static async refreshLeaderboard(
    date?: string, 
    limit: number = 50
  ): Promise<{
    leaderboard: DailyChallengeLeaderboardEntry[];
    userRank?: number;
    lastUpdated: string;
    isRealtime: boolean;
  }> {
    return this.getRealtimeDailyChallengeLeaderboard(date, limit, true);
  }

  /**
   * 启动实时更新（定时刷新）
   */
  static startRealtimeUpdates(
    callback: (data: {
      leaderboard: DailyChallengeLeaderboardEntry[];
      userRank?: number;
      lastUpdated: string;
      isRealtime: boolean;
    }) => void,
    interval: number = 10000, // 10秒刷新一次
    date?: string,
    limit: number = 50
  ): () => void {
    console.log('🔄 启动实时更新，间隔:', interval + 'ms');
    
    const refresh = async () => {
      try {
        const data = await this.refreshLeaderboard(date, limit);
        callback(data);
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
}
