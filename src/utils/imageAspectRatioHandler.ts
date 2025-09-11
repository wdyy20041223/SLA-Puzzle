/**
 * 图片宽高比处理工具
 * 专门处理16:9等特殊宽高比的图片，参考拼图编辑器的裁剪思路
 */

export interface ImageDimensions {
  width: number;
  height: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

/**
 * 根据图片的宽高比处理图片尺寸
 * @param originalWidth 原始图片宽度
 * @param originalHeight 原始图片高度
 * @param targetSize 目标尺寸（用于正方形图片）
 * @param aspectRatio 目标宽高比 '1:1' 或 '16:9'
 * @returns 处理后的图片尺寸信息
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  targetSize: number = 400,
  aspectRatio: '1:1' | '16:9' = '1:1'
): ImageDimensions {
  const aspectRatioValue = aspectRatio === '1:1' ? 1 : 16 / 9;

  if (aspectRatio === '1:1') {
    // 正方形处理：取短边居中裁剪
    const sourceSize = Math.min(originalWidth, originalHeight);
    return {
      width: targetSize,
      height: targetSize,
      sourceX: (originalWidth - sourceSize) / 2,
      sourceY: (originalHeight - sourceSize) / 2,
      sourceWidth: sourceSize,
      sourceHeight: sourceSize
    };
  } else {
    // 16:9 处理：保持比例，参考拼图编辑器的裁剪逻辑
    const targetWidth = targetSize;
    const targetHeight = targetSize / aspectRatioValue;

    // 计算源图片的裁剪区域，保持16:9比例
    let sourceWidth, sourceHeight, sourceX, sourceY;

    const originalAspectRatio = originalWidth / originalHeight;

    if (originalAspectRatio > aspectRatioValue) {
      // 原图比16:9更宽，按高度计算
      sourceHeight = originalHeight;
      sourceWidth = sourceHeight * aspectRatioValue;
      sourceX = (originalWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // 原图比16:9更高或比例相同，按宽度计算
      sourceWidth = originalWidth;
      sourceHeight = sourceWidth / aspectRatioValue;
      sourceX = 0;
      sourceY = (originalHeight - sourceHeight) / 2;
    }

    return {
      width: targetWidth,
      height: targetHeight,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight
    };
  }
}

/**
 * 创建一个Canvas并绘制处理后的图片
 * @param img 原始图片元素
 * @param dimensions 图片尺寸信息
 * @returns 处理后的Canvas元素
 */
export function createProcessedCanvas(
  img: HTMLImageElement,
  dimensions: ImageDimensions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法获取canvas上下文');
  }

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  // 清空canvas（白色背景）
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制处理后的图片
  ctx.drawImage(
    img,
    dimensions.sourceX,
    dimensions.sourceY,
    dimensions.sourceWidth,
    dimensions.sourceHeight,
    0,
    0,
    dimensions.width,
    dimensions.height
  );

  return canvas;
}

/**
 * 检测图片是否为16:9比例（允许一定误差）
 * @param width 图片宽度
 * @param height 图片高度
 * @param tolerance 误差容忍度（默认0.1）
 * @returns 是否为16:9比例
 */
export function isWideScreenRatio(
  width: number,
  height: number,
  tolerance: number = 0.1
): boolean {
  const ratio = width / height;
  const targetRatio = 16 / 9;
  return Math.abs(ratio - targetRatio) <= tolerance;
}

/**
 * 根据Asset信息推断应该使用的宽高比
 * @param asset 素材信息
 * @returns 推荐的宽高比
 */
export function getRecommendedAspectRatio(asset: { width: number; height: number; tags?: string[] }): '1:1' | '16:9' {
  // 首先检查标签中是否明确指定了16:9
  if (asset.tags && asset.tags.includes('16:9')) {
    return '16:9';
  }

  // 检查实际尺寸比例
  if (isWideScreenRatio(asset.width, asset.height)) {
    return '16:9';
  }

  // 默认返回1:1
  return '1:1';
}

/**
 * 为火山旅梦CG图片预处理数据
 * @param imagePath 图片路径
 * @returns 预处理后的图片数据URL
 */
export async function preprocessVolcanicJourneyImage(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // 强制使用16:9比例处理
        const dimensions = calculateImageDimensions(
          img.naturalWidth,
          img.naturalHeight,
          800, // 使用更高的目标尺寸以保证质量
          '16:9'
        );

        const canvas = createProcessedCanvas(img, dimensions);
        const processedImageData = canvas.toDataURL('image/jpeg', 0.9);
        resolve(processedImageData);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = imagePath;
  });
}
