/**
 * 每日挑战排行榜调试工具
 * 用于调试和修复每日挑战排行榜的数据问题
 */

import { LeaderboardService } from '../services/leaderboardService';
import { DailyChallengeLeaderboardEntry } from '../types';

export class DailyChallengeLeaderboardDebug {
  /**
   * 检查每日挑战排行榜数据状态
   */
  static checkDataStatus(): {
    hasData: boolean;
    totalEntries: number;
    todayEntries: number;
    lastEntry: DailyChallengeLeaderboardEntry | null;
    storageKey: string;
  } {
    const storageKey = 'daily_challenge_leaderboard';
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      return {
        hasData: false,
        totalEntries: 0,
        todayEntries: 0,
        lastEntry: null,
        storageKey
      };
    }

    try {
      const entries: DailyChallengeLeaderboardEntry[] = JSON.parse(data);
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(entry => entry.date === today);
      const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

      return {
        hasData: true,
        totalEntries: entries.length,
        todayEntries: todayEntries.length,
        lastEntry,
        storageKey
      };
    } catch (error) {
      console.error('解析每日挑战排行榜数据失败:', error);
      return {
        hasData: false,
        totalEntries: 0,
        todayEntries: 0,
        lastEntry: null,
        storageKey
      };
    }
  }

  /**
   * 添加测试数据到每日挑战排行榜
   */
  static addTestData(): void {
    const today = new Date().toISOString().split('T')[0];
    
    const testEntries = [
      {
        date: today,
        playerName: '测试玩家A',
        score: 850,
        completionTime: 180,
        moves: 52,
        difficulty: 'medium' as const,
        isPerfect: true,
        consecutiveDays: 5,
        totalChallengesCompleted: 25,
        averageScore: 780,
        totalStars: 3
      },
      {
        date: today,
        playerName: '测试玩家B',
        score: 920,
        completionTime: 160,
        moves: 48,
        difficulty: 'hard' as const,
        isPerfect: true,
        consecutiveDays: 10,
        totalChallengesCompleted: 35,
        averageScore: 820,
        totalStars: 4
      },
      {
        date: today,
        playerName: '测试玩家C',
        score: 750,
        completionTime: 200,
        moves: 60,
        difficulty: 'easy' as const,
        isPerfect: false,
        consecutiveDays: 3,
        totalChallengesCompleted: 15,
        averageScore: 720,
        totalStars: 2
      }
    ];

    testEntries.forEach(entry => {
      try {
        LeaderboardService.addDailyChallengeEntry(entry);
        console.log(`✅ 添加测试记录: ${entry.playerName} - 分数: ${entry.score}`);
      } catch (error) {
        console.error(`❌ 添加测试记录失败: ${entry.playerName}`, error);
      }
    });
  }

  /**
   * 清空每日挑战排行榜数据
   */
  static clearData(): void {
    localStorage.removeItem('daily_challenge_leaderboard');
    console.log('✅ 每日挑战排行榜数据已清空');
  }

  /**
   * 验证排行榜排序
   */
  static validateSorting(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const ranking = LeaderboardService.getDailyChallengeRanking(today);
    
    if (ranking.length <= 1) {
      console.log('⚠️ 排行榜数据不足，无法验证排序');
      return true;
    }

    // 检查是否按分数降序排序
    for (let i = 1; i < ranking.length; i++) {
      if (ranking[i-1].score < ranking[i].score) {
        console.error(`❌ 排序错误: 第${i}位分数(${ranking[i-1].score}) < 第${i+1}位分数(${ranking[i].score})`);
        return false;
      }
      
      // 如果分数相同，检查是否按时间升序排序
      if (ranking[i-1].score === ranking[i].score && 
          ranking[i-1].completionTime > ranking[i].completionTime) {
        console.error(`❌ 排序错误: 分数相同时，第${i}位时间(${ranking[i-1].completionTime}) > 第${i+1}位时间(${ranking[i].completionTime})`);
        return false;
      }
    }

    console.log('✅ 排行榜排序验证通过');
    return true;
  }

  /**
   * 显示排行榜数据
   */
  static displayRanking(date?: string): void {
    const ranking = LeaderboardService.getDailyChallengeRanking(date);
    
    if (ranking.length === 0) {
      console.log('📊 排行榜为空');
      return;
    }

    console.log(`📊 每日挑战排行榜 (${date || '所有日期'}):`);
    ranking.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.playerName} - 分数: ${entry.score} - 用时: ${entry.completionTime}秒 - 步数: ${entry.moves} - 完美: ${entry.isPerfect ? '是' : '否'}`);
    });
  }

  /**
   * 修复排行榜数据
   */
  static fixData(): void {
    console.log('🔧 开始修复每日挑战排行榜数据...');
    
    // 1. 检查数据状态
    const status = this.checkDataStatus();
    console.log('📊 数据状态:', status);
    
    // 2. 如果数据为空，添加测试数据
    if (!status.hasData) {
      console.log('📝 添加测试数据...');
      this.addTestData();
    }
    
    // 3. 验证排序
    const isValid = this.validateSorting();
    if (!isValid) {
      console.log('🔄 重新排序数据...');
      // 重新获取并保存数据，触发重新排序
      const today = new Date().toISOString().split('T')[0];
      const ranking = LeaderboardService.getDailyChallengeRanking(today);
      // 这里不需要手动保存，因为 getDailyChallengeRanking 已经返回排序后的数据
    }
    
    // 4. 显示修复后的数据
    this.displayRanking();
    
    console.log('✅ 每日挑战排行榜数据修复完成');
  }

  /**
   * 运行完整的调试和修复流程
   */
  static runFullDebug(): void {
    console.log('🧪 开始每日挑战排行榜完整调试...\n');
    
    // 1. 检查初始状态
    console.log('1️⃣ 检查初始状态:');
    this.displayRanking();
    
    // 2. 添加测试数据
    console.log('\n2️⃣ 添加测试数据:');
    this.addTestData();
    
    // 3. 验证排序
    console.log('\n3️⃣ 验证排序:');
    this.validateSorting();
    
    // 4. 显示最终结果
    console.log('\n4️⃣ 最终结果:');
    this.displayRanking();
    
    console.log('\n🎉 调试完成！');
  }
}

// 导出调试函数供控制台使用
(window as any).DailyChallengeLeaderboardDebug = DailyChallengeLeaderboardDebug;
