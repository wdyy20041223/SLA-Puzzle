import {
  IrregularPuzzleConfig,
  IrregularPuzzlePiece,
  GridSize,
  Size,
  Position,
  GridLayout,
  GenerateIrregularPuzzleParams,
  calculateCenterIndex,
  GRID_CONFIGS
} from './types';
import { EdgePatternGenerator } from './EdgePatternGenerator';
import { ClipPathGenerator } from './ClipPathGenerator';
import { ImageSlicer } from './ImageSlicer';
import { applySvgMaskToImage } from './svgMaskUtil';

/**
 * 异形拼图生成器
 * 整合所有模块，生成完整的异形拼图配置
 */
export class IrregularPuzzleGenerator {


  /**
   * 生成完整的异形拼图
   * @param params 生成参数
   * @returns 异形拼图配置
   */
  static async generateIrregularPuzzle(
    params: GenerateIrregularPuzzleParams
  ): Promise<IrregularPuzzleConfig> {
    const { imageData, gridSize, name } = params;
    // 1. 验证参数
    this.validateParams(params);

    // 2. 加载图片
    const targetSize = 400;
    const imageUrl = imageData;
    // 3. 切割图片为网格块
    const pieces: IrregularPuzzlePiece[] = [];
    const totalPieces = gridSize.rows * gridSize.cols;
    const pieceSize = targetSize / gridSize.rows;

    // 加载图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl.startsWith('/') ? imageUrl : imageUrl;
      img.crossOrigin = 'anonymous';
    });
    const sourceSize = Math.min(img.width, img.height);
    const offsetX = (img.width - sourceSize) / 2;
    const offsetY = (img.height - sourceSize) / 2;

    // 采集范围扩大比例
    const expandRatio = 0.3;
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize.cols);
      const col = i % gridSize.cols;
      // 采集区域宽高扩大1.3倍
      const srcW = (sourceSize / gridSize.cols);
      const srcH = (sourceSize / gridSize.rows);
      const expandW = srcW * (1 + expandRatio);
      const expandH = srcH * (1 + expandRatio);
      // 采集区域中心不变，起点需左上移
      let srcX = offsetX + col * srcW - (expandW - srcW) / 2;
      let srcY = offsetY + row * srcH - (expandH - srcH) / 2;

      // 计算实际可采集的图片区域
      let imgCropX = srcX;
      let imgCropY = srcY;
      let imgCropW = expandW;
      let imgCropH = expandH;
      let destX = 0;
      let destY = 0;
      // 左边超出
      if (imgCropX < 0) {
        destX = Math.round(-imgCropX * (pieceSize / expandW));
        imgCropW += imgCropX; // 实际采集宽度减少
        imgCropX = 0;
      }
      // 上边超出
      if (imgCropY < 0) {
        destY = Math.round(-imgCropY * (pieceSize / expandH));
        imgCropH += imgCropY;
        imgCropY = 0;
      }
      // 右边超出
      if (imgCropX + imgCropW > img.width) {
        imgCropW = img.width - imgCropX;
      }
      // 下边超出
      if (imgCropY + imgCropH > img.height) {
        imgCropH = img.height - imgCropY;
      }
      // 创建canvas裁剪图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法获取canvas上下文');
      canvas.width = pieceSize;
      canvas.height = pieceSize;
      // 先填充透明
      ctx.clearRect(0, 0, pieceSize, pieceSize);
      // 只有采集区域在图片内才绘制
      if (imgCropW > 0 && imgCropH > 0) {
        ctx.drawImage(
          img,
          imgCropX,
          imgCropY,
          imgCropW,
          imgCropH,
          destX,
          destY,
          pieceSize - destX - Math.round((expandW - imgCropW - (imgCropX - srcX)) * (pieceSize / expandW)),
          pieceSize - destY - Math.round((expandH - imgCropH - (imgCropY - srcY)) * (pieceSize / expandH))
        );
      }
      // 自动选择SVG蒙版路径，按3x3模板规律映射
      let maskRow: number, maskCol: number;
      if (row === 0) {
        // 顶部
        if (col === 0) {
          maskRow = 0; maskCol = 0; // 左上角
        } else if (col === gridSize.cols - 1) {
          maskRow = 0; maskCol = 2; // 右上角
        } else {
          maskRow = 0; maskCol = 1; // 上边缘
        }
      } else if (row === gridSize.rows - 1) {
        // 底部
        if (col === 0) {
          maskRow = 2; maskCol = 0; // 左下角
        } else if (col === gridSize.cols - 1) {
          maskRow = 2; maskCol = 2; // 右下角
        } else {
          maskRow = 2; maskCol = 1; // 下边缘
        }
      } else {
        // 中间行
        if (col === 0) {
          maskRow = 1; maskCol = 0; // 左边缘
        } else if (col === gridSize.cols - 1) {
          maskRow = 1; maskCol = 2; // 右边缘
        } else {
          maskRow = 1; maskCol = 1; // 中间块
        }
      }
      const svgMaskPath = `/svg/puzzle_piece_${maskRow}_${maskCol}.svg`;
      // 合成图片和SVG mask
  const pieceImageData = await applySvgMaskToImage(canvas, svgMaskPath, pieceSize, pieceSize, true);


      // 所有边缘都为平直
      const up = 0;
      const right = 0;
      const down = 0;
      const left = 0;
      const edges = {
        top: { type: 'flat' as import('./types').EdgeType, intensity: 0, seedValue: 0 },
        right: { type: 'flat' as import('./types').EdgeType, intensity: 0, seedValue: 0 },
        bottom: { type: 'flat' as import('./types').EdgeType, intensity: 0, seedValue: 0 },
        left: { type: 'flat' as import('./types').EdgeType, intensity: 0, seedValue: 0 }
      };

      // 生成clipPath，遮盖扩展区域30%，只在原始方形边缘留出凹凸
      const expandedSize = { width: pieceSize * (1 + expandRatio), height: pieceSize * (1 + expandRatio) };
      const baseSize = { width: pieceSize, height: pieceSize };
      let clipPath = '';
      try {
        clipPath = ClipPathGenerator.generateClipPath(edges, expandedSize, baseSize);
      } catch (e) {
        clipPath = '';
      }

      const piece: IrregularPuzzlePiece = {
        id: i.toString(),
        originalIndex: i,
        rotation: 0,
        correctRotation: 0,
        imageData: pieceImageData,
        width: pieceSize,
        height: pieceSize,
        x: this.getRandomStartPosition().x,
        y: this.getRandomStartPosition().y,
        isCorrect: false,
        basePosition: { x: col * pieceSize, y: row * pieceSize },
        baseSize,
        expandedPosition: { x: col * pieceSize, y: row * pieceSize },
        expandedSize,
        edges,
        clipPath,
        isDraggable: true,
        snapTargets: [{ position: { x: col * pieceSize, y: row * pieceSize }, tolerance: 20 }],
        gridRow: row,
        gridCol: col,
        up,
        right,
        down,
        left
      };
      pieces.push(piece);
    }

    // 4. 创建最终配置
    const puzzleConfig: IrregularPuzzleConfig = {
      id: Date.now().toString(),
      name,
      originalImage: imageUrl,
      gridSize,
      pieceShape: 'irregular',
      pieces,
      fixedPiece: -1,
      gridLayout: {
        gridSize,
        baseSize: { width: pieceSize, height: pieceSize },
        expansionRatio: 0,
        fixedPieceIndex: -1,
        fixedPosition: { x: 0, y: 0 }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      difficulty: this.calculateDifficulty(gridSize)
    };
    return puzzleConfig;
  }


  /**
   * 生成简化版异形拼图（用于测试）
   * @param imageData 图像数据
   * @param gridKey 网格键（如'3x3', '4x4'）
   * @returns 异形拼图配置
   */
  static async generateSimpleIrregular(
    imageData: string,
    gridKey: keyof typeof GRID_CONFIGS = '3x3'
  ): Promise<IrregularPuzzleConfig> {
    const gridConfig = GRID_CONFIGS[gridKey];

    const params: GenerateIrregularPuzzleParams = {
      imageData,
      gridSize: { rows: gridConfig.rows, cols: gridConfig.cols },
      pieceShape: 'irregular',
      name: `异形拼图 ${gridKey}`,
      expansionRatio: 0.4
    };

    return this.generateIrregularPuzzle(params);
  }

  /**
   * 验证生成参数
   * @param params 参数
   */
  private static validateParams(params: GenerateIrregularPuzzleParams): void {
    if (!params.imageData) {
      throw new Error('图像数据不能为空');
    }

    if (!params.name || params.name.trim().length === 0) {
      throw new Error('拼图名称不能为空');
    }

    if (params.gridSize.rows < 2 || params.gridSize.cols < 2) {
      throw new Error('网格尺寸至少为 2x2');
    }

    if (params.gridSize.rows > 8 || params.gridSize.cols > 8) {
      throw new Error('网格尺寸不能超过 8x8');
    }

    if (params.expansionRatio && (params.expansionRatio < 0.2 || params.expansionRatio > 0.8)) {
      throw new Error('扩展比例应在 0.2-0.8 之间');
    }
  }

  /**
   * 计算固定块的绝对位置
   * @param fixedIndex 固定块索引
   * @param gridSize 网格尺寸
   * @param baseSize 基础尺寸
   * @returns 固定位置
   */
  private static calculateFixedPosition(
    fixedIndex: number,
    gridSize: GridSize,
    baseSize: Size
  ): Position {
    // 固定块在拼接板区域的正确位置
    // 注意：这个位置是相对于拼接板容器的，不包含50px偏移
    const row = Math.floor(fixedIndex / gridSize.cols);
    const col = fixedIndex % gridSize.cols;

    return {
      x: col * baseSize.width,
      y: row * baseSize.height
    };
  }

  /**
   * 获取随机起始位置（用于可拖拽的块）
   * @returns 随机位置
   */
  private static getRandomStartPosition(): Position {
    // 在拼接板右下角区域生成随机位置
    // 这些块将在待拼接列表中显示，这里的坐标不重要
    return {
      x: 400 + Math.random() * 200, // 拼接板右侧区域
      y: 300 + Math.random() * 200  // 拼接板下方区域
    };
  }

  /**
   * 计算网格对齐的位置（支持原点偏移）
   * @param position 原始位置（相对于拼接板容器）
   * @param gridSize 网格大小
   * @param offset 原点偏移，例如 50
   */
  private static calculateGridAlignedPositionWithOffset(
    position: number,
    gridSize: number,
    offset: number
  ): number {
    return Math.round((position - offset) / gridSize) * gridSize + offset;
  }

  /**
   * 计算拼图难度
   * @param gridSize 网格尺寸
   * @returns 难度等级
   */
  private static calculateDifficulty(gridSize: GridSize): 'easy' | 'medium' | 'hard' | 'expert' {
    const totalPieces = gridSize.rows * gridSize.cols;

    if (totalPieces <= 9) return 'easy';
    if (totalPieces <= 16) return 'medium';
    if (totalPieces <= 25) return 'hard';
    return 'expert';
  }

  /**
   * 验证拼图完成状态
   * @param pieces 拼图块数组
   * @param tolerance 容差（像素）
   * @returns 完成状态信息
   */
  static validateCompletion(
    pieces: IrregularPuzzlePiece[],
    tolerance: number = 20
  ): {
    isComplete: boolean;
    correctPieces: number;
    totalPieces: number;
    completionRate: number;
  } {
    let correctPieces = 0;
    const totalPieces = pieces.length;

    pieces.forEach(piece => {
      // 检查是否在正确位置附近
      const targetX = piece.basePosition.x;
      const targetY = piece.basePosition.y;

      const deltaX = Math.abs(piece.x - targetX);
      const deltaY = Math.abs(piece.y - targetY);

      if (deltaX <= tolerance && deltaY <= tolerance) {
        correctPieces++;
        piece.isCorrect = true;
      } else {
        piece.isCorrect = false;
      }
    });

    const completionRate = (correctPieces / totalPieces) * 100;
    const isComplete = correctPieces === totalPieces;

    return {
      isComplete,
      correctPieces,
      totalPieces,
      completionRate: Math.round(completionRate)
    };
  }

  /**
   * 重置拼图到初始状态
   * @param pieces 拼图块数组
   * @param fixedPieceIndex 固定块索引（已弃用，所有块现在都可拖拽）
   */
  static resetPuzzle(pieces: IrregularPuzzlePiece[], fixedPieceIndex: number): void {
    pieces.forEach((piece) => {
      // 所有块随机分布到待拼接区域
      const randomPos = this.getRandomStartPosition();
      piece.x = randomPos.x;
      piece.y = randomPos.y;
      // 随机旋转：0°, 90°, 180°, 270°
      const rotations = [0, 90, 180, 270];
      piece.rotation = rotations[Math.floor(Math.random() * rotations.length)];
      piece.isCorrect = false;
      piece.isDraggable = true; // 确保所有块都可拖拽
    });
  }

  /**
   * 获取拼图统计信息
   * @param config 拼图配置
   * @returns 统计信息
   */
  static getPuzzleStats(config: IrregularPuzzleConfig): {
    totalPieces: number;
    draggablePieces: number;
    fixedPieces: number;
    edgeTypes: { flat: number; knob: number; hole: number };
    difficulty: string;
    estimatedTime: string;
  } {
    const totalPieces = config.pieces.length;
    const draggablePieces = config.pieces.filter(p => p.isDraggable).length;
    const fixedPieces = 0; // 现在没有固定块了

    // 统计边缘类型
    let flatEdges = 0, knobEdges = 0, holeEdges = 0;

    config.pieces.forEach(piece => {
      [piece.edges.top, piece.edges.right, piece.edges.bottom, piece.edges.left]
        .forEach(edge => {
          switch (edge.type) {
            case 'flat': flatEdges++; break;
            case 'knob': knobEdges++; break;
            case 'hole': holeEdges++; break;
          }
        });
    });

    // 估算完成时间
    const baseTime = totalPieces * 30; // 每块30秒基础时间
    const estimatedMinutes = Math.ceil(baseTime / 60);
    const estimatedTime = estimatedMinutes < 60
      ? `${estimatedMinutes} 分钟`
      : `${Math.floor(estimatedMinutes / 60)} 小时 ${estimatedMinutes % 60} 分钟`;

    return {
      totalPieces,
      draggablePieces,
      fixedPieces,
      edgeTypes: { flat: flatEdges, knob: knobEdges, hole: holeEdges },
      difficulty: config.difficulty || 'medium',
      estimatedTime
    };
  }
}
