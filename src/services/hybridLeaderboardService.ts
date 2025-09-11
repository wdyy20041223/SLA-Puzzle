import { LeaderboardEntry, DifficultyLevel, PieceShape, DailyChallengeLeaderboardEntry } from '../types';
import { APILeaderboardService } from './apiLeaderboardService';
import { LeaderboardService } from './leaderboardService';

/**
 * 混合排行榜服务 - 智能切换API和本地模式
 */
export class HybridLeaderboardService {
  private static readonly API_ENABLED_KEY = 'api_leaderboard_enabled';
  private static readonly LAST_SYNC_KEY = 'last_api_sync';
  private static readonly NETWORK_CHECK_INTERVAL = 30000; // 30秒

  private static isAPIAvailable = false;
  private static lastNetworkCheck = 0;

  /**
   * 检查是否启用API模式
   */
  private static isAPIEnabled(): boolean {
    return localStorage.getItem(this.API_ENABLED_KEY) === 'true';
  }

  /**
   * 设置API模式状态
   */
  static setAPIEnabled(enabled: boolean): void {
    localStorage.setItem(this.API_ENABLED_KEY, enabled.toString());
    if (enabled) {
      // 启用API时尝试迁移本地数据
      this.migrateToAPI().catch(console.error);
    }
  }

