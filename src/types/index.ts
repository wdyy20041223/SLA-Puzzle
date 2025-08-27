// 拼图块数据结构
export interface PuzzlePiece {
  id: string;
  originalIndex: number;
  currentPosition: { x: number; y: number };
  correctPosition: { x: number; y: number };
  rotation: number;
  isFlipped: boolean;
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
}

// 游戏操作
export interface GameMove {
  id: string;
  pieceId: string;
  action: 'move' | 'rotate' | 'flip';
  fromPosition?: { x: number; y: number };
  toPosition?: { x: number; y: number };
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