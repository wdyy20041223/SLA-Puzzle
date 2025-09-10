import React, { useState, useCallback, useEffect } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzleGenerator } from '../utils/puzzleGenerator/irregular';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import { PuzzleConfig } from '../types';
import { IrregularPuzzleWorkspace } from '../components/game/IrregularPuzzleWorkspace';
import { PuzzleWorkspace } from '../components/game/PuzzleWorkspace';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { Timer } from '../components/common/Timer';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorage } from '../services/cloudStorage';
import { LeaderboardService } from '../services/leaderboardService';
import { Challenge } from './DailyChallenge';

interface DailyChallengeGameProps {
  onBackToMenu: () => void;
  challenge: Challenge;
  puzzleType: 'square' | 'irregular';
  onRestartChallenge?: () => boolean;
}

export const DailyChallengeGame: React.FC<DailyChallengeGameProps> = ({
  onBackToMenu,
  challenge,
  puzzleType,
  onRestartChallenge
}) => {
  const { authState } = useAuth();
  const [puzzleConfig, setPuzzleConfig] = useState<IrregularPuzzleConfig | PuzzleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [progress, setProgress] = useState({ correct: 0, total: 0, percentage: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(challenge.timeLimit);
  const [moves, setMoves] = useState(0);

  // 使用usePuzzleGame钩子管理方形拼图状态
  const { 
    gameState,
    selectedPiece,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    rotatePiece,
    flipPiece,
    handlePieceSelect,
    handleDragStart,
    handleDragEnd,
    handleDragOver
  } = usePuzzleGame();

  // 生成拼图配置
  const generatePuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用挑战提供的图像
      const puzzleImageData = challenge.puzzleImage;
      
      if (puzzleType === 'square') {
        // 解析gridSize，例如从'3x3'转换为{rows: 3, cols: 3}
        const [rows, cols] = challenge.gridSize.split('x').map(Number);
        
        const config = await PuzzleGenerator.generatePuzzle({
          imageData: puzzleImageData,
          gridSize: { rows, cols },
          pieceShape: 'square',
          name: challenge.title
        });
        
        setPuzzleConfig(config);
        setProgress({ correct: 0, total: config.pieces.length, percentage: 0 });
        initializeGame(config);
      } else {
        const config = await IrregularPuzzleGenerator.generateSimpleIrregular(
          puzzleImageData,
          challenge.gridSize
        );
        
        setPuzzleConfig(config);
        setProgress({ correct: 0, total: config.pieces.length, percentage: 0 });
      }
      setGameStartTime(new Date());
      setIsComplete(false);
      setIsFailed(false);
      setElapsedTime(0);
      setRemainingTime(challenge.timeLimit);
      setMoves(0);
      
    } catch (err) {
      console.error('生成异形拼图失败:', err);
      setError(err instanceof Error ? err.message : '生成拼图时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [challenge.puzzleImage, challenge.gridSize, challenge.timeLimit]);

  const handleRestart = () => {
    const canRestart = onRestartChallenge?.();
    if (canRestart) {
      generatePuzzle();
    }
  };

  // 初始化生成拼图
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // 计时器更新
  useEffect(() => {
    if (isComplete || isFailed) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - gameStartTime.getTime()) / 1000);
      const remaining = challenge.timeLimit - elapsed;
      
      setElapsedTime(elapsed);
      setRemainingTime(remaining);
      
      // 检查时间是否用完
      if (remaining <= 0) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, isComplete, isFailed, challenge.timeLimit]);

  // 处理拼图完成
  const handlePuzzleComplete = useCallback(() => {
    setIsComplete(true);
    
    // 检查是否在完美步数内完成
    const isPerfect = moves <= challenge.perfectMoves;
    
    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(true, isPerfect);
    }
  }, [moves, challenge.perfectMoves, authState]);

  // 检查方形拼图是否完成 - 现在由usePuzzleGame钩子管理
  const checkSquarePuzzleCompletion = useCallback(() => {
    // 此函数已不再需要，因为完成检测逻辑已集成到usePuzzleGame钩子中
    if (puzzleType === 'square' && gameState?.isCompleted) {
      handlePuzzleComplete();
    }
  }, [puzzleType, gameState?.isCompleted, handlePuzzleComplete]);
  
  // 处理时间用完
  const handleTimeUp = useCallback(() => {
    setIsFailed(true);
    
    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(false, false);
    }
  }, [authState]);

  // 处理进度变化
  const handleProgressChange = useCallback((newProgress: { correct: number; total: number; percentage: number }) => {
    setProgress(newProgress);
  }, []);

  // 更新挑战记录
  const updateChallengeRecord = async (completed: boolean, isPerfect: boolean) => {
    try {
      // 获取用户数据
      const usersResponse = await cloudStorage.getUsers();
      
      if (!usersResponse.success || !usersResponse.data) {
        console.error('无法获取用户数据');
        return;
      }

      const users = usersResponse.data;
      const userIndex = users.findIndex((u: any) => u.id === authState.user?.id);
      
      if (userIndex === -1) {
        console.error('找不到当前用户');
        return;
      }

      const user = users[userIndex];
      
      // 确保用户挑战记录存在
      if (!user.challengeHistory) {
        user.challengeHistory = [];
      }
      
      if (!user.dailyStreak) {
        user.dailyStreak = 0;
      }
      
      if (!user.coins) {
        user.coins = 0;
      }
      
      if (!user.experience) {
        user.experience = 0;
      }
      
      if (!user.achievements) {
        user.achievements = [];
      }
      
      // 检查今天是否已经有挑战记录
      const today = new Date().toISOString().split('T')[0];
      const existingRecordIndex = user.challengeHistory.findIndex(
        (record: any) => record.date === today
      );
      
      // 计算每日挑战得分
      const calculateDailyChallengeScore = (
        completed: boolean,
        isPerfect: boolean,
        timeUsed: number,
        moves: number,
        timeLimit: number,
        perfectMoves: number
      ): number => {
        if (!completed) return 0;

        let score = 100; // 基础完成分数

        // 时间奖励 (最多40分)
        const timeRatio = Math.max(0, (timeLimit - timeUsed) / timeLimit);
        score += Math.round(timeRatio * 40);

        // 步数奖励 (最多30分)
        if (moves <= perfectMoves) {
          score += 30; // 完美步数
        } else {
          const movesRatio = Math.max(0, (perfectMoves * 2 - moves) / perfectMoves);
          score += Math.round(movesRatio * 30);
        }

        // 完美奖励 (额外20分)
        if (isPerfect) {
          score += 20;
        }

        // 难度奖励 (最多10分)
        const difficultyBonus = {
          easy: 0,
          medium: 3,
          hard: 6,
          expert: 10
        };
        score += difficultyBonus[challenge.difficulty] || 0;

        return Math.max(0, score);
      };

      const score = calculateDailyChallengeScore(
        completed,
        isPerfect,
        elapsedTime,
        moves,
        challenge.timeLimit,
        challenge.perfectMoves
      );

      // 创建或更新挑战记录
      const challengeRecord = {
        id: challenge.id,
        date: today,
        completed: completed,
        isPerfect: isPerfect,
        time: elapsedTime,
        moves: moves,
        puzzleImage: challenge.puzzleImage,
        gridSize: challenge.gridSize,
        difficulty: challenge.difficulty,
        score: score
      };
      
      if (existingRecordIndex === -1) {
        user.challengeHistory.push(challengeRecord);
      } else {
        user.challengeHistory[existingRecordIndex] = challengeRecord;
      }

      // 更新每日挑战排行榜
      if (completed && authState.user) {
        // 计算连续天数（从用户历史记录中计算）
        const completedDays = user.challengeHistory
          .filter((record: any) => record.completed)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let consecutiveDays = 0;
        const today = new Date();
        for (let i = 0; i < completedDays.length; i++) {
          const recordDate = new Date(completedDays[i].date);
          const daysDiff = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === i) {
            consecutiveDays++;
          } else {
            break;
          }
        }

        // 计算总完成挑战数和平均分数
        const totalChallengesCompleted = completedDays.length;
        const averageScore = completedDays.length > 0 
          ? Math.round(completedDays.reduce((sum: number, record: any) => sum + (record.score || 0), 0) / completedDays.length * 10) / 10
          : 0;

        // 添加到每日挑战排行榜
        LeaderboardService.addDailyChallengeEntry({
          date: today.toISOString().split('T')[0],
          playerName: authState.user.username,
          score: score,
          completionTime: elapsedTime,
          moves: moves,
          difficulty: challenge.difficulty as any,
          isPerfect: isPerfect,
          consecutiveDays: consecutiveDays,
          totalChallengesCompleted: totalChallengesCompleted,
          averageScore: averageScore
        });
      }
      
      // 如果完成，更新连续挑战天数
      if (completed) {
        // 检查上一次完成的日期是否是昨天
        const lastCompletedIndex = user.challengeHistory
          .filter((record: any) => record.completed)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastCompletedIndex) {
          const lastCompletedDate = new Date(lastCompletedIndex.date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          
          if (lastCompletedDate >= yesterday) {
            user.dailyStreak += 1;
          } else {
            user.dailyStreak = 1;
          }
        } else {
          user.dailyStreak = 1;
        }
        
        // 添加金币奖励
        const coinsReward = challenge.rewards.completion.includes('金币') ? 
          parseInt(challenge.rewards.completion.match(/\d+/)?.[0] || '0') : 0;
        user.coins += coinsReward;
        
        // 添加经验奖励
        const expReward = challenge.rewards.speed.includes('经验值') ? 
          parseInt(challenge.rewards.speed.match(/\d+/)?.[0] || '0') : 0;
        user.experience += expReward;
        
        // 如果完美完成，添加完美主义者称号
        if (isPerfect && !user.achievements.includes('完美主义者')) {
          user.achievements.push('完美主义者');
        }
      }
      
      // 保存更新后的用户数据
      users[userIndex] = user;
      await cloudStorage.saveUsers(users);
      
      // 更新本地存储的用户数据
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem('puzzle_current_user', JSON.stringify(userWithoutPassword));
      
    } catch (error) {
      console.error('更新挑战记录失败:', error);
    }
  };

  // 获取挑战统计数据
  const getChallengeStats = () => {
    if (!puzzleConfig) return { difficulty: 'easy', totalPieces: 0 };
    
    return {
      difficulty: challenge.difficulty,
      totalPieces: puzzleConfig.pieces.length
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在生成每日挑战拼图...</div>
          <div className="text-sm text-gray-500 mt-2">请稍候，这可能需要几秒钟</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">生成失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={generatePuzzle} variant="primary">
              重试
            </Button>
            <Button onClick={onBackToMenu} variant="secondary">
              返回每日挑战
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleConfig) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">拼图配置加载中...</div>
        </div>
      </div>
    );
  }

  const stats = getChallengeStats();
  const isPerfect = moves <= challenge.perfectMoves;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 游戏头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：游戏信息 */}
          <div className="flex items-center space-x-6">
            <Button onClick={onBackToMenu} variant="secondary" size="small">
              ← 返回
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">每日挑战：{challenge.title}</h1>
              <div className="text-sm text-gray-500">
                {challenge.gridSize} · {stats.difficulty} · {stats.totalPieces} 块
              </div>
            </div>
          </div>

          {/* 中间：进度信息 */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${remainingTime < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                <Timer time={remainingTime} isRunning={!isComplete && !isFailed} />
              </div>
              <div className="text-xs text-gray-500">剩余时间</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {progress.correct}/{progress.total}
              </div>
              <div className="text-xs text-gray-500">正确块数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">{moves}</div>
              <div className="text-xs text-gray-500">当前步数</div>
            </div>
          </div>

          {/* 右侧：游戏操作 */}
          <div className="flex items-center space-x-3">
            <Button onClick={handleRestart} variant="secondary" size="small">
              🔄 重新开始
            </Button>
            <Button 
              onClick={onBackToMenu} 
              variant="primary" 
              size="small"
              disabled={!isComplete && !isFailed}
            >
              {isComplete ? '🎉 完成' : isFailed ? '❌ 失败' : '⏸️ 暂停'}
            </Button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 游戏主体 */}
      <div className="p-6">
        <div 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ 
            width: '1200px', 
            height: '650px',
            margin: '0 auto'
          }}
        >
          {/* 注意：这里禁用了预览图片功能 */}
          {puzzleType === 'square' && gameState ? (
            <PuzzleWorkspace
              gameState={gameState}
              selectedPiece={selectedPiece}
              showAnswers={false}
              onPieceSelect={handlePieceSelect}
              onPlacePiece={(pieceId: string, slotIndex: number) => {
                placePieceToSlot(pieceId, slotIndex);
                setMoves(prev => prev + 1);
                // 检查是否完成拼图
                checkSquarePuzzleCompletion();
              }}
              onRemovePiece={removePieceFromSlot}
              onRotatePiece={(id) => rotatePiece(id, 90)}
              onFlipPiece={flipPiece}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            />
          ) : (
            <IrregularPuzzleWorkspace
              config={puzzleConfig as IrregularPuzzleConfig}
              onPuzzleComplete={handlePuzzleComplete}
              onProgressChange={handleProgressChange}
              scale={1}
              showDebugInfo={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
            />
          )}
        </div>
      </div>

      {/* 游戏结果模态框 */}
      {(isComplete || isFailed) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            {isComplete ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜完成！</h2>
                <p className="text-gray-600 mb-4">
                  您成功完成了这个 {challenge.gridSize} 异形拼图！
                </p>
                {isPerfect && (
                  <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200">
                    <div className="text-yellow-600 font-semibold">✨ 完美主义者！</div>
                    <div className="text-sm text-gray-600">在 {challenge.perfectMoves} 步内完成拼图</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⏰</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">时间到！</h2>
                <p className="text-gray-600 mb-4">
                  很遗憾，您未能在规定时间内完成拼图。
                </p>
              </>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">用时</div>
                  <div className="text-gray-600">
                    <Timer 
                      time={elapsedTime} 
                      isRunning={false} 
                    />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">拼图块数</div>
                  <div className="text-gray-600">{stats.totalPieces} 块</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">难度等级</div>
                  <div className="text-gray-600 capitalize">{stats.difficulty}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">完成度</div>
                  <div className="text-gray-600">{progress.percentage}%</div>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <div className="text-green-600 font-semibold">🎁 获得奖励</div>
                <div className="text-sm text-gray-600 mt-2">{challenge.rewards.completion}</div>
                <div className="text-sm text-gray-600">{challenge.rewards.speed}</div>
                {isPerfect && (
                  <div className="text-sm text-gray-600">{challenge.rewards.perfect}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={generatePuzzle} variant="secondary" className="flex-1">
                再玩一次
              </Button>
              <Button onClick={onBackToMenu} variant="primary" className="flex-1">
                返回每日挑战
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};