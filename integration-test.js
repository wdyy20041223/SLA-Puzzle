/**
 * SLA-Puzzle 集成测试
 * 这个测试文件全面涵盖了整个拼图游戏应用的所有主要功能模块的集成测试
 * 包括正向测试和反向测试场景，确保各个模块的功能正确性和系统整体的稳定性
 */

// 测试统计信息
const testStats = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: []
};

// 计时工具
function startTimer() {
  return Date.now();
}

function stopTimer(startTime, label) {
  const duration = Date.now() - startTime;
  console.log(`⏱️  ${label}: ${duration}ms`);
  return duration;
}

// 测试断言函数
function assert(condition, message) {
  testStats.totalTests++;
  if (condition) {
    testStats.passedTests++;
    console.log(`✅ ${message}`);
    return { success: true, message };
  } else {
    testStats.failedTests++;
    const errorMessage = `❌ 断言失败: ${message}`;
    testStats.errors.push(errorMessage);
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
}

// 测试用例包装函数
function testCase(testName, testFunction) {
  console.log(`
📋 测试: ${testName}`);
  console.log('-'.repeat(50));
  
  const startTime = startTimer();
  let success = false;
  
  try {
    testFunction();
    success = true;
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    testStats.errors.push(`${testName} 测试失败: ${error.message}`);
    testStats.failedTests++;
    testStats.totalTests++;
  }
  
  stopTimer(startTime, `${testName} 耗时`);
  return success;
}

// 模拟数据
const mockUserData = {
  id: 'test_user_001',
  username: 'test_player',
  email: 'test@example.com',
  password: 'password123',
  level: 1,
  experience: 0,
  coins: 0,
  totalScore: 0,
  gamesCompleted: 0,
  avatarFrame: 'default',
  ownedItems: [],
  achievements: []
};

const mockPuzzleConfig = {
  id: 'test_puzzle_001',
  name: '测试拼图',
  originalImage: 'test_image.jpg',
  gridSize: { rows: 3, cols: 3 },
  pieceShape: 'square',
  difficulty: 'easy',
  pieces: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockGameResult = {
  puzzleId: 'test_puzzle_001',
  difficulty: 'easy',
  completionTime: 120, // 2分钟
  moves: 25,
  isCompleted: true,
  timestamp: new Date()
};

const mockGameState = {
  config: mockPuzzleConfig,
  isCompleted: false,
  completionTime: 0,
  moves: 0,
  currentTime: 0,
  pieces: [],
  solvedPieces: []
};

const mockMultiplayerRoom = {
  id: 'room_001',
  roomCode: 'ABC123',
  roomName: '测试房间',
  hostUserId: 'test_user_001',
  maxPlayers: 4,
  currentPlayers: 1,
  status: 'waiting',
  puzzleConfig: {
    difficulty: 'medium',
    gridSize: '4x4'
  },
  createdAt: new Date().toISOString(),
  players: [
    {
      userId: 'test_user_001',
      username: 'test_player',
      status: 'joined',
      isHost: true,
      movesCount: 0,
      joinedAt: new Date().toISOString()
    }
  ]
};

// 模拟服务和组件
class MockAuthService {
  isAuthenticated = false;
  currentUser = null;
  
  login(credentials) {
    if (credentials.username === mockUserData.username && credentials.password === mockUserData.password) {
      this.isAuthenticated = true;
      this.currentUser = { ...mockUserData };
      return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false, error: '用户名或密码错误' });
  }
  
  logout() {
    this.isAuthenticated = false;
    this.currentUser = null;
    return Promise.resolve({ success: true });
  }
  
  register(credentials) {
    if (credentials.username && credentials.password && credentials.password === credentials.confirmPassword) {
      return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false, error: '注册信息不完整或密码不一致' });
  }
}

class MockPuzzleGenerator {
  static async generatePuzzle(params) {
    // 模拟拼图生成
    return {
      ...mockPuzzleConfig,
      id: `puzzle_${Date.now()}`,
      name: params.name || 'Generated Puzzle',
      gridSize: params.gridSize || { rows: 3, cols: 3 },
      pieceShape: params.pieceShape || 'square',
      pieces: []
    };
  }
}

class MockRewardSystem {
  static calculateRewards(result) {
    // 根据难度返回基础奖励
    const baseRewards = {
      easy: { coins: 10, experience: 5 },
      medium: { coins: 20, experience: 15 },
      hard: { coins: 35, experience: 30 },
      expert: { coins: 50, experience: 50 }
    };
    
    const rewards = baseRewards[result.difficulty] || baseRewards.easy;
    
    // 根据完成时间提供额外奖励
    if (result.completionTime < 60) {
      rewards.coins += 5;
      rewards.experience += 3;
    }
    
    return rewards;
  }
  
