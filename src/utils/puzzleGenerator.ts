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
    
    // 对于SVG，使用固定尺寸，对于图片则动态获取
    let imageWidth = 400;
    let imageHeight = 400;
    
    if (!imageData.includes('svg')) {
      // 创建图片元素来获取原始尺寸
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });
      imageWidth = img.width;
      imageHeight = img.height;
    }
    
    const pieceWidth = imageWidth / gridSize.cols;
    const pieceHeight = imageHeight / gridSize.rows;

    // 生成拼图块
    const pieces: PuzzlePiece[] = [];
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const piece = await this.generatePiece({
          imageData,
          row,
          col,
          gridSize,
          pieceWidth,
          pieceHeight,
          pieceShape,
          imageWidth,
          imageHeight,
        });
        pieces.push(piece);
      }
    }

    const difficulty = this.calculateDifficulty(gridSize, pieceShape);

    return {
      id: `puzzle_${Date.now()}`,
      name,
      originalImage: imageData,
      gridSize,
      pieceShape,
      difficulty,
      pieces,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private static async generatePiece(params: {
    imageData: string;
    row: number;
    col: number;
    gridSize: { rows: number; cols: number };
    pieceWidth: number;
    pieceHeight: number;
    pieceShape: PieceShape;
    imageWidth: number;
    imageHeight: number;
  }): Promise<PuzzlePiece> {
    const {
      imageData,
      row,
      col,
      gridSize,
      pieceWidth,
      pieceHeight,
      pieceShape,
      imageWidth,
      imageHeight,
    } = params;

    // 创建canvas来裁剪图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = pieceWidth;
    canvas.height = pieceHeight;

    // 创建原始图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // 裁剪对应区域
    ctx.drawImage(
      img,
      col * pieceWidth,
      row * pieceHeight,
      pieceWidth,
      pieceHeight,
      0,
      0,
      pieceWidth,
      pieceHeight
    );

    // 如果是异形拼图，添加形状遮罩
    if (pieceShape === 'triangle' || pieceShape === 'irregular') {
      this.applyShapeMask(ctx, pieceWidth, pieceHeight, pieceShape, row, col, gridSize);
    }

    const pieceImageData = canvas.toDataURL('image/png');

    return {
      id: `piece_${row}_${col}`,
      originalIndex: row * gridSize.cols + col,
      currentPosition: { x: 0, y: 0 },
      correctPosition: { x: col * pieceWidth, y: row * pieceHeight },
      rotation: 0,
      isFlipped: false,
      imageData: pieceImageData,
      width: pieceWidth,
      height: pieceHeight,
      shape: pieceShape,
    };
  }

  private static applyShapeMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    shape: PieceShape,
    row: number,
    col: number,
    gridSize: { rows: number; cols: number }
  ): void {
    // 创建遮罩
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';

    switch (shape) {
      case 'triangle':
        // 创建三角形拼图块
        ctx.beginPath();
        const isUpward = (row + col) % 2 === 0;
        if (isUpward) {
          ctx.moveTo(0, height);
          ctx.lineTo(width, height);
          ctx.lineTo(width / 2, 0);
        } else {
          ctx.moveTo(0, 0);
          ctx.lineTo(width, 0);
          ctx.lineTo(width / 2, height);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'irregular':
        // 创建不规则形状拼图块
        this.createIrregularShape(ctx, width, height, row, col, gridSize);
        break;
    }

    ctx.restore();
  }

  private static createIrregularShape(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    row: number,
    col: number,
    gridSize: { rows: number; cols: number }
  ): void {
    ctx.beginPath();
    
    // 基础矩形路径
    const hasTopTab = row > 0 && Math.random() > 0.5;
    const hasBottomTab = row < gridSize.rows - 1 && Math.random() > 0.5;
    const hasLeftTab = col > 0 && Math.random() > 0.5;
    const hasRightTab = col < gridSize.cols - 1 && Math.random() > 0.5;

    const tabSize = Math.min(width, height) * 0.2;

    // 左边
    ctx.moveTo(hasLeftTab ? tabSize : 0, 0);
    if (hasLeftTab) {
      ctx.quadraticCurveTo(0, tabSize / 2, tabSize, tabSize);
    }

    // 底边
    ctx.lineTo(width - (hasBottomTab ? tabSize : 0), height);
    if (hasBottomTab) {
      ctx.quadraticCurveTo(width - tabSize / 2, height, width, height - tabSize);
    }

    // 右边
    ctx.lineTo(width, height - (hasRightTab ? tabSize : 0));
    if (hasRightTab) {
      ctx.quadraticCurveTo(width, height - tabSize / 2, width - tabSize, height - tabSize * 2);
    }

    // 顶边
    ctx.lineTo(hasTopTab ? tabSize : 0, 0);
    if (hasTopTab) {
      ctx.quadraticCurveTo(tabSize / 2, 0, 0, tabSize);
    }

    ctx.closePath();
    ctx.fill();
  }

  private static calculateDifficulty(
    gridSize: { rows: number; cols: number },
    pieceShape: PieceShape
  ): DifficultyLevel {
    const totalPieces = gridSize.rows * gridSize.cols;
    
    if (totalPieces <= 9) {
      return pieceShape === 'square' ? 'easy' : 'medium';
    } else if (totalPieces <= 16) {
      return pieceShape === 'square' ? 'medium' : 'hard';
    } else if (totalPieces <= 25) {
      return pieceShape === 'square' ? 'hard' : 'expert';
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
        return { gridSize: { rows: 6, cols: 6 }, pieceShape: 'irregular' as PieceShape };
    }
  }
}