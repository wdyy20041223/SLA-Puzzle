// 拼图块数据结构
export interface PuzzlePiece {
  id: string;
  originalIndex: number; // 原始编号 (0-8, 0-15, 0-24, 0-35)
  currentSlot: number | null; // 当前所在答题卡槽位，null表示在处理区
  correctSlot: number; // 正确的槽位编号
  rotation: number; // 旋转角度 (0, 90, 180, 270)
  isFlipped: boolean; // 是否翻转
  imageData: string; // base64 或路径
  width: number;
  height: number;
  shape: PieceShape;
}

// 拼图形状类型
export type PieceShape = 'square' | 'triangle' | 'irregular';

// 拼图配置
export interface PuzzleConfig {
  id: string;
  name: string;
  originalImage: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  difficulty: DifficultyLevel;
  pieces: PuzzlePiece[];
  createdAt: Date;
  updatedAt: Date;
}

// 难度等级
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// 游戏状态
export interface GameState {
  config: PuzzleConfig;
  startTime: Date;
  endTime?: Date;
  moves: number;
  isCompleted: boolean;
  elapsedTime: number;
  history: GameMove[];
  answerGrid: (PuzzlePiece | null)[]; // 答题卡网格，存储每个槽位的拼图块
}

// 游戏操作
export interface GameMove {
  id: string;
  pieceId: string;
  action: 'place' | 'remove' | 'rotate' | 'flip' | 'replace';
  fromSlot?: number | null; // 从哪个槽位移动（null表示从处理区）
  toSlot?: number | null; // 移动到哪个槽位（null表示移回处理区）
  replacedPieceId?: string; // 被替换的拼图块ID（仅用于replace操作）
  timestamp: Date;
}

// 素材数据
export interface Asset {
  id: string;
  name: string;
  category: string;
  tags: string[];
  filePath: string;
  thumbnail: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: Date;
}

// 排行榜记录
export interface LeaderboardEntry {
  id: string;
  puzzleId: string;
  playerName: string;
  completionTime: number; // 秒
  moves: number;
  difficulty: DifficultyLevel;
  completedAt: Date;
}

// 编辑器状态
export interface EditorState {
  currentAsset?: Asset;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  previewPieces: PuzzlePiece[];
  isGenerating: boolean;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tauri 命令参数类型
export interface CreatePuzzleParams {
  imagePath: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  name: string;
}

export interface SaveGameParams {
  gameState: GameState;
}

export interface LoadGameParams {
  gameId: string;
}