  /**
   * 检查网络连接和API可用性
   */
  private static async checkAPIAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastNetworkCheck < this.NETWORK_CHECK_INTERVAL) {
      return this.isAPIAvailable;
    }

    try {
      if (!navigator.onLine) {
        this.isAPIAvailable = false;
        return false;
      }
      
      // 尝试简单的API调用
      const response = await fetch(`${(APILeaderboardService as any).API_BASE_URL}/games/stats`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
      });
      
      this.isAPIAvailable = response.ok;
      this.lastNetworkCheck = now;
      return this.isAPIAvailable;
    } catch {
      return false;
    }
  }

  /**
   * 自动检测并设置最佳模式（API或本地）
   */
  static async autoConfigureMode(): Promise<void> {
    const hasAuth = APILeaderboardService.isLoggedIn();
    const hasNetwork = await this.checkAPIAvailability();
    
    if (hasAuth && hasNetwork) {
      this.setAPIEnabled(true);
      console.log('🌐 排行榜服务: 使用API模式（已登录 + 网络连接）');
    } else {
      this.setAPIEnabled(false);
      console.log('📱 排行榜服务: 使用本地模式（离线或未登录）');
    }
  }

  /**
   * 迁移本地数据到API
   */
  static async migrateToAPI(): Promise<void> {
    try {
      await APILeaderboardService.migrateLocalDataToAPI();
      localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      console.log('✅ 本地数据迁移到API完成');
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
    }
  }

  /**
   * 检查是否需要同步 - 这里暂时返回false，将来可以扩展
   */
  private static needsSync(): boolean {
    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const now = new Date().getTime();
    // 简化的检查逻辑，5分钟内不重复同步
    return (now - lastSyncTime) > 5 * 60 * 1000;
  }

  /**
   * 添加新的排行榜记录
   */
  static async addEntry(entry: Omit<LeaderboardEntry, 'id' | 'completedAt'>): Promise<LeaderboardEntry> {
    // 总是先保存到本地，确保数据不丢失
    const localEntry = LeaderboardService.addEntry(entry);

    if (this.isAPIEnabled()) {
      try {
        // 尝试提交到API
        await APILeaderboardService.addGameRecord({
          puzzleName: entry.puzzleName,
          difficulty: entry.difficulty,
          pieceShape: entry.pieceShape,
          gridSize: entry.gridSize,
          totalPieces: this.calculateTotalPieces(entry.gridSize),
          completionTime: entry.completionTime,
          moves: entry.moves,
        });
        
        console.log('✅ 游戏记录已同步到服务器');
        localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      } catch (error) {
        console.warn('⚠️ API提交失败，数据已保存到本地:', error);
      }
    }

    return localEntry;
  }

  /**
   * 获取难度筛选的排行榜
   */
  static async getDifficultyLeaderboard(
    difficulty: DifficultyLevel,
    shape: PieceShape,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    if (this.isAPIEnabled()) {
      try {
        // 从API获取全局排行榜
        const apiData = await APILeaderboardService.getFormattedLeaderboard(difficulty, shape, limit);
        console.log('🌐 从API获取排行榜数据');
        return apiData;
      } catch (error) {
        console.warn('⚠️ API获取失败，使用本地数据:', error);
      }
    }

    // 使用本地数据
    console.log('📱 使用本地排行榜数据');
    return LeaderboardService.getDifficultyLeaderboard(difficulty, shape, limit);
  }

  /**
   * 获取单个拼图的完整排行榜
   */
  static async getSinglePuzzleLeaderboard(
    puzzleId: string,
    difficulty: DifficultyLevel,
    shape: PieceShape,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    if (this.isAPIEnabled()) {
      try {
        // 从API获取，但API只有当前用户的数据，所以依然使用本地逻辑
        const allData = await APILeaderboardService.getFormattedLeaderboard(difficulty, shape, limit * 5);
        return allData
          .filter(entry => {
            const basePuzzleId = entry.puzzleId.replace(/_\d+x\d+$/, '');
            return basePuzzleId === puzzleId;
          })
          .slice(0, limit);
      } catch (error) {
        console.warn('⚠️ API获取失败，使用本地数据:', error);
      }
    }

    // 使用本地数据
    return LeaderboardService.getSinglePuzzleLeaderboard(puzzleId, difficulty, shape, limit);
  }

  /**
   * 获取所有拼图的筛选排行榜
   */
  static async getAllPuzzleFilteredLeaderboards(
    difficulty: DifficultyLevel,
    shape: PieceShape
  ): Promise<Array<{
    puzzleId: string;
    puzzleName: string;
    hasRecords: boolean;
    leaderboard: LeaderboardEntry[];
    totalPlayers: number;
    bestTime: number | null;
    bestMoves: number | null;
    totalCompletions: number;
  }>> {
    // 这个功能主要依赖本地数据处理，因为需要完整的拼图配置
    return LeaderboardService.getAllPuzzleFilteredLeaderboards(difficulty, shape);
  }

  /**
   * 获取每日挑战排行榜
   */
  static getDailyChallengeRanking(date?: string, limit: number = 50): DailyChallengeLeaderboardEntry[] {
    // 每日挑战暂时只使用本地存储，因为后端没有相应的表结构
    return LeaderboardService.getDailyChallengeRanking(date, limit);
  }

  /**
   * 添加每日挑战记录
   */
  static addDailyChallengeEntry(
    entry: Omit<DailyChallengeLeaderboardEntry, 'id' | 'completedAt'>
  ): DailyChallengeLeaderboardEntry {
    // 每日挑战暂时只使用本地存储
    return LeaderboardService.addDailyChallengeEntry(entry);
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(): Promise<any> {
    if (this.isAPIEnabled()) {
      try {
        const apiStats = await APILeaderboardService.getUserStats();
        console.log('🌐 从API获取用户统计');
        return apiStats;
      } catch (error) {
        console.warn('⚠️ API获取失败，使用本地统计:', error);
      }
    }

    // 使用本地统计
    console.log('📱 使用本地统计数据');
    return LeaderboardService.getStats();
  }

  /**
   * 获取用户每日挑战统计
   */
  static getPlayerDailyChallengeStats(playerName: string): any {
    // 每日挑战统计暂时只使用本地数据
    return LeaderboardService.getPlayerDailyChallengeStats(playerName);
  }

  /**
   * 初始化服务
   */
  static async initialize(): Promise<void> {
    try {
      await this.autoConfigureMode();
      
      // 如果启用了API且需要同步，执行数据同步
      if (this.isAPIEnabled() && this.needsSync()) {
        await this.migrateToAPI();
      }
    } catch (error) {
      console.error('排行榜服务初始化失败:', error);
      // 初始化失败时回退到本地模式
      this.setAPIEnabled(false);
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
   * 获取服务状态信息
   */
  static getServiceStatus(): {
    mode: 'api' | 'local';
    isLoggedIn: boolean;
    lastSync: string | null;
    needsSync: boolean;
  } {
    return {
      mode: this.isAPIEnabled() ? 'api' : 'local',
      isLoggedIn: APILeaderboardService.isLoggedIn(),
      lastSync: localStorage.getItem(this.LAST_SYNC_KEY),
      needsSync: this.needsSync()
    };
  }

  /**
   * 强制同步数据
   */
  static async forceSync(): Promise<void> {
    if (!this.isAPIEnabled()) {
      throw new Error('API模式未启用');
    }
    
    await this.migrateToAPI();
  }

  /**
   * 手动切换到API模式（需要用户登录）
   */
  static async switchToAPIMode(): Promise<void> {
    if (!APILeaderboardService.isLoggedIn()) {
      throw new Error('请先登录账号');
    }
    
    const hasNetwork = await this.checkAPIAvailability();
    if (!hasNetwork) {
      throw new Error('网络连接不可用');
    }
    
    this.setAPIEnabled(true);
    await this.migrateToAPI();
  }

  /**
   * 手动切换到本地模式
   */
  static switchToLocalMode(): void {
    this.setAPIEnabled(false);
    console.log('📱 已切换到本地模式');
  }
}