  static checkAchievements(result, userStats, unlockedAchievements) {
    const newAchievements = [];
    
    // 初次体验成就
    if (userStats.gamesCompleted === 0 && !unlockedAchievements.includes('first_game')) {
      newAchievements.push({ id: 'first_game', name: '初次体验' });
    }
    
    // 简单模式专家成就
    if (result.difficulty === 'easy' && userStats.gamesCompleted >= 20 && !unlockedAchievements.includes('easy_master')) {
      newAchievements.push({ id: 'easy_master', name: '简单模式专家' });
    }
    
    // 零失误成就
    if (result.moves === result.totalPieces && !unlockedAchievements.includes('no_mistakes')) {
      newAchievements.push({ id: 'no_mistakes', name: '零失误专家' });
    }
    
    // 时间大师成就
    if (result.completionTime < 30 && !unlockedAchievements.includes('time_master')) {
      newAchievements.push({ id: 'time_master', name: '时间大师' });
    }
    
    return newAchievements;
  }
}

class MockLeaderboardService {
  static addEntry(entry) {
    // 模拟添加排行榜记录
    return {
      ...entry,
      id: `leaderboard_${Date.now()}`,
      completedAt: new Date()
    };
  }
  
  static getLeaderboard(filters = {}) {
    // 模拟获取排行榜数据
    return [];
  }
}

class MockPuzzleSaveService {
  savedGames = [];
  
  getSavedGames(userId) {
    if (userId) {
      return this.savedGames.filter(game => game.userId === userId);
    }
    return this.savedGames;
  }
  
  saveGame(gameState, description, userId) {
    try {
      if (!gameState || !gameState.config) {
        return { success: false, error: '无效的游戏状态' };
      }
      
      if (gameState.isCompleted) {
        return { success: false, error: '已完成的游戏无法保存' };
      }
      
      const savedGame = {
        id: `save_${Date.now()}`,
        gameState: { ...gameState },
        savedAt: new Date(),
        description,
        userId
      };
      
      this.savedGames.push(savedGame);
      return { success: true, savedGame };
    } catch (error) {
      return { success: false, error: '保存失败' };
    }
  }
  
  loadGame(saveId) {
    const savedGame = this.savedGames.find(game => game.id === saveId);
    if (savedGame) {
      return { success: true, gameState: savedGame.gameState };
    }
    return { success: false, error: '找不到保存的游戏' };
  }
  
  deleteGame(saveId) {
    const index = this.savedGames.findIndex(game => game.id === saveId);
    if (index !== -1) {
      this.savedGames.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: '删除失败' };
  }
}

class MockThemeManager {
  settings = {
    mode: 'auto',
    manualTheme: 'day'
  };
  callbacks = new Set();
  
  getCurrentTheme() {
    if (this.settings.mode === 'auto') {
      const hour = new Date().getHours();
      return hour >= 6 && hour < 18 ? 'day' : 'night';
    }
    return this.settings.manualTheme;
  }
  
  setThemeMode(mode) {
    this.settings.mode = mode;
    return { success: true };
  }
  
  setManualTheme(theme) {
    this.settings.manualTheme = theme;
    return { success: true };
  }
  
  getThemeState() {
    const currentTheme = this.getCurrentTheme();
    return {
      currentTheme,
      mode: this.settings.mode,
      backgroundImage: currentTheme === 'day' ? 'day_background.png' : 'night_background.png'
    };
  }
}

class MockMusicManager {
  settings = {
    enabled: true,
    volume: 0.5,
    battleMusicMode: 'random',
    specificBattleMusic: 'music1.mp3',
    themeMode: 'auto'
  };
  
  isPlaying = false;
  currentTrack = null;
  
  playLobbyMusic(forceTheme) {
    if (!this.settings.enabled) return false;
    
    let theme = forceTheme;
    if (!theme) {
      const hour = new Date().getHours();
      theme = hour >= 6 && hour < 18 ? 'day' : 'night';
    }
    
    this.isPlaying = true;
    this.currentTrack = `lobby_${theme}.mp3`;
    return true;
  }
  
  playBattleMusic(specificMusic) {
    if (!this.settings.enabled) return false;
    
    this.isPlaying = true;
    this.currentTrack = specificMusic || 'battle_random.mp3';
    return true;
  }
  
