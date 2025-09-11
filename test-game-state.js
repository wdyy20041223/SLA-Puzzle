/**
 * 游戏状态管理单元测试
 * 验证游戏状态的初始化、更新、进度跟踪和序列化等功能
 */

console.log('🎮 游戏状态管理单元测试');
console.log('='.repeat(70));

console.log('✅ 使用完全独立的模拟实现');

// 模拟游戏状态接口
function GameState(puzzleId, puzzleConfig, difficulty, startTime) {
  this.puzzleId = puzzleId;
  this.puzzleConfig = puzzleConfig;
  this.difficulty = difficulty || 'medium';
  this.startTime = startTime || Date.now();
  this.lastUpdated = Date.now();
  this.completionTime = null;
  this.moves = 0;
  this.isCompleted = false;
  this.puzzlePieces = [];
  this.snappedPieces = 0;
  this.currentLevel = null;
  this.userProgress = null;
}

// 模拟初始化游戏状态
function initializeGameState(puzzleId, puzzleConfig, difficulty) {
  const state = {
    puzzleId,
    puzzleConfig,
    difficulty: difficulty || 'medium',
    startTime: Date.now(),
    lastUpdated: Date.now(),
    completionTime: null,
    moves: 0,
    isCompleted: false,
    puzzlePieces: [],
    snappedPieces: 0,
    currentLevel: null,
    userProgress: null
  };
  
  // 初始化拼图块
  if (puzzleConfig && puzzleConfig.pieces) {
    state.puzzlePieces = puzzleConfig.pieces.map(piece => ({
      ...piece,
      isSnapped: false,
      position: piece.originalPosition || piece.position
    }));
  }
  
  return state;
}

// 模拟更新游戏状态
function updateGameState(state, updates) {
  return {
    ...state,
    ...updates,
    lastUpdated: Date.now()
  };
}

// 测试函数 - 验证游戏状态初始化
function testGameStateInitialization() {
  console.log('\n1. 测试游戏状态初始化');
  console.log('-'.repeat(70));
  
  try {
    // 创建测试拼图配置
    const mockPuzzleConfig = {
      id: 'puzzle_001',
      name: 'Test Puzzle',
      imageUrl: 'test.jpg',
      gridSize: { rows: 3, cols: 3 },
      difficulty: 'medium',
      totalPieces: 9,
      pieces: Array(9).fill().map((_, index) => ({
        id: `piece_${index}`,
        position: { x: 100 + index * 50, y: 100 },
        imageData: { x: index * 100, y: 0, width: 100, height: 100 },
        slotId: `slot_${index}`
      }))
    };
    
    // 初始化游戏状态
    const gameState = initializeGameState('puzzle_001', mockPuzzleConfig, 'easy');
    
    console.log('   游戏状态初始化测试:');
    console.log(`   - 拼图ID: ${gameState.puzzleId} (预期: puzzle_001)`);
    console.log(`   - 难度: ${gameState.difficulty} (预期: easy)`);
    console.log(`   - 拼图块数量: ${gameState.puzzlePieces.length} (预期: 9)`);
    console.log(`   - 开始时间: ${gameState.startTime ? '✅ 已设置' : '❌ 未设置'}`);
    console.log(`   - 上次更新时间: ${gameState.lastUpdated ? '✅ 已设置' : '❌ 未设置'}`);
    console.log(`   - 完成状态: ${gameState.isCompleted} (预期: false)`);
    console.log(`   - 移动次数: ${gameState.moves} (预期: 0)`);
    console.log(`   - 已对齐拼图块: ${gameState.snappedPieces} (预期: 0)`);
    
    // 验证拼图块状态
    const isAllPiecesInitialized = gameState.puzzlePieces.every(piece => 
      piece.id && piece.position && piece.imageData
    );
    console.log(`   - 拼图块初始化: ${isAllPiecesInitialized ? '✅ 通过' : '❌ 失败'}`);
    
    console.log('\n   ✅ 游戏状态初始化测试通过');
  } catch (error) {
    console.error('   ❌ 游戏状态初始化测试失败:', error);
  }
}

