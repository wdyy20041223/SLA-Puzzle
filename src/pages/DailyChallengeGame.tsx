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
import { GameFailureModal } from '../components/game/GameFailureModal';
import './DailyChallengeGame.css';

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
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  // 检查特效限制
  const isPreviewDisabled = challenge.effects?.includes('no_preview') || challenge.effects?.includes('一叶障目');
  // 最终防线特效现在允许查看答案
  const isAnswerDisabled = false; // 移除原来的限制，允许所有情况下查看答案

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
  
  // 特效实现状态
  const [effectStates, setEffectStates] = useState({
    brightnessPhase: 0, // 璀璨星河特效的亮度相位
    visibleSlots: new Set<number>(), // 管中窥豹特效显示的槽位
    unlockedSlots: new Set<number>(), // 作茧自缚特效解锁的槽位
    cornerOnlyMode: false, // 作茧自缚特效是否只能在角落放置
    hasStepError: false, // 最终防线特效是否已有错误
    actualMoves: 0, // 举步维艰特效的实际步数（显示会翻倍）
  });

  // 检查是否只能在角落放置（作茧自缚特效）
  const isCornerSlot = useCallback((slotIndex: number) => {
    if (!gameState) return false;
    const { rows, cols } = gameState.config.gridSize;
    const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1];
    return corners.includes(slotIndex);
  }, [gameState]);

  // 获取相邻槽位（作茧自缚特效）
  const getAdjacentSlots = useCallback((slotIndex: number) => {
    if (!gameState) return [];
    const { rows, cols } = gameState.config.gridSize;
    const adjacent: number[] = [];
    
    const row = Math.floor(slotIndex / cols);
    const col = slotIndex % cols;
    
    // 上
    if (row > 0) adjacent.push(slotIndex - cols);
    // 下
    if (row < rows - 1) adjacent.push(slotIndex + cols);
    // 左
    if (col > 0) adjacent.push(slotIndex - 1);
    // 右
    if (col < cols - 1) adjacent.push(slotIndex + 1);
    
    return adjacent;
  }, [gameState]);

  // 检查是否可以放置到该槽位（根据特效规则）
  const canPlaceToSlot = useCallback((slotIndex: number) => {
    // 作茧自缚特效：动态解锁机制
    if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
      // 如果还没有放置任何拼图块，只能放在角落
      if (gameState && gameState.answerGrid.every(slot => slot === null)) {
        return isCornerSlot(slotIndex);
      }
      // 否则检查该槽位是否已解锁
      return effectStates.unlockedSlots.has(slotIndex);
    }
    
    // 管中窥豹特效：只能在可见槽位放置
    if (challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')) {
      return effectStates.visibleSlots.has(slotIndex);
    }
    
    return true;
  }, [challenge.effects, gameState, isCornerSlot, effectStates.unlockedSlots, effectStates.visibleSlots]);

  // 获取特效CSS类名
  const getEffectClasses = useCallback(() => {
    const classes: string[] = [];
    
    // 雾里探花特效：模糊未选中的拼图块
    if (challenge.effects?.includes('blur') || challenge.effects?.includes('雾里探花')) {
      classes.push('effect-blur-unselected');
    }
    
    // 一手遮天特效：放置后的拼图块变黑
    if (challenge.effects?.includes('invisible') || challenge.effects?.includes('一手遮天')) {
      classes.push('effect-invisible-placed');
    }
    
    return classes.join(' ');
  }, [challenge.effects]);

  // 获取特效内联样式
  const getEffectStyles = useCallback(() => {
    const styles: React.CSSProperties = {};
    
    // 璀璨星河特效：答题区亮度变化
    if (challenge.effects?.includes('brightness') || challenge.effects?.includes('璀璨星河')) {
      const brightness = 0.7 + 0.3 * Math.sin(effectStates.brightnessPhase); // 0.7到1.0之间变化
      styles.filter = `brightness(${brightness})`;
    }
    
    return styles;
  }, [challenge.effects, effectStates.brightnessPhase]);

  // 计算特效总星数
  const getTotalStars = useCallback(() => {
    if (!challenge.effects) return 0;
    return challenge.effects.reduce((total, effectId) => {
      // 基于特效ID计算星数
      if (effectId.includes('3') || ['rotate', 'blur', 'partial', 'upside_down', 'double_steps', '天旋地转', '雾里探花', '管中窥豹', '颠倒世界', '举步维艰'].includes(effectId)) {
        return total + 3;
      } else if (effectId.includes('4') || ['corner_start', 'invisible', 'no_preview', 'time_limit', '作茧自缚', '一手遮天', '一叶障目', '生死时速'].includes(effectId)) {
        return total + 4;
      } else if (effectId.includes('5') || ['no_mistakes', 'step_limit', 'brightness', '最终防线', '精打细算', '璀璨星河'].includes(effectId)) {
        return total + 5;
      }
      return total;
    }, 0);
  }, [challenge.effects]);

  // 获取特效名称
  const getEffectName = useCallback((effectId: string) => {
    const effectMap: { [key: string]: string } = {
      'rotate': '天旋地转', '天旋地转': '天旋地转',
      'blur': '雾里探花', '雾里探花': '雾里探花',
      'partial': '管中窥豹', '管中窥豹': '管中窥豹',
      'upside_down': '颠倒世界', '颠倒世界': '颠倒世界',
      'double_steps': '举步维艰', '举步维艰': '举步维艰',
      'corner_start': '作茧自缚', '作茧自缚': '作茧自缚',
      'invisible': '一手遮天', '一手遮天': '一手遮天',
      'no_preview': '一叶障目', '一叶障目': '一叶障目',
      'time_limit': '生死时速', '生死时速': '生死时速',
      'no_mistakes': '最终防线', '最终防线': '最终防线',
      'step_limit': '精打细算', '精打细算': '精打细算',
      'brightness': '璀璨星河', '璀璨星河': '璀璨星河'
    };
    return effectMap[effectId] || effectId;
  }, []);

  // 获取特效描述
  const getEffectDescription = useCallback((effectId: string) => {
    const descriptionMap: { [key: string]: string } = {
      'rotate': '本关卡等同于启用翻转模式，拼图块包含旋转与翻转，玩家可通过按键旋转到正确位置', '天旋地转': '本关卡等同于启用翻转模式，拼图块包含旋转与翻转，玩家可通过按键旋转到正确位置',
      'blur': '本关卡拼图块在鼠标选中前模糊化', '雾里探花': '本关卡拼图块在鼠标选中前模糊化',
      'partial': '本关卡答题区最开始只展示一半的拼图块', '管中窥豹': '本关卡答题区最开始只展示一半的拼图块',
      'upside_down': '本关卡中正确答案旋转180°后得到原图', '颠倒世界': '本关卡中正确答案旋转180°后得到原图',
      'double_steps': '每一步统计时算作2步', '举步维艰': '每一步统计时算作2步',
      'corner_start': '本关卡最开始可以放置拼图块的位置只有四个角落，只有正确放置才会解锁相邻槽位', '作茧自缚': '本关卡最开始可以放置拼图块的位置只有四个角落，只有正确放置才会解锁相邻槽位',
      'invisible': '本关卡放置后的拼图块为纯黑色不可见', '一手遮天': '本关卡放置后的拼图块为纯黑色不可见',
      'no_preview': '本关卡不允许查看原图', '一叶障目': '本关卡不允许查看原图',
      'time_limit': '本关卡限时126*(拼图块数量/9)秒', '生死时速': '本关卡限时126*(拼图块数量/9)秒',
      'no_mistakes': '本关卡不允许任何一次放置失误', '最终防线': '本关卡不允许任何一次放置失误',
      'step_limit': '本关卡必须在1.5*拼图块数量次步数内完成', '精打细算': '本关卡必须在1.5*拼图块数量次步数内完成',
      'brightness': '答题区拼图块亮度随时间呈正弦变化', '璀璨星河': '答题区拼图块亮度随时间呈正弦变化'
    };
    return descriptionMap[effectId] || '未知特效';
  }, []);

  // 获取特效星级
  const getEffectStars = useCallback((effectId: string) => {
    if (['rotate', 'blur', 'partial', 'upside_down', 'double_steps', '天旋地转', '雾里探花', '管中窥豹', '颠倒世界', '举步维艰'].includes(effectId)) {
      return 3;
    } else if (['corner_start', 'invisible', 'no_preview', 'time_limit', '作茧自缚', '一手遮天', '一叶障目', '生死时速'].includes(effectId)) {
      return 4;
    } else if (['no_mistakes', 'step_limit', 'brightness', '最终防线', '精打细算', '璀璨星河'].includes(effectId)) {
      return 5;
    }
    return 0;
  }, []);

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
          name: challenge.title,
          upsideDown: challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')
        });
        
        // 应用特效：天旋地转 - 等同于启用翻转模式，拼图块会随机旋转和翻转
        // 玩家需要通过按键旋转到正确位置才能正确放置
        const hasRotateEffect = challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转');
        if (hasRotateEffect) {
          // 重新生成拼图配置，这次启用旋转模式
          const rotatedConfig = await PuzzleGenerator.generatePuzzle({
            imageData: puzzleImageData,
            gridSize: { rows, cols },
            pieceShape: 'square',
            name: challenge.title,
            allowRotation: true, // 启用翻转模式
            upsideDown: challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')
          });
          
          // 使用启用了旋转的配置
          setPuzzleConfig(rotatedConfig);
          setProgress({ correct: 0, total: rotatedConfig.pieces.length, percentage: 0 });
          initializeGame(rotatedConfig);
        } else {
          // 没有天旋地转特效，使用正常配置
          setPuzzleConfig(config);
          setProgress({ correct: 0, total: config.pieces.length, percentage: 0 });
          initializeGame(config);
        }
        
      } else {
        const config = await IrregularPuzzleGenerator.generateSimpleIrregular(
          puzzleImageData,
          challenge.gridSize
        );
        
        setPuzzleConfig(config);
        setProgress({ correct: 0, total: config.pieces.length, percentage: 0 });
      }
      
      // 设置时间限制（生死时速特效）
      const timeLimit = challenge.effects?.includes('time_limit') || challenge.effects?.includes('生死时速') 
        ? (() => {
            const gridParts = challenge.gridSize.split('x');
            const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
            return Math.floor(126 * (totalPieces / 9));
          })()
        : challenge.timeLimit;
        
      setGameStartTime(new Date());
      setIsComplete(false);
      setIsFailed(false);
      setElapsedTime(0);
      setRemainingTime(timeLimit);
      setMoves(0);
      
      // 重置特效状态
      setEffectStates({
        brightnessPhase: 0,
        visibleSlots: new Set(),
        unlockedSlots: new Set(),
        cornerOnlyMode: false,
        hasStepError: false,
        actualMoves: 0,
      });
      
    } catch (err) {
      console.error('生成异形拼图失败:', err);
      setError(err instanceof Error ? err.message : '生成拼图时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [challenge.puzzleImage, challenge.gridSize, challenge.title, challenge.effects, challenge.timeLimit, puzzleType, initializeGame]);

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

  // 独立的特效初始化
  useEffect(() => {
    if (!puzzleConfig || puzzleType !== 'square') return;
    
    const [rows, cols] = challenge.gridSize.split('x').map(Number);
    
    setEffectStates(prev => {
      const newStates = { ...prev };
      
      // 管中窥豹特效：只显示一半的槽位
      if (challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')) {
        const totalSlots = rows * cols;
        const visibleCount = Math.floor(totalSlots / 2);
        const allSlots = Array.from({ length: totalSlots }, (_, i) => i);
        const shuffled = allSlots.sort(() => Math.random() - 0.5);
        newStates.visibleSlots = new Set(shuffled.slice(0, visibleCount));
      } else {
        newStates.visibleSlots = new Set();
      }
      
      // 作茧自缚特效：初始化角落槽位为解锁状态
      if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
        const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1];
        newStates.unlockedSlots = new Set(corners);
      } else {
        newStates.unlockedSlots = new Set();
      }
      
      return newStates;
    });
  }, [puzzleConfig, challenge.effects, challenge.gridSize, puzzleType]);

  // 计时器更新
  useEffect(() => {
    if (isComplete || isFailed) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - gameStartTime.getTime()) / 1000);
      
      // 计算时间限制（生死时速特效）
      const timeLimit = challenge.effects?.includes('time_limit') || challenge.effects?.includes('生死时速') 
        ? (() => {
            const gridParts = challenge.gridSize.split('x');
            const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
            return Math.floor(126 * (totalPieces / 9));
          })()
        : challenge.timeLimit;
        
      const remaining = timeLimit - elapsed;
      
      setElapsedTime(elapsed);
      setRemainingTime(remaining);
      
      // 璀璨星河特效：更新亮度相位
      if (challenge.effects?.includes('brightness') || challenge.effects?.includes('璀璨星河')) {
        setEffectStates(prev => ({
          ...prev,
          brightnessPhase: (elapsed * 0.05) % (2 * Math.PI) // 20秒一个周期
        }));
      }
      
      // 检查时间是否用完
      if (remaining <= 0) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, isComplete, isFailed, challenge.effects, challenge.gridSize, challenge.timeLimit]);

  // 键盘事件监听 - 支持天旋地转特效的按键控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 防止在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          if (selectedPiece) {
            rotatePiece(selectedPiece, 90); // 顺时针旋转90度
          }
          break;
        case 'l':
        case 'L':
          if (selectedPiece) {
            rotatePiece(selectedPiece, -90); // 逆时针旋转90度
          }
          break;
        case 'f':
        case 'F':
          if (selectedPiece) {
            flipPiece(selectedPiece); // 翻转
          }
          break;
        case 'Escape':
          // 取消选择
          if (selectedPiece && handlePieceSelect) {
            handlePieceSelect(null);
          }
          break;
        case 'a':
        case 'A':
          if (!e.ctrlKey && !e.metaKey) {
            setShowAnswer(!showAnswer);
          }
          break;
        case 'p':
        case 'P':
          if (!e.ctrlKey && !e.metaKey && !isPreviewDisabled) {
            setShowPreview(!showPreview);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece, rotatePiece, flipPiece, handlePieceSelect, showAnswer, setShowAnswer, showPreview, setShowPreview, isPreviewDisabled]);

  // 处理拼图完成
  const handlePuzzleComplete = useCallback(() => {
    setIsComplete(true);
    
    // 检查是否在完美步数内完成
    const stepLimit = challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算') 
      ? (() => {
          const gridParts = challenge.gridSize.split('x');
          const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
          return Math.floor(1.5 * totalPieces);
        })()
      : null;
    const actualMoves = challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰') 
      ? effectStates.actualMoves : moves;
    const isPerfect = stepLimit ? actualMoves <= stepLimit : actualMoves <= challenge.perfectMoves;
    
    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(true, isPerfect);
    }
  }, [moves, challenge.perfectMoves, challenge.effects, challenge.gridSize, effectStates.actualMoves, authState]);

  // 特效增强的拼图块放置函数
  const enhancedPlacePieceToSlot = useCallback((pieceId: string, slotIndex: number) => {
    // 检查特效限制（位置限制）
    if (!canPlaceToSlot(slotIndex)) {
      return; // 不能放置在该位置，直接返回
    }
    
    // 最终防线特效：检查拼图块是否放置正确
    if (challenge.effects?.includes('最终防线') || challenge.effects?.includes('no_mistakes')) {
      const piece = gameState?.config.pieces.find(p => p.id === pieceId);
      if (piece) {
        // 检查是否放置在正确的位置且旋转、翻转状态正确
        const isCorrectPlacement = piece.correctSlot === slotIndex && 
                                   piece.rotation === piece.correctRotation && 
                                   piece.isFlipped === (piece.correctIsFlipped || false);
        
        if (!isCorrectPlacement) {
          // 错误放置，立即显示失败弹窗
          if (challenge.effects?.includes('最终防线')) {
            setFailureReason('您放置了一个错误的拼图块！"最终防线"特效不允许任何放置失误。');
            setShowFailureModal(true);
            return;
          } else if (challenge.effects?.includes('no_mistakes')) {
            // 其他no_mistakes特效直接失败
            setEffectStates(prev => ({ ...prev, hasStepError: true }));
            setIsFailed(true);
            if (authState.isAuthenticated && authState.user) {
              updateChallengeRecord(false, false);
            }
            return;
          }
        }
      }
    }
    
    // 执行正常的放置逻辑
    placePieceToSlot(pieceId, slotIndex);
    
    // 作茧自缚特效：只有正确放置才会解锁相邻槽位
    if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
      // 检查拼图块是否被正确放置（位置、旋转、翻转都正确）
      const piece = gameState?.config.pieces.find(p => p.id === pieceId);
      if (piece && 
          piece.correctSlot === slotIndex && 
          piece.rotation === piece.correctRotation && 
          piece.isFlipped === (piece.correctIsFlipped || false)) {
        // 只有完全正确放置时才解锁相邻槽位
        const adjacentSlots = getAdjacentSlots(slotIndex);
        setEffectStates(prev => {
          const newUnlockedSlots = new Set(prev.unlockedSlots);
          adjacentSlots.forEach(slot => newUnlockedSlots.add(slot));
          return { ...prev, unlockedSlots: newUnlockedSlots };
        });
      }
    }
    
    // 更新步数（考虑举步维艰特效）
    if (challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰')) {
      setEffectStates(prev => ({ ...prev, actualMoves: prev.actualMoves + 1 }));
      setMoves(prev => prev + 2); // 显示为2步
    } else {
      setMoves(prev => prev + 1);
    }
    
    // 检查精打细算特效的步数限制
    if (challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算')) {
      const gridParts = challenge.gridSize.split('x');
      const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
      const stepLimit = Math.floor(1.5 * totalPieces);
      const currentActualMoves = challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰') 
        ? effectStates.actualMoves + 1 : moves + 1;
      if (currentActualMoves > stepLimit) {
        setIsFailed(true);
        if (authState.isAuthenticated && authState.user) {
          updateChallengeRecord(false, false);
        }
        return;
      }
    }
    
  }, [placePieceToSlot, canPlaceToSlot, challenge.effects, challenge.gridSize, effectStates.actualMoves, moves, authState, getAdjacentSlots, gameState]);

  // 监听游戏完成状态（仿照普通关卡的完成检测机制）
  useEffect(() => {
    if (gameState?.isCompleted && !isComplete) {
      handlePuzzleComplete();
    }
  }, [gameState?.isCompleted, isComplete, handlePuzzleComplete]);
  
  // 处理时间用完
  const handleTimeUp = useCallback(() => {
    setIsFailed(true);
    
    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(false, false);
    }
  }, [authState]);

  // 处理失败弹窗的再试一次
  const handleTryAgain = useCallback(() => {
    setShowFailureModal(false);
    setFailureReason('');
    // 重新开始挑战
    const canRestart = onRestartChallenge?.();
    if (canRestart) {
      generatePuzzle();
    }
  }, [onRestartChallenge, generatePuzzle]);

  // 处理失败弹窗的返回菜单
  const handleBackToMenuFromFailure = useCallback(() => {
    setShowFailureModal(false);
    setFailureReason('');
    // 标记为失败并返回菜单
    setIsFailed(true);
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(false, false);
    }
    onBackToMenu();
  }, [authState, onBackToMenu]);

  // 处理进度变化
  const handleProgressChange = useCallback((newProgress: { correct: number; total: number; percentage: number }) => {
    setProgress(newProgress);
  }, []);

  // 更新挑战记录
  const updateChallengeRecord = async (completed: boolean, _isPerfect: boolean) => {
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
      
      // 计算每日挑战得分 - 新评分公式：(0.1*星星总数+1)*(60/用时)*(1.2*拼图块数/步数)*100
      const calculateDailyChallengeScore = (
        completed: boolean,
        _isPerfect: boolean,
        timeUsed: number,
        moves: number,
        starCount: number, // 挑战星数
        puzzlePieces: number // 拼图块总数
      ): number => {
        if (!completed) return 0;

        // 星数加成：(0.1 * 星星总数 + 1)
        const starBonus = 0.1 * starCount + 1;
        
        // 时间效率：60 / 用时（秒）
        const timeEfficiency = 60 / Math.max(timeUsed, 1);
        
        // 步数效率：1.2 * 拼图块数 / 步数
        const moveEfficiency = (1.2 * puzzlePieces) / Math.max(moves, 1);
        
        // 最终得分
        const finalScore = starBonus * timeEfficiency * moveEfficiency * 100;

        return Math.round(Math.max(0, finalScore));
      };

      // 计算拼图块总数
      const getPuzzlePieces = (gridSize: string): number => {
        const [rows, cols] = gridSize.split('x').map(Number);
        return rows * cols;
      };

      // 计算挑战星数
      const challengeStars = challenge.effects?.reduce((total, effectId) => {
        // 基于特效ID计算星数
        if (effectId.includes('3') || ['rotate', 'blur', 'partial', 'upside_down', 'double_steps', '天旋地转', '雾里探花', '管中窥豹', '颠倒世界', '举步维艰'].includes(effectId)) {
          return total + 3;
        } else if (effectId.includes('4') || ['corner_start', 'invisible', 'no_preview', 'time_limit', '作茧自缚', '一手遮天', '一叶障目', '生死时速'].includes(effectId)) {
          return total + 4;
        } else if (effectId.includes('5') || ['no_mistakes', 'step_limit', 'brightness', '最终防线', '精打细算', '璀璨星河'].includes(effectId)) {
          return total + 5;
        }
        return total;
      }, 0) || 0;

      const puzzlePieces = getPuzzlePieces(challenge.gridSize);
      const score = calculateDailyChallengeScore(
        completed,
        isPerfect,
        elapsedTime,
        moves,
        challengeStars,
        puzzlePieces
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
          averageScore: averageScore,
          totalStars: challengeStars // 使用计算出的星数字段
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
              <div className="text-lg font-semibold text-gray-700">{progress.correct}/{progress.total}</div>
              <div className="text-xs text-gray-500">正确块数</div>
            </div>
            <div className={`text-center ${challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰') ? 'double-steps-indicator' : ''}`}>
              <div className="text-lg font-semibold text-gray-700">{moves}</div>
              <div className="text-xs text-gray-500">
                {challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰') ? '显示步数' : '当前步数'}
              </div>
            </div>
          </div>

          {/* 右侧：游戏操作 */}
          <div className="flex items-center space-x-3">
            {/* 显示当前激活的特效 */}
            {true && ( // 总是显示特效信息，方便测试
              <div className="text-center">
                <div className="text-sm font-semibold text-purple-600">
                  {challenge.effects?.length || 0}个特效
                </div>
                <div className="text-xs text-gray-500">
                  {getTotalStars()}星加成
                </div>
              </div>
            )}
            
            {/* 步数限制提示（精打细算特效） */}
            {(challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算')) && (
              (() => {
                const gridParts = challenge.gridSize.split('x');
                const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
                const stepLimit = Math.floor(1.5 * totalPieces);
                const currentMoves = challenge.effects?.includes('double_steps') || challenge.effects?.includes('举步维艰') ? effectStates.actualMoves : moves;
                return (
                  <div className={`text-center ${currentMoves > stepLimit * 0.8 ? 'step-limit-warning' : ''}`}>
                    <div className="text-sm font-semibold text-orange-600">
                      {stepLimit - currentMoves}
                    </div>
                    <div className="text-xs text-gray-500">剩余步数</div>
                  </div>
                );
              })()
            )}
            
            <Button 
              onClick={() => setShowPreview(!showPreview)}
              variant="secondary" 
              size="small"
              disabled={isPreviewDisabled}
            >
              {isPreviewDisabled ? '🚫 原图' : (showPreview ? '🙈 隐藏原图' : '🖼️ 查看原图')}
            </Button>
            <Button 
              onClick={() => setShowAnswer(!showAnswer)}
              variant="secondary" 
              size="small"
              disabled={isAnswerDisabled}
            >
              {isAnswerDisabled ? '🚫 答案' : (showAnswer ? '🙈 隐藏答案' : '💡 显示答案')}
            </Button>
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
        {/* 特效提示信息 */}
        {true && ( // 总是显示特效信息，方便测试
          <div className="mb-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center">
              ✨ 当前特效
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {challenge.effects && challenge.effects.length > 0 ? (
                challenge.effects.map((effectId, index) => {
                  const effectName = getEffectName(effectId);
                  const effectDescription = getEffectDescription(effectId);
                  const effectStars = getEffectStars(effectId);
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="font-semibold text-purple-700 flex items-center justify-between">
                        <span>{effectName}</span>
                        <span className="text-yellow-500">{'★'.repeat(effectStars)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{effectDescription}</div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="font-semibold text-purple-700 flex items-center justify-between">
                    <span>无特效</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">本关卡没有任何特效</div>
                </div>
              )}
            </div>
            {/* 颠倒世界特效提示 */}
            {(challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')) && (
              <div className="upside-down-effect-hint">
                🔄 颠倒世界：原图已被旋转180°，拼图区域和答题区都是颠倒的
              </div>
            )}
            {/* 天旋地转特效提示 */}
            {(challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转')) && (
              <div className="rotate-effect-hint">
                🎮 天旋地转：拼图块已随机旋转翻转，请使用R键旋转、F键翻转调整到正确位置！
              </div>
            )}
          </div>
        )}

        {/* 预览和答案显示区域 */}
        {(showPreview || showAnswer) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {showPreview && !isPreviewDisabled && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  🖼️ 原图预览
                </h3>
                <div className="flex justify-center">
                  <img 
                    src={challenge.puzzleImage} 
                    alt="原图预览" 
                    className="max-w-full max-h-60 rounded-lg shadow-sm"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
            
            {showAnswer && !isAnswerDisabled && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  💡 答案提示
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💎 完美步数目标：</strong> {challenge.perfectMoves} 步
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>🎯 解题建议：</strong> 
                      {challenge.gridSize === '3x3' && '先完成四个角落，然后填充边缘，最后完成中心区域。'}
                      {challenge.gridSize === '4x4' && '从外向内逐层完成，优先放置边角特征明显的拼图块。'}
                      {challenge.gridSize === '5x5' && '分区域完成，先识别特征明显的区域作为起点。'}
                      {challenge.gridSize === '6x6' && '采用分块策略，将整个拼图分为几个区域分别完成。'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>⏱️ 时间管理：</strong> 剩余时间 {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}，
                      建议每块用时不超过 {Math.floor(remainingTime / (stats.totalPieces - progress.correct))} 秒
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          className={`bg-white rounded-lg shadow-lg overflow-hidden ${getEffectClasses()}`}
          style={{ 
            width: '1200px', 
            height: '650px',
            margin: '0 auto',
            ...getEffectStyles()
          }}
        >
          {puzzleType === 'square' && gameState ? (
            <PuzzleWorkspace
              gameState={gameState}
              selectedPiece={selectedPiece}
              showAnswers={showAnswer && !isAnswerDisabled}
              onPieceSelect={handlePieceSelect}
              onPlacePiece={enhancedPlacePieceToSlot}
              onRemovePiece={removePieceFromSlot}
              onRotatePiece={(id) => rotatePiece(id, 90)}
              onFlipPiece={flipPiece}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              unlockedSlots={effectStates.unlockedSlots}
              hasCornerEffect={challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')}
              hasUpsideDownEffect={challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')}
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
        
        {/* 操作提示 */}
        <div className="game-tips-area mt-4">
          <div className="game-tips bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 font-semibold">💡 操作提示：</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <div>• 点击选择拼图块，再点击答题卡槽位放置</div>
              <div>• A键切换答案显示 | P键切换原图预览</div>
              {(challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转')) && (
                <>
                  <div className="text-orange-600 font-medium">• R键顺时针旋转 | L键逆时针旋转</div>
                  <div className="text-orange-600 font-medium">• F键翻转 | ESC键取消选择</div>
                </>
              )}
            </div>
          </div>
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

      {/* 失败弹窗 */}
      <GameFailureModal
        isVisible={showFailureModal}
        onTryAgain={handleTryAgain}
        onBackToMenu={handleBackToMenuFromFailure}
        failureReason={failureReason}
      />
    </div>
  );
};