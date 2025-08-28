import { PuzzlePiece, PuzzleConfig, PieceShape, DifficultyLevel } from '../types';

interface GeneratePuzzleParams {
  imageData: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  name: string;
}

export class PuzzleGenerator {
  static async generatePuzzle(params: GeneratePuzzleParams): Promise<PuzzleConfig> {
    const { imageData, gridSize, pieceShape, name } = params;
    
    // 确保图片是正方形，统一处理尺寸
    const targetSize = 400; // 统一的目标尺寸
    
    // 如果imageData是URL路径，则使用该路径作为图片源
    const imageUrl = imageData;
    
    // 生成正方形拼图块
    const pieces: PuzzlePiece[] = [];
    const totalPieces = gridSize.rows * gridSize.cols;
    const pieceSize = targetSize / gridSize.rows; // 每个拼图块的尺寸

    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize.cols);
      const col = i % gridSize.cols;
      
      const piece = await this.generateSquarePiece({
        imageData,
        index: i,
        row,
        col,
        gridSize,
        pieceSize,
        targetSize,
      });
      pieces.push(piece);
    }

    // 打乱拼图块顺序
    const shuffledPieces = this.shufflePieces(pieces);

    const difficulty = this.calculateDifficulty(gridSize, pieceShape);

    return {
      id: `puzzle_${Date.now()}`,
      name,
      originalImage: imageUrl,
      gridSize,
      pieceShape,
      difficulty,
      pieces: shuffledPieces,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private static async generateSquarePiece(params: {
    imageData: string;
    index: number;
    row: number;
    col: number;
    gridSize: { rows: number; cols: number };
    pieceSize: number;
    targetSize: number;
  }): Promise<PuzzlePiece> {
    const { imageData, index, row, col, gridSize, pieceSize, targetSize } = params;

    // 创建canvas来裁剪图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = pieceSize;
    canvas.height = pieceSize;

    // 创建原始图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // 如果是相对路径，确保能正确加载
      img.src = imageData.startsWith('/') ? imageData : imageData;
      // 允许跨域加载（如果需要）
      img.crossOrigin = 'anonymous';
    });

    // 计算源图片的实际尺寸和缩放比例
    const sourceSize = Math.min(img.width, img.height);
    const scale = targetSize / sourceSize;
    const offsetX = (img.width - sourceSize) / 2;
    const offsetY = (img.height - sourceSize) / 2;

    // 裁剪对应区域（从正方形区域中裁剪）
    ctx.drawImage(
      img,
      offsetX + col * (sourceSize / gridSize.cols), // 源x
      offsetY + row * (sourceSize / gridSize.rows), // 源y
      sourceSize / gridSize.cols, // 源宽度
      sourceSize / gridSize.rows, // 源高度
      0, // 目标x
      0, // 目标y
      pieceSize, // 目标宽度
      pieceSize  // 目标高度
    );

    const pieceImageData = canvas.toDataURL('image/png');

    return {
      id: `piece_${index}`,
      originalIndex: index,
      currentSlot: null, // 初始在处理区
      correctSlot: index, // 正确的槽位就是其原始索引
      rotation: 0,
      isFlipped: false,
      imageData: pieceImageData,
      width: pieceSize,
      height: pieceSize,
      shape: 'square',
    };
  }

  // 打乱拼图块顺序
  private static shufflePieces(pieces: PuzzlePiece[]): PuzzlePiece[] {
    const shuffled = [...pieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static calculateDifficulty(
    gridSize: { rows: number; cols: number },
    pieceShape: PieceShape
  ): DifficultyLevel {
    const totalPieces = gridSize.rows * gridSize.cols;
    
    if (totalPieces <= 9) {
      return 'easy';
    } else if (totalPieces <= 16) {
      return 'medium';
    } else if (totalPieces <= 25) {
      return 'hard';
    } else {
      return 'expert';
    }
  }

  static getDifficultyConfig(level: DifficultyLevel) {
    switch (level) {
      case 'easy':
        return { gridSize: { rows: 3, cols: 3 }, pieceShape: 'square' as PieceShape };
      case 'medium':
        return { gridSize: { rows: 4, cols: 4 }, pieceShape: 'square' as PieceShape };
      case 'hard':
        return { gridSize: { rows: 5, cols: 5 }, pieceShape: 'square' as PieceShape };
      case 'expert':
        return { gridSize: { rows: 6, cols: 6 }, pieceShape: 'square' as PieceShape };
    }
  }
}