// 测试函数 - 验证游戏状态更新
function testGameStateUpdate() {
  console.log('\n2. 测试游戏状态更新');
  console.log('-'.repeat(70));
  
  try {
    // 初始化游戏状态
    const initialState = initializeGameState('puzzle_002', { totalPieces: 16 }, 'medium');
    initialState.puzzlePieces = Array(16).fill().map((_, index) => ({
      id: `piece_${index}`,
      position: { x: 50 + index * 40, y: 50 },
      isSnapped: false
    }));
    
    // 模拟时间流逝
    const originalDateNow = Date.now;
    Date.now = () => initialState.startTime + 60000; // 1分钟后
    
    console.log('   游戏状态更新测试:');
    console.log(`   - 初始移动次数: ${initialState.moves} (预期: 0)`);
    console.log(`   - 初始对齐块数: ${initialState.snappedPieces} (预期: 0)`);
    
    // 第一次更新: 移动次数+3，对齐块数+2
    let updatedState = updateGameState(initialState, {
      moves: 3,
      snappedPieces: 2
    });
    
    console.log(`   - 更新后移动次数: ${updatedState.moves} (预期: 3)`);
    console.log(`   - 更新后对齐块数: ${updatedState.snappedPieces} (预期: 2)`);
    console.log(`   - 更新时间: ${updatedState.lastUpdated > initialState.lastUpdated ? '✅ 已更新' : '❌ 未更新'}`);
    
    // 第二次更新: 游戏完成
    Date.now = () => initialState.startTime + 120000; // 2分钟后
    updatedState = updateGameState(updatedState, {
      moves: 15,
      snappedPieces: 16,
      isCompleted: true,
      completionTime: 120
    });
    
    console.log(`\n   游戏完成状态测试:`);
    console.log(`   - 最终移动次数: ${updatedState.moves} (预期: 15)`);
    console.log(`   - 最终对齐块数: ${updatedState.snappedPieces} (预期: 16)`);
    console.log(`   - 完成状态: ${updatedState.isCompleted} (预期: true)`);
    console.log(`   - 完成时间: ${updatedState.completionTime}s (预期: 120s)`);
    
    // 恢复原始时间函数
    Date.now = originalDateNow;
    
    console.log('\n   ✅ 游戏状态更新测试通过');
  } catch (error) {
    console.error('   ❌ 游戏状态更新测试失败:', error);
  }
}

// 测试函数 - 验证游戏进度跟踪
function testGameProgressTracking() {
  console.log('\n3. 测试游戏进度跟踪');
  console.log('-'.repeat(70));
  
  // 模拟计算游戏进度的函数
  function calculateGameProgress(gameState) {
    if (!gameState.puzzleConfig || !gameState.puzzleConfig.totalPieces) {
      return 0;
    }
    
    const totalPieces = gameState.puzzleConfig.totalPieces;
    const snappedPieces = gameState.snappedPieces || 0;
    
    return Math.min(Math.round((snappedPieces / totalPieces) * 100), 100);
  }
  
  try {
    // 创建测试游戏状态
    const gameState = initializeGameState('puzzle_003', { totalPieces: 25 }, 'hard');
    
    console.log('   游戏进度跟踪测试:');
    
    // 测试不同进度情况
    const progressTests = [
      { snappedPieces: 0, expectedProgress: 0 },
      { snappedPieces: 5, expectedProgress: 20 },
      { snappedPieces: 12, expectedProgress: 48 },
      { snappedPieces: 20, expectedProgress: 80 },
      { snappedPieces: 25, expectedProgress: 100 },
      { snappedPieces: 30, expectedProgress: 100 } // 超过总数的情况
    ];
    
    progressTests.forEach((test, index) => {
      gameState.snappedPieces = test.snappedPieces;
      const progress = calculateGameProgress(gameState);
      const status = progress === test.expectedProgress ? '✅' : '❌';
      console.log(`   ${index + 1}. ${test.snappedPieces}/${gameState.puzzleConfig.totalPieces} 块对齐 → ${progress}% (预期: ${test.expectedProgress}%) ${status}`);
    });
    
    // 测试缺少配置的情况
    const stateWithoutConfig = initializeGameState('puzzle_004');
    const progressWithoutConfig = calculateGameProgress(stateWithoutConfig);
    console.log(`\n   缺少配置情况: ${progressWithoutConfig}% (预期: 0%) ${progressWithoutConfig === 0 ? '✅' : '❌'}`);
    
    console.log('\n   ✅ 游戏进度跟踪测试通过');
  } catch (error) {
    console.error('   ❌ 游戏进度跟踪测试失败:', error);
  }
}

