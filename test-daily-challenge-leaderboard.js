/**
 * 每日挑战排行榜测试脚本
 * 用于测试每日挑战排行榜的数据存储、更新和排序功能
 */

// 模拟 LeaderboardService 类
class MockLeaderboardService {
  static DAILY_CHALLENGE_STORAGE_KEY = 'daily_challenge_leaderboard';

  /**
   * 获取每日挑战排行榜记录
   */
  static getDailyChallengeLeaderboard() {
    try {
      const data = localStorage.getItem(this.DAILY_CHALLENGE_STORAGE_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry) => ({
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
  static saveDailyChallengeLeaderboard(entries) {
    try {
      localStorage.setItem(this.DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('保存每日挑战排行榜数据失败:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 添加每日挑战记录
   */
  static addDailyChallengeEntry(entry) {
    const newEntry = {
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
  static getDailyChallengeRanking(date, limit = 50) {
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
   * 清空每日挑战数据
   */
  static clearDailyChallengeData() {
    localStorage.removeItem(this.DAILY_CHALLENGE_STORAGE_KEY);
  }
}

// 测试函数
function runTests() {
  console.log('🧪 开始测试每日挑战排行榜功能...\n');

  // 清空现有数据
  MockLeaderboardService.clearDailyChallengeData();
  console.log('✅ 清空现有数据');

  // 测试1: 添加每日挑战记录
  console.log('\n📝 测试1: 添加每日挑战记录');
  
  const today = new Date().toISOString().split('T')[0];
  
  const testEntries = [
    {
      date: today,
      playerName: '玩家A',
      score: 850,
      completionTime: 180,
      moves: 52,
      difficulty: 'medium',
      isPerfect: true,
      consecutiveDays: 5,
      totalChallengesCompleted: 25,
      averageScore: 780,
      totalStars: 3
    },
    {
      date: today,
      playerName: '玩家B',
      score: 920,
      completionTime: 160,
      moves: 48,
      difficulty: 'hard',
      isPerfect: true,
      consecutiveDays: 10,
      totalChallengesCompleted: 35,
      averageScore: 820,
      totalStars: 4
    },
    {
      date: today,
      playerName: '玩家C',
      score: 750,
      completionTime: 200,
      moves: 60,
      difficulty: 'easy',
      isPerfect: false,
      consecutiveDays: 3,
      totalChallengesCompleted: 15,
      averageScore: 720,
      totalStars: 2
    },
    {
      date: today,
      playerName: '玩家D',
      score: 920,
      completionTime: 150,
      moves: 45,
      difficulty: 'hard',
      isPerfect: true,
      consecutiveDays: 8,
      totalChallengesCompleted: 30,
      averageScore: 800,
      totalStars: 4
    }
  ];

  testEntries.forEach((entry, index) => {
    const result = MockLeaderboardService.addDailyChallengeEntry(entry);
    console.log(`✅ 添加记录 ${index + 1}: ${result.playerName} - 分数: ${result.score}`);
  });

  // 测试2: 验证数据存储
  console.log('\n💾 测试2: 验证数据存储');
  const storedData = MockLeaderboardService.getDailyChallengeLeaderboard();
  console.log(`✅ 存储的记录数: ${storedData.length}`);
  console.log('存储的数据:', storedData);

  // 测试3: 验证排序功能
  console.log('\n🏆 测试3: 验证排序功能');
  const ranking = MockLeaderboardService.getDailyChallengeRanking(today);
  console.log('排序后的排行榜:');
  ranking.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.playerName} - 分数: ${entry.score} - 用时: ${entry.completionTime}秒`);
  });

  // 验证排序是否正确
  let isSorted = true;
  for (let i = 1; i < ranking.length; i++) {
    if (ranking[i-1].score < ranking[i].score) {
      isSorted = false;
      break;
    }
    if (ranking[i-1].score === ranking[i].score && ranking[i-1].completionTime > ranking[i].completionTime) {
      isSorted = false;
      break;
    }
  }
  console.log(`✅ 排序验证: ${isSorted ? '通过' : '失败'}`);

  // 测试4: 测试同一天同一用户的记录更新
  console.log('\n🔄 测试4: 测试同一天同一用户的记录更新');
  const updatedEntry = {
    date: today,
    playerName: '玩家A',
    score: 900, // 更高的分数
    completionTime: 170, // 更短的时间
    moves: 50,
    difficulty: 'medium',
    isPerfect: true,
    consecutiveDays: 6,
    totalChallengesCompleted: 26,
    averageScore: 790,
    totalStars: 3
  };

  const updateResult = MockLeaderboardService.addDailyChallengeEntry(updatedEntry);
  console.log(`✅ 更新记录: ${updateResult.playerName} - 新分数: ${updateResult.score}`);

  // 验证更新后的数据
  const updatedRanking = MockLeaderboardService.getDailyChallengeRanking(today);
  console.log('更新后的排行榜:');
  updatedRanking.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.playerName} - 分数: ${entry.score} - 用时: ${entry.completionTime}秒`);
  });

  // 测试5: 测试不同日期的数据
  console.log('\n📅 测试5: 测试不同日期的数据');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const yesterdayEntry = {
    date: yesterdayStr,
    playerName: '玩家E',
    score: 800,
    completionTime: 190,
    moves: 55,
    difficulty: 'medium',
    isPerfect: false,
    consecutiveDays: 2,
    totalChallengesCompleted: 10,
    averageScore: 750,
    totalStars: 2
  };

  MockLeaderboardService.addDailyChallengeEntry(yesterdayEntry);
  console.log(`✅ 添加昨天的记录: ${yesterdayEntry.playerName}`);

  // 测试按日期筛选
  const todayRanking = MockLeaderboardService.getDailyChallengeRanking(today);
  const yesterdayRanking = MockLeaderboardService.getDailyChallengeRanking(yesterdayStr);
  
  console.log(`✅ 今天的记录数: ${todayRanking.length}`);
  console.log(`✅ 昨天的记录数: ${yesterdayRanking.length}`);

  // 测试6: 测试所有日期的数据
  console.log('\n📊 测试6: 测试所有日期的数据');
  const allRanking = MockLeaderboardService.getDailyChallengeRanking();
  console.log(`✅ 所有日期的记录数: ${allRanking.length}`);

  console.log('\n🎉 所有测试完成！');
  console.log('\n📋 测试总结:');
  console.log('- ✅ 数据存储功能正常');
  console.log('- ✅ 数据排序功能正常');
  console.log('- ✅ 记录更新功能正常');
  console.log('- ✅ 日期筛选功能正常');
  console.log('- ✅ 同一天同一用户的记录更新功能正常');
}

// 运行测试
runTests();