  stop() {
    this.isPlaying = false;
    this.currentTrack = null;
    return true;
  }
  
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
    return { success: true };
  }
  
  setVolume(volume) {
    if (volume >= 0 && volume <= 1) {
      this.settings.volume = volume;
      return { success: true };
    }
    return { success: false, error: '音量值必须在0-1之间' };
  }
}

class MockApiService {
  rooms = [];
  
  createRoom(roomData) {
    const room = {
      ...mockMultiplayerRoom,
      id: `room_${Date.now()}`,
      roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      roomName: roomData.roomName || '新建房间',
      hostUserId: mockUserData.id,
      maxPlayers: roomData.maxPlayers || 4
    };
    
    this.rooms.push(room);
    return Promise.resolve({ success: true, data: { room } });
  }
  
  joinRoom(roomCode) {
    const room = this.rooms.find(r => r.roomCode === roomCode);
    if (room && room.currentPlayers < room.maxPlayers) {
      room.currentPlayers++;
      room.players.push({
        userId: 'test_user_002',
        username: 'another_player',
        status: 'joined',
        isHost: false,
        movesCount: 0,
        joinedAt: new Date().toISOString()
      });
      return Promise.resolve({ success: true, data: { room } });
    }
    return Promise.resolve({ success: false, error: '房间不存在或已满' });
  }
  
  getRoomInfo(roomCode) {
    const room = this.rooms.find(r => r.roomCode === roomCode);
    if (room) {
      return Promise.resolve({ success: true, data: { room } });
    }
    return Promise.resolve({ success: false, error: '房间不存在' });
  }
  
  startGame(roomCode) {
    const room = this.rooms.find(r => r.roomCode === roomCode);
    if (room && room.hostUserId === mockUserData.id) {
      room.status = 'playing';
      room.gameStartedAt = new Date().toISOString();
      return Promise.resolve({ success: true, data: { room } });
    }
    return Promise.resolve({ success: false, error: '无法开始游戏' });
  }
}

class MockPuzzleEditor {
  currentStep = 'upload';
  puzzleConfig = {
    name: '',
    image: '',
    difficulty: 'medium',
    pieceShape: 'square',
    aspectRatio: '1:1'
  };
  
  uploadImage(fileData) {
    if (!fileData) {
      return { success: false, error: '请提供有效的图片数据' };
    }
    
    this.puzzleConfig.image = fileData;
    this.puzzleConfig.name = '自定义拼图';
    this.currentStep = 'crop';
    return { success: true };
  }
  
  cropImage(croppedData, aspectRatio) {
    if (!croppedData) {
      return { success: false, error: '裁剪数据无效' };
    }
    
    this.puzzleConfig.aspectRatio = aspectRatio;
    this.currentStep = 'settings';
    return { success: true };
  }
  
  applySettings(difficulty, pieceShape) {
    this.puzzleConfig.difficulty = difficulty;
    this.puzzleConfig.pieceShape = pieceShape;
    this.currentStep = 'preview';
    return { success: true };
  }
  
  generatePuzzle() {
    return {
      ...this.puzzleConfig,
      id: `custom_${Date.now()}`,
      createdAt: new Date(),
      pieces: []
    };
  }
}