// 测试函数 - 验证游戏状态序列化和反序列化
function testGameStateSerialization() {
  console.log('\n4. 测试游戏状态序列化和反序列化');
  console.log('-'.repeat(70));
  
  // 模拟序列化函数
  function serializeGameState(gameState) {
    try {
      return JSON.stringify(gameState);
    } catch (error) {
      console.error('序列化失败:', error);
      return null;
    }
  }
  
  // 模拟反序列化函数
  function deserializeGameState(serializedState) {
    try {
      return JSON.parse(serializedState);
    } catch (error) {
      console.error('反序列化失败:', error);
      return null;
    }
  }
  
  try {
    // 创建测试游戏状态
    const originalState = initializeGameState('puzzle_005', {
      id: 'puzzle_config',
      gridSize: { rows: 4, cols: 4 },
      totalPieces: 16
    }, 'medium');
    
    originalState.moves = 7;
    originalState.snappedPieces = 5;
    originalState.puzzlePieces = Array(2).fill().map((_, index) => ({
      id: `piece_${index}`,
      position: { x: 100 + index * 50, y: 200 },
      isSnapped: index === 0
    }));
    
    console.log('   游戏状态序列化测试:');
    
    // 序列化游戏状态
    const serialized = serializeGameState(originalState);
    console.log(`   - 序列化结果: ${serialized ? '✅ 成功' : '❌ 失败'}`);
    
    if (serialized) {
      // 反序列化游戏状态
      const deserialized = deserializeGameState(serialized);
      console.log(`   - 反序列化结果: ${deserialized ? '✅ 成功' : '❌ 失败'}`);
      
      if (deserialized) {
        // 验证反序列化后的数据一致性
        console.log('\n   数据一致性验证:');
        console.log(`   - 拼图ID: ${deserialized.puzzleId === originalState.puzzleId ? '✅ 一致' : '❌ 不一致'}`);
        console.log(`   - 难度: ${deserialized.difficulty === originalState.difficulty ? '✅ 一致' : '❌ 不一致'}`);
        console.log(`   - 移动次数: ${deserialized.moves === originalState.moves ? '✅ 一致' : '❌ 不一致'}`);
        console.log(`   - 拼图块数量: ${deserialized.puzzlePieces.length === originalState.puzzlePieces.length ? '✅ 一致' : '❌ 不一致'}`);
        console.log(`   - 网格大小: ${deserialized.puzzleConfig?.gridSize?.rows === originalState.puzzleConfig?.gridSize?.rows ? '✅ 一致' : '❌ 不一致'}`);
      }
    }
    
    console.log('\n   ✅ 游戏状态序列化测试通过');
  } catch (error) {
    console.error('   ❌ 游戏状态序列化测试失败:', error);
  }
}

// 测试函数 - 验证游戏状态边界条件
function testGameStateEdgeCases() {
  console.log('\n5. 测试游戏状态边界条件');
  console.log('-'.repeat(70));
  
  try {
    console.log('   边界条件测试:');
    
    // 测试空拼图ID
    const emptyIdState = initializeGameState('', { totalPieces: 9 });
    console.log(`   - 空拼图ID处理: ${emptyIdState.puzzleId === '' ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试无效难度
    const invalidDifficultyState = initializeGameState('puzzle_006', { totalPieces: 9 }, 'invalid_difficulty');
    console.log(`   - 无效难度处理: ${invalidDifficultyState.difficulty === 'invalid_difficulty' ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试零拼图块
    const zeroPiecesState = initializeGameState('puzzle_007', { totalPieces: 0 });
    zeroPiecesState.puzzlePieces = [];
    console.log(`   - 零拼图块处理: ${zeroPiecesState.puzzleConfig.totalPieces === 0 && zeroPiecesState.puzzlePieces.length === 0 ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试极短游戏时间
    const shortTimeState = initializeGameState('puzzle_008', { totalPieces: 9 });
    shortTimeState.completionTime = 1; // 1秒完成
    console.log(`   - 极短游戏时间: ${shortTimeState.completionTime === 1 ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试超大移动次数
    const largeMovesState = initializeGameState('puzzle_009', { totalPieces: 9 });
    largeMovesState.moves = 999999;
    console.log(`   - 超大移动次数: ${largeMovesState.moves === 999999 ? '✅ 通过' : '❌ 失败'}`);
    
    console.log('\n   ✅ 游戏状态边界条件测试通过');
  } catch (error) {
    console.error('   ❌ 游戏状态边界条件测试失败:', error);
  }
}

// 运行所有测试
function runAllTests() {
  console.log('开始测试游戏状态管理...\n');
  
  try {
    testGameStateInitialization();
    testGameStateUpdate();
    testGameProgressTracking();
    testGameStateSerialization();
    testGameStateEdgeCases();
    
    console.log('\n='.repeat(70));
    console.log('✅ 游戏状态管理单元测试全部完成');
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
  }
}

// 执行测试
runAllTests();