import { GameState, PuzzleConfig } from '../types';

// 保存的游戏进度数据结构
export interface SavedPuzzleGame {
  id: string;
  gameState: GameState;
  savedAt: Date;
  thumbnailData?: string; // 游戏截图的缩略图
  description?: string; // 保存时的描述
  userId?: string; // 用户ID，用于多用户支持
}

// 本地存储键
const SAVED_GAMES_KEY = 'puzzle_saved_games';
const MAX_SAVED_GAMES = 10; // 最多保存10个游戏进度

export class PuzzleSaveService {
  // 获取所有保存的游戏
  public static getSavedGames(userId?: string): SavedPuzzleGame[] {
    try {
      const savedGamesJson = localStorage.getItem(SAVED_GAMES_KEY);
      if (!savedGamesJson) return [];
      
      const allSavedGames: SavedPuzzleGame[] = JSON.parse(savedGamesJson);
      
      // 如果提供了用户ID，只返回该用户的保存游戏
      if (userId) {
        return allSavedGames.filter(game => game.userId === userId);
      }
      
      return allSavedGames;
    } catch (error) {
      console.error('获取保存游戏失败:', error);
      return [];
    }
  }

  // 保存游戏进度
  public static saveGame(
    gameState: GameState, 
    description?: string, 
    userId?: string,
    overwriteId?: string
  ): { success: boolean; savedGame?: SavedPuzzleGame; error?: string } {
    try {
      // 验证游戏状态
      if (!gameState || !gameState.config) {
        return { success: false, error: '无效的游戏状态' };
      }

      // 如果游戏已完成，不允许保存
      if (gameState.isCompleted) {
        return { success: false, error: '已完成的游戏无法保存' };
      }

      // 获取现有的保存游戏
      const allSavedGames = this.getSavedGames();
      
      let savedGame: SavedPuzzleGame;
      
      if (overwriteId) {
        // 覆盖模式：找到要覆盖的存档
        const overwriteIndex = allSavedGames.findIndex(game => game.id === overwriteId);
        
        if (overwriteIndex === -1) {
          return { success: false, error: '要覆盖的存档不存在' };
        }
        
        // 保持原有的ID和创建时间，更新其他信息
        const originalGame = allSavedGames[overwriteIndex];
        savedGame = {
          id: originalGame.id, // 保持原有ID
          gameState: this.deepCloneGameState(gameState),
          savedAt: new Date(), // 更新保存时间
          description: description || this.generateAutoDescription(gameState),
          userId: userId,
        };
        
        // 替换现有存档
        allSavedGames[overwriteIndex] = savedGame;
        
      } else {
        // 新建模式：创建新的保存游戏对象
        savedGame = {
          id: this.generateSaveId(),
          gameState: this.deepCloneGameState(gameState),
          savedAt: new Date(),
          description: description || this.generateAutoDescription(gameState),
          userId: userId,
        };

        // 如果有用户ID，检查该用户的保存游戏数量
        let userSavedGames = allSavedGames;
        if (userId) {
          userSavedGames = allSavedGames.filter(game => game.userId === userId);
        }

        // 如果超过最大数量，删除最旧的保存
        if (userSavedGames.length >= MAX_SAVED_GAMES) {
          const sortedGames = userSavedGames.sort((a, b) => 
            new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
          );
          
          // 从所有保存游戏中移除最旧的
          const oldestGame = sortedGames[0];
          const indexToRemove = allSavedGames.findIndex(game => game.id === oldestGame.id);
          if (indexToRemove !== -1) {
            allSavedGames.splice(indexToRemove, 1);
          }
        }

        // 添加新保存的游戏
        allSavedGames.push(savedGame);
      }

      // 保存到本地存储
      localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(allSavedGames));

      return { success: true, savedGame };
    } catch (error) {
      console.error('保存游戏失败:', error);
      return { success: false, error: '保存失败，请稍后重试' };
    }
  }

  // 加载游戏进度
  public static loadGame(saveId: string): { success: boolean; gameState?: GameState; error?: string } {
    try {
      const savedGames = this.getSavedGames();
      const savedGame = savedGames.find(game => game.id === saveId);

      if (!savedGame) {
        return { success: false, error: '找不到指定的保存游戏' };
      }

      // 验证保存的游戏状态
      if (!savedGame.gameState || !savedGame.gameState.config) {
        return { success: false, error: '保存的游戏数据损坏' };
      }

      // 恢复日期对象
      const gameState = this.restoreDatesInGameState(savedGame.gameState);

      return { success: true, gameState };
    } catch (error) {
      console.error('加载游戏失败:', error);
      return { success: false, error: '加载失败，请稍后重试' };
    }
  }

  // 删除保存的游戏
  public static deleteSavedGame(saveId: string): { success: boolean; error?: string } {
    try {
      const savedGames = this.getSavedGames();
      const initialLength = savedGames.length;
      
      const filteredGames = savedGames.filter(game => game.id !== saveId);
      
      if (filteredGames.length === initialLength) {
        return { success: false, error: '找不到指定的保存游戏' };
      }

      localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(filteredGames));
      return { success: true };
    } catch (error) {
      console.error('删除保存游戏失败:', error);
      return { success: false, error: '删除失败，请稍后重试' };
    }
  }

  // 清空所有保存的游戏
  public static clearAllSavedGames(userId?: string): { success: boolean; error?: string } {
    try {
      if (userId) {
        // 只清空指定用户的保存游戏
        const allSavedGames = this.getSavedGames();
        const filteredGames = allSavedGames.filter(game => game.userId !== userId);
        localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(filteredGames));
      } else {
        // 清空所有保存游戏
        localStorage.removeItem(SAVED_GAMES_KEY);
      }
      
      return { success: true };
    } catch (error) {
      console.error('清空保存游戏失败:', error);
      return { success: false, error: '清空失败，请稍后重试' };
    }
  }

  // 生成保存ID
  private static generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成自动描述
  private static generateAutoDescription(gameState: GameState): string {
    const { config, moves } = gameState;
    const puzzleName = config.name || '未命名拼图';
    const difficulty = config.difficulty || 'unknown';
    const progress = this.calculateProgress(gameState);
    
    return `${puzzleName} (${difficulty}) - 进度 ${progress.toFixed(1)}% - ${moves} 步`;
  }

  // 计算游戏进度
  private static calculateProgress(gameState: GameState): number {
    const { answerGrid } = gameState;
    if (!answerGrid || answerGrid.length === 0) return 0;
    
    const totalSlots = answerGrid.length;
    const filledSlots = answerGrid.filter(slot => slot !== null).length;
    
    return (filledSlots / totalSlots) * 100;
  }

  // 深度克隆游戏状态
  private static deepCloneGameState(gameState: GameState): GameState {
    // 使用JSON序列化/反序列化来深度克隆，但需要特殊处理Date对象
    const jsonString = JSON.stringify(gameState, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
    
    return JSON.parse(jsonString);
  }

  // 恢复游戏状态中的Date对象
  private static restoreDatesInGameState(gameState: any): GameState {
    const jsonString = JSON.stringify(gameState);
    
    return JSON.parse(jsonString, (key, value) => {
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
  }

  // 获取保存游戏的统计信息
  public static getSaveStats(userId?: string): {
    totalSaves: number;
    oldestSave?: Date;
    newestSave?: Date;
    storageUsed: number; // 大约的存储使用量（字节）
  } {
    const savedGames = this.getSavedGames(userId);
    
    if (savedGames.length === 0) {
      return { totalSaves: 0, storageUsed: 0 };
    }

    const savedDates = savedGames.map(game => new Date(game.savedAt));
    savedDates.sort((a, b) => a.getTime() - b.getTime());

    // 计算存储使用量
    const jsonString = JSON.stringify(savedGames);
    const storageUsed = new Blob([jsonString]).size;

    return {
      totalSaves: savedGames.length,
      oldestSave: savedDates[0],
      newestSave: savedDates[savedDates.length - 1],
      storageUsed,
    };
  }

  // 验证保存的游戏数据完整性
  public static validateSavedGame(savedGame: SavedPuzzleGame): boolean {
    try {
      if (!savedGame.id || !savedGame.gameState || !savedGame.savedAt) {
        return false;
      }

      const { gameState } = savedGame;
      if (!gameState.config || !gameState.config.pieces || !gameState.answerGrid) {
        return false;
      }

      // 验证拼图块数量一致性
      const totalSlots = gameState.config.gridSize.rows * gameState.config.gridSize.cols;
      if (gameState.answerGrid.length !== totalSlots) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('验证保存游戏数据失败:', error);
      return false;
    }
  }
}
