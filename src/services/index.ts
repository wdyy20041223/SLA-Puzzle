// 服务索引文件 - 统一导出所有排行榜相关服务

// 原始本地存储服务（保持向后兼容）
export { LeaderboardService } from './leaderboardService';

// API服务（用于与后端通信）
export { APILeaderboardService } from './apiLeaderboardService';

// 混合服务（推荐使用，自动切换API和本地模式）
export { HybridLeaderboardService } from './hybridLeaderboardService';

// 默认导出混合服务作为主要使用的服务
export { HybridLeaderboardService as default } from './hybridLeaderboardService';

/**
 * 服务使用指南：
 * 
 * 1. 新项目推荐使用 HybridLeaderboardService
 *    - 自动检测登录状态和网络连接
 *    - 智能切换API和本地模式
 *    - 数据同步和迁移功能
 * 
 * 2. 现有项目可以逐步迁移
 *    - LeaderboardService: 纯本地存储（现有功能）
 *    - APILeaderboardService: 纯API模式（需要登录）
 *    - HybridLeaderboardService: 混合模式（推荐）
 * 
 * 使用示例：
 * ```typescript
 * import HybridLeaderboardService from './services';
 * 
 * // 初始化服务（自动检测最佳模式）
 * await HybridLeaderboardService.initialize();
 * 
 * // 添加游戏记录（自动选择API或本地保存）
 * const entry = await HybridLeaderboardService.addEntry({
 *   puzzleName: 'sunset-beach',
 *   difficulty: 'easy',
 *   pieceShape: 'classic',
 *   gridSize: '3x3',
 *   completionTime: 120000,
 *   moves: 25,
 *   playerName: 'Player1'
 * });
 * 
 * // 获取排行榜（自动选择API或本地数据）
 * const leaderboard = await HybridLeaderboardService.getDifficultyLeaderboard('easy', 'classic', 10);
 * 
 * // 检查服务状态
 * const status = HybridLeaderboardService.getServiceStatus();
 * console.log('当前模式:', status.mode); // 'api' 或 'local'
 * ```
 */