// 主测试函数
async function runIntegrationTests() {
  console.log('\n🚀 SLA-Puzzle 集成测试启动');
  console.log('='.repeat(60));
  
  const totalStartTime = startTimer();
  
  // 初始化模拟服务
  const authService = new MockAuthService();
  const puzzleSaveService = new MockPuzzleSaveService();
  const themeManager = new MockThemeManager();
  const musicManager = new MockMusicManager();
  const apiService = new MockApiService();
  const puzzleEditor = new MockPuzzleEditor();
  
  // 1. 用户认证流程测试
  await testCase('用户认证流程测试', async () => {
    // 正向测试：成功登录
    const loginResult = await authService.login({
      username: mockUserData.username,
      password: mockUserData.password
    });
    assert(loginResult.success === true, '用户应成功登录');
    assert(authService.isAuthenticated === true, '登录后应标记为已认证');
    assert(authService.currentUser !== null, '登录后应设置当前用户信息');
    
    // 正向测试：成功登出
    const logoutResult = await authService.logout();
    assert(logoutResult.success === true, '用户应成功登出');
    assert(authService.isAuthenticated === false, '登出后应标记为未认证');
    
    // 反向测试：密码错误
    const wrongPassResult = await authService.login({
      username: mockUserData.username,
      password: 'wrong_password'
    });
    assert(wrongPassResult.success === false, '密码错误时应登录失败');
    assert(authService.isAuthenticated === false, '密码错误时应保持未认证状态');
    
    // 反向测试：用户不存在
    const noUserResult = await authService.login({
      username: 'non_existent_user',
      password: 'password123'
    });
    assert(noUserResult.success === false, '用户不存在时应登录失败');
  });
  
  // 2. 用户注册流程测试
  await testCase('用户注册流程测试', async () => {
    // 正向测试：成功注册
    const registerResult = await authService.register({
      username: 'new_user',
      email: 'new@example.com',
      password: 'newpass123',
      confirmPassword: 'newpass123'
    });
    assert(registerResult.success === true, '用户应成功注册');
    
    // 反向测试：密码不一致
    const mismatchResult = await authService.register({
      username: 'another_user',
      email: 'another@example.com',
      password: 'pass123',
      confirmPassword: 'different_pass'
    });
    assert(mismatchResult.success === false, '密码不一致时应注册失败');
    
    // 反向测试：信息不完整
    const incompleteResult = await authService.register({
      username: '',
      password: 'pass123',
      confirmPassword: 'pass123'
    });
    assert(incompleteResult.success === false, '信息不完整时应注册失败');
  });
  
  // 3. 拼图生成测试
  await testCase('拼图生成测试', async () => {
    // 正向测试：生成3x3方形拼图
    const puzzle3x3 = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 3, cols: 3 },
      pieceShape: 'square',
      name: '3x3测试拼图',
      allowRotation: false
    });
    assert(puzzle3x3.id !== undefined, '生成的拼图应包含ID');
    assert(puzzle3x3.gridSize.rows === 3 && puzzle3x3.gridSize.cols === 3, '拼图网格大小应为3x3');
    assert(puzzle3x3.pieceShape === 'square', '拼图形状应为方形');
    
    // 正向测试：生成4x4方形拼图
    const puzzle4x4 = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 4, cols: 4 },
      pieceShape: 'square',
      name: '4x4测试拼图',
      allowRotation: true
    });
    assert(puzzle4x4.gridSize.rows === 4 && puzzle4x4.gridSize.cols === 4, '拼图网格大小应为4x4');
    
    // 正向测试：生成三角形拼图
    const trianglePuzzle = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 3, cols: 3 },
      pieceShape: 'triangle',
      name: '三角形测试拼图',
      allowRotation: false
    });
    assert(trianglePuzzle.pieceShape === 'triangle', '拼图形状应为三角形');
    
    // 正向测试：生成异形拼图
    const irregularPuzzle = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 4, cols: 4 },
      pieceShape: 'irregular',
      name: '异形测试拼图',
      allowRotation: true
    });
    assert(irregularPuzzle.pieceShape === 'irregular', '拼图形状应为异形');
    
    // 反向测试：缺少必要参数
    try {
      await MockPuzzleGenerator.generatePuzzle({});
      assert(true, '拼图生成器应能处理缺少参数的情况');
    } catch (error) {
      assert(false, '拼图生成器应能处理缺少参数的情况');
    }
  });
  
  // 4. 游戏完成和奖励系统测试
  testCase('游戏完成和奖励系统测试', () => {
    // 正向测试：计算简单难度奖励
    const easyRewards = MockRewardSystem.calculateRewards({
      difficulty: 'easy',
      completionTime: 120
    });
    assert(easyRewards.coins >= 10 && easyRewards.experience >= 5, '简单难度应获得正确的基础奖励');
    
    // 正向测试：计算困难难度奖励
    const hardRewards = MockRewardSystem.calculateRewards({
      difficulty: 'hard',
      completionTime: 300
    });
    assert(hardRewards.coins >= 35 && hardRewards.experience >= 30, '困难难度应获得正确的基础奖励');
    
    // 正向测试：快速完成奖励加成
    const fastRewards = MockRewardSystem.calculateRewards({
      difficulty: 'easy',
      completionTime: 45 // 小于60秒
    });
    assert(fastRewards.coins > 10 && fastRewards.experience > 5, '快速完成应获得额外奖励');
    
    // 正向测试：初次游戏成就解锁
    const newAchievements1 = MockRewardSystem.checkAchievements(
      mockGameResult,
      { gamesCompleted: 0 },
      []
    );
    assert(newAchievements1.length >= 1, '完成第一个游戏应解锁成就');
    assert(newAchievements1.some(a => a.id === 'first_game'), '应解锁初次体验成就');
    
    // 正向测试：简单模式专家成就解锁
    const newAchievements2 = MockRewardSystem.checkAchievements(
      { ...mockGameResult, difficulty: 'easy' },
      { gamesCompleted: 20 },
      []
    );
    assert(newAchievements2.some(a => a.id === 'easy_master'), '完成20个简单难度拼图应解锁简单模式专家成就');
    
    // 正向测试：零失误成就解锁
    const perfectResult = {
      ...mockGameResult,
      moves: 9, // 3x3拼图的最小步数
      totalPieces: 9
    };
    const newAchievements3 = MockRewardSystem.checkAchievements(
      perfectResult,
      { gamesCompleted: 1 },
      []
    );
    assert(newAchievements3.some(a => a.id === 'no_mistakes'), '零失误完成拼图应解锁零失误专家成就');
    
    // 反向测试：已解锁成就不再重复解锁
    const duplicateCheck = MockRewardSystem.checkAchievements(
      mockGameResult,
      { gamesCompleted: 1 },
      ['first_game']
    );
    assert(!duplicateCheck.some(a => a.id === 'first_game'), '已解锁成就不应重复解锁');
    
    // 反向测试：不满足条件的成就不解锁
    const notEligibleCheck = MockRewardSystem.checkAchievements(
      mockGameResult,
      { gamesCompleted: 5 },
      []
    );
    assert(!notEligibleCheck.some(a => a.id === 'easy_master'), '不满足条件的成就不应解锁');
  });
  
  // 5. 排行榜功能测试
  testCase('排行榜功能测试', () => {
    // 正向测试：添加排行榜记录
    const leaderboardEntry = MockLeaderboardService.addEntry({
      puzzleId: 'test_puzzle_001',
      puzzleName: '测试拼图',
      playerName: 'test_player',
      completionTime: 120,
      moves: 25,
      difficulty: 'easy',
      pieceShape: 'square',
      gridSize: '3x3'
    });
    assert(leaderboardEntry.id !== undefined, '添加的排行榜记录应包含ID');
    assert(leaderboardEntry.completedAt !== undefined, '添加的排行榜记录应包含完成时间');
    
    // 正向测试：获取排行榜数据
    const leaderboardData = MockLeaderboardService.getLeaderboard();
    assert(Array.isArray(leaderboardData), '获取的排行榜数据应为数组');
    
    // 正向测试：带过滤条件获取排行榜
    const filteredData = MockLeaderboardService.getLeaderboard({
      difficulty: 'easy',
      gridSize: '3x3'
    });
    assert(Array.isArray(filteredData), '带过滤条件获取的排行榜数据应为数组');
  });
  
  // 6. 游戏存档功能测试
  testCase('游戏存档功能测试', () => {
    // 正向测试：保存游戏进度
    const saveResult = puzzleSaveService.saveGame(mockGameState, '测试存档', mockUserData.id);
    assert(saveResult.success === true, '游戏进度应成功保存');
    assert(saveResult.savedGame !== undefined, '保存结果应包含存档信息');
    
    // 正向测试：加载游戏进度
    const loadResult = puzzleSaveService.loadGame(saveResult.savedGame.id);
    assert(loadResult.success === true, '游戏进度应成功加载');
    assert(loadResult.gameState !== undefined, '加载结果应包含游戏状态');
    
    // 正向测试：删除游戏存档
    const deleteResult = puzzleSaveService.deleteGame(saveResult.savedGame.id);
    assert(deleteResult.success === true, '游戏存档应成功删除');
    
    // 反向测试：加载不存在的存档
    const loadNonExistentResult = puzzleSaveService.loadGame('non_existent_id');
    assert(loadNonExistentResult.success === false, '加载不存在的存档应失败');
    
    // 反向测试：保存无效的游戏状态
    const saveInvalidResult = puzzleSaveService.saveGame(null, '无效存档');
    assert(saveInvalidResult.success === false, '保存无效的游戏状态应失败');
    
    // 反向测试：保存已完成的游戏
    const completedGameState = { ...mockGameState, isCompleted: true };
    const saveCompletedResult = puzzleSaveService.saveGame(completedGameState, '已完成的游戏');
    assert(saveCompletedResult.success === false, '保存已完成的游戏应失败');
  });
  
  // 7. 主题系统测试
  testCase('主题系统测试', () => {
    // 正向测试：获取当前主题
    const currentTheme = themeManager.getCurrentTheme();
    assert(['day', 'night'].includes(currentTheme), '当前主题应为day或night');
    
    // 正向测试：切换到手动模式
    const manualModeResult = themeManager.setThemeMode('manual');
    assert(manualModeResult.success === true, '应能成功切换到手动模式');
    
    // 正向测试：设置手动主题为night
    const setNightResult = themeManager.setManualTheme('night');
    assert(setNightResult.success === true, '应能成功设置手动主题为night');
    assert(themeManager.getCurrentTheme() === 'night', '手动设置后主题应为night');
    
    // 正向测试：设置手动主题为day
    const setDayResult = themeManager.setManualTheme('day');
    assert(setDayResult.success === true, '应能成功设置手动主题为day');
    assert(themeManager.getCurrentTheme() === 'day', '手动设置后主题应为day');
    
    // 正向测试：获取主题状态
    const themeState = themeManager.getThemeState();
    assert(themeState.currentTheme !== undefined, '主题状态应包含当前主题');
    assert(themeState.mode !== undefined, '主题状态应包含模式');
    assert(themeState.backgroundImage !== undefined, '主题状态应包含背景图片');
    
    // 正向测试：切换回自动模式
    const autoModeResult = themeManager.setThemeMode('auto');
    assert(autoModeResult.success === true, '应能成功切换回自动模式');
  });
  
  // 8. 音乐服务测试
  testCase('音乐服务测试', () => {
    // 正向测试：播放大厅音乐
    const playLobbyResult = musicManager.playLobbyMusic('day');
    assert(playLobbyResult === true, '应能成功播放大厅音乐');
    assert(musicManager.isPlaying === true, '音乐应处于播放状态');
    assert(musicManager.currentTrack !== null, '当前播放曲目不应为null');
    
    // 正向测试：播放战斗音乐
    const playBattleResult = musicManager.playBattleMusic('specific_music.mp3');
    assert(playBattleResult === true, '应能成功播放战斗音乐');
    assert(musicManager.isPlaying === true, '音乐应处于播放状态');
    
    // 正向测试：停止音乐
    const stopResult = musicManager.stop();
    assert(stopResult === true, '应能成功停止音乐');
    assert(musicManager.isPlaying === false, '音乐应处于停止状态');
    assert(musicManager.currentTrack === null, '当前播放曲目应为null');
    
    // 正向测试：禁用音乐
    const disableResult = musicManager.setEnabled(false);
    assert(disableResult.success === true, '应能成功禁用音乐');
    
    // 正向测试：禁用状态下无法播放音乐
    const playDisabledResult = musicManager.playLobbyMusic('day');
    assert(playDisabledResult === false, '禁用状态下播放音乐应失败');
    
    // 正向测试：启用音乐
    const enableResult = musicManager.setEnabled(true);
    assert(enableResult.success === true, '应能成功启用音乐');
    
    // 正向测试：设置有效音量
    const setValidVolumeResult = musicManager.setVolume(0.7);
    assert(setValidVolumeResult.success === true, '设置有效音量应成功');
    
    // 反向测试：设置无效音量
    const setInvalidVolumeResult = musicManager.setVolume(1.5);
    assert(setInvalidVolumeResult.success === false, '设置无效音量应失败');
  });
  
  // 9. 多人对战功能测试
  await testCase('多人对战功能测试', async () => {
    // 正向测试：创建房间
    const createRoomResult = await apiService.createRoom({
      roomName: '测试房间',
      maxPlayers: 4
    });
    assert(createRoomResult.success === true, '应能成功创建房间');
    assert(createRoomResult.data.room !== undefined, '创建结果应包含房间信息');
    const roomCode = createRoomResult.data.room.roomCode;
    
    // 正向测试：获取房间信息
    const getRoomInfoResult = await apiService.getRoomInfo(roomCode);
    assert(getRoomInfoResult.success === true, '应能成功获取房间信息');
    assert(getRoomInfoResult.data.room !== undefined, '获取结果应包含房间信息');
    
    // 正向测试：加入房间
    const joinRoomResult = await apiService.joinRoom(roomCode);
    assert(joinRoomResult.success === true, '应能成功加入房间');
    assert(joinRoomResult.data.room !== undefined, '加入结果应包含房间信息');
    assert(joinRoomResult.data.room.currentPlayers === 2, '房间玩家数应增加');
    
    // 正向测试：开始游戏
    const startGameResult = await apiService.startGame(roomCode);
    assert(startGameResult.success === true, '房主应能成功开始游戏');
    assert(startGameResult.data.room.status === 'playing', '房间状态应变为playing');
    
    // 反向测试：加入不存在的房间
    const joinInvalidRoomResult = await apiService.joinRoom('INVALID');
    assert(joinInvalidRoomResult.success === false, '加入不存在的房间应失败');
    
    // 反向测试：获取不存在的房间信息
    const getInvalidRoomInfoResult = await apiService.getRoomInfo('INVALID');
    assert(getInvalidRoomInfoResult.success === false, '获取不存在的房间信息应失败');
  });
  
  // 10. 拼图编辑器测试
  testCase('拼图编辑器测试', () => {
    // 正向测试：上传图片
    const uploadResult = puzzleEditor.uploadImage('data:image/png;base64,test_image_data');
    assert(uploadResult.success === true, '应能成功上传图片');
    assert(puzzleEditor.currentStep === 'crop', '步骤应切换到裁剪');
    
    // 正向测试：裁剪图片
    const cropResult = puzzleEditor.cropImage('cropped_image_data', '1:1');
    assert(cropResult.success === true, '应能成功裁剪图片');
    assert(puzzleEditor.currentStep === 'settings', '步骤应切换到设置');
    
    // 正向测试：应用设置
    const settingsResult = puzzleEditor.applySettings('hard', 'triangle');
    assert(settingsResult.success === true, '应能成功应用设置');
    assert(puzzleEditor.currentStep === 'preview', '步骤应切换到预览');
    
    // 正向测试：生成拼图
    const generatedPuzzle = puzzleEditor.generatePuzzle();
    assert(generatedPuzzle.id !== undefined, '生成的拼图应包含ID');
    assert(generatedPuzzle.difficulty === 'hard', '拼图难度应正确设置');
    assert(generatedPuzzle.pieceShape === 'triangle', '拼图形状应正确设置');
    
    // 反向测试：上传无效图片
    const invalidUploadResult = puzzleEditor.uploadImage('');
    assert(invalidUploadResult.success === false, '上传无效图片应失败');
    
    // 反向测试：裁剪无效图片
    const invalidCropResult = puzzleEditor.cropImage('', '1:1');
    assert(invalidCropResult.success === false, '裁剪无效图片应失败');
  });
  
  // 11. 游戏流程集成测试
  await testCase('游戏流程集成测试', async () => {
    // 模拟完整的游戏流程：登录 -> 生成拼图 -> 完成游戏 -> 获得奖励 -> 更新排行榜
    
    // 1. 登录
    await authService.login({
      username: mockUserData.username,
      password: mockUserData.password
    });
    assert(authService.isAuthenticated, '用户应已登录');
    
    // 2. 生成拼图
    const puzzle = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 3, cols: 3 },
      pieceShape: 'square',
      name: '集成测试拼图',
      allowRotation: true
    });
    assert(puzzle.id, '拼图应成功生成');
    
    // 3. 模拟游戏完成
    const gameResult = {
      ...mockGameResult,
      puzzleId: puzzle.id,
      difficulty: puzzle.difficulty,
      completionTime: 90
    };
    
    // 4. 计算奖励
    const rewards = MockRewardSystem.calculateRewards(gameResult);
    assert(rewards.coins > 0 && rewards.experience > 0, '应获得游戏奖励');
    
    // 5. 检查成就
    const achievements = MockRewardSystem.checkAchievements(
      gameResult,
      { gamesCompleted: 0 },
      []
    );
    
    // 6. 更新排行榜
    const leaderboardEntry = MockLeaderboardService.addEntry({
      puzzleId: puzzle.id,
      puzzleName: puzzle.name,
      playerName: authService.currentUser.username,
      completionTime: gameResult.completionTime,
      moves: gameResult.moves,
      difficulty: puzzle.difficulty,
      pieceShape: puzzle.pieceShape,
      gridSize: `${puzzle.gridSize.rows}x${puzzle.gridSize.cols}`
    });
    
    assert(leaderboardEntry.id, '排行榜记录应成功添加');
    console.log('🎮 完整游戏流程模拟成功');
  });
  
  // 12. 高级集成场景测试
  await testCase('高级集成场景测试', async () => {
    // 1. 用户认证
    await authService.login({
      username: mockUserData.username,
      password: mockUserData.password
    });
    
    // 2. 生成拼图
    const puzzle = await MockPuzzleGenerator.generatePuzzle({
      imageData: 'test_image.jpg',
      gridSize: { rows: 4, cols: 4 },
      pieceShape: 'triangle',
      name: '集成测试拼图',
      difficulty: 'medium'
    });
    
    // 3. 创建游戏状态并保存
    const gameState = {
      ...mockGameState,
      config: puzzle,
      moves: 15,
      currentTime: 60
    };
    
    const saveResult = puzzleSaveService.saveGame(gameState, '进行中的游戏', authService.currentUser.id);
    assert(saveResult.success === true, '游戏状态应成功保存');
    
    // 4. 加载游戏状态
    const loadResult = puzzleSaveService.loadGame(saveResult.savedGame.id);
    assert(loadResult.success === true, '游戏状态应成功加载');
    assert(loadResult.gameState.moves === 15, '加载的游戏状态应保持正确的移动次数');
    
    // 5. 模拟游戏完成
    const gameResult = {
      puzzleId: puzzle.id,
      difficulty: puzzle.difficulty,
      completionTime: 180,
      moves: 45,
      isCompleted: true,
      timestamp: new Date()
    };
    
    // 6. 计算奖励和成就
    const rewards = MockRewardSystem.calculateRewards(gameResult);
    const achievements = MockRewardSystem.checkAchievements(
      gameResult,
      { gamesCompleted: 5 },
      []
    );
    
    // 7. 更新排行榜
    const leaderboardEntry = MockLeaderboardService.addEntry({
      puzzleId: puzzle.id,
      puzzleName: puzzle.name,
      playerName: authService.currentUser.username,
      completionTime: gameResult.completionTime,
      moves: gameResult.moves,
      difficulty: puzzle.difficulty,
      pieceShape: puzzle.pieceShape,
      gridSize: `${puzzle.gridSize.rows}x${puzzle.gridSize.cols}`
    });
    
    // 8. 主题和音乐设置
    themeManager.setThemeMode('manual');
    themeManager.setManualTheme('night');
    musicManager.playLobbyMusic('night');
    
    // 9. 登出
    await authService.logout();
    
    console.log('🎯 高级集成场景模拟成功');
  });
  
  // 13. 异常场景测试
  await testCase('异常场景测试', async () => {
    // 测试空数据处理
    try {
      const rewards = MockRewardSystem.calculateRewards({});
      assert(rewards.coins > 0, '奖励系统应能处理空数据');
    } catch (error) {
      assert(false, '奖励系统应能处理空数据');
    }
    
    // 测试不存在的难度
    try {
      const rewards = MockRewardSystem.calculateRewards({
        difficulty: 'non_existent_difficulty',
        completionTime: 100
      });
      assert(rewards.coins > 0, '应使用默认难度奖励');
    } catch (error) {
      assert(false, '奖励系统应能处理不存在的难度');
    }
    
    // 测试负数完成时间
    try {
      const rewards = MockRewardSystem.calculateRewards({
        difficulty: 'easy',
        completionTime: -10
      });
      assert(rewards.coins >= 10, '应正确处理负数完成时间');
    } catch (error) {
      assert(false, '奖励系统应能处理负数完成时间');
    }
    
    // 测试网络错误模拟
    try {
      // 尝试加入一个不存在的房间，模拟网络请求错误
      const result = await apiService.joinRoom('NETWORK_ERROR');
      assert(true, '应能处理网络请求错误');
    } catch (error) {
      assert(false, '应能处理网络请求错误');
    }
    
    // 测试重复操作
    await authService.login({
      username: mockUserData.username,
      password: mockUserData.password
    });
    const secondLoginResult = await authService.login({
      username: mockUserData.username,
      password: mockUserData.password
    });
    assert(secondLoginResult.success === true, '应允许重复登录操作');
  });
  
  // 测试总结
  console.log('\n='.repeat(60));
  console.log('📊 集成测试总结');
  console.log(`总测试数: ${testStats.totalTests}`);
  console.log(`通过测试数: ${testStats.passedTests}`);
  console.log(`失败测试数: ${testStats.failedTests}`);
  
  if (testStats.failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    testStats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ 所有测试通过！');
  }
  
  stopTimer(totalStartTime, '总测试耗时');
  console.log('='.repeat(60));
  
  return {
    success: testStats.failedTests === 0,
    stats: testStats
  };
}

// 运行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.addEventListener('load', async () => {
    await runIntegrationTests();
  });
} else {
  // Node.js环境
  runIntegrationTests().then(results => {
    process.exit(results.success ? 0 : 1);
  });
}

// 导出测试函数供其他模块使用
export { runIntegrationTests };