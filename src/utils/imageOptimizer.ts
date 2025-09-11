// 图片优化工具
export class ImageOptimizer {
  // 创建低质量占位符
  static createPlaceholder(width: number, height: number, color: string = '#f0f0f0'): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      // 添加简单的渐变效果
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.lightenColor(color, 20));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  // 颜色变亮
  private static lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // 预加载图片
  static preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // 批量预加载图片
  static async preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    const promises = srcs.map(src => this.preloadImage(src));
    return Promise.allSettled(promises).then(results => 
      results
        .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
    );
  }

  // 压缩图片
  static compressImage(file: File, maxWidth: number = 400, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          reject(new Error('无法创建canvas上下文'));
        }
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // 创建缩略图
  static createThumbnail(src: string, size: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        } else {
          reject(new Error('无法创建canvas上下文'));
        }
      };
      
      img.onerror = reject;
      img.src = src;
    });
  }
}

// 图片缓存管理器
export class ImageCache {
  private static cache = new Map<string, string>();
  private static loadingPromises = new Map<string, Promise<string>>();

  static async getImage(src: string, useCache: boolean = true): Promise<string> {
    if (useCache && this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = this.loadImage(src);
    this.loadingPromises.set(src, promise);

    try {
      const result = await promise;
      this.cache.set(src, result);
      return result;
    } finally {
      this.loadingPromises.delete(src);
    }
  }

  private static async loadImage(src: string): Promise<string> {
    try {
      const img = await ImageOptimizer.preloadImage(src);
      return img.src;
    } catch (error) {
      console.warn(`图片加载失败: ${src}`, error);
      // 返回占位符
      return ImageOptimizer.createPlaceholder(400, 400, '#f0f0f0');
    }
  }

  static clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}
