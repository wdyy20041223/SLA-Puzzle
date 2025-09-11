import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../common/Button';
import './ImageCropper.css';

interface ImageCropperProps {
  image: string;
  aspectRatio: '1:1' | '16:9';
  onCropComplete: (croppedImageData: string) => void;
  onBack: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  startX: number;
  startY: number;
  startCrop: CropArea;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  aspectRatio,
  onCropComplete,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, width: 0, height: 0 }
  });

  // 计算裁剪比例
  const getAspectRatioValue = useCallback(() => {
    return aspectRatio === '1:1' ? 1 : 16 / 9;
  }, [aspectRatio]);

  // 初始化裁剪区域
  const initializeCropArea = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const aspectRatioValue = getAspectRatioValue();
    
    // 计算初始裁剪区域大小
    const containerWidth = containerRect.width - 40; // 留出边距
    const containerHeight = containerRect.height - 40;
    
    let initialWidth, initialHeight;
    
    if (aspectRatioValue === 1) {
      // 1:1 正方形
      const size = Math.min(containerWidth, containerHeight) * 0.6;
      initialWidth = size;
      initialHeight = size;
    } else {
      // 16:9 宽屏
      if (containerWidth / containerHeight > aspectRatioValue) {
        initialHeight = containerHeight * 0.6;
        initialWidth = initialHeight * aspectRatioValue;
      } else {
        initialWidth = containerWidth * 0.6;
        initialHeight = initialWidth / aspectRatioValue;
      }
    }
    
    setCropArea({
      x: (containerWidth - initialWidth) / 2 + 20,
      y: (containerHeight - initialHeight) / 2 + 20,
      width: initialWidth,
      height: initialHeight
    });
  }, [getAspectRatioValue]);

  // 图片加载完成
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // 计算缩放比例，使图片适应容器
    const scaleX = (containerRect.width - 40) / img.naturalWidth;
    const scaleY = (containerRect.height - 40) / img.naturalHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // 不超过原始大小
    
    setScale(newScale);
    
    // 居中显示图片
    const displayWidth = img.naturalWidth * newScale;
    const displayHeight = img.naturalHeight * newScale;
    setImageOffset({
      x: (containerRect.width - displayWidth) / 2,
      y: (containerRect.height - displayHeight) / 2
    });
    
    // 延迟初始化裁剪区域，确保图片已渲染
    setTimeout(initializeCropArea, 100);
  }, [initializeCropArea]);

  // 缩放控制
  const handleScaleChange = useCallback((newScale: number) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // 限制缩放范围
    const minScale = 0.1;
    const maxScale = 3;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setScale(clampedScale);
    
    // 重新计算图片位置以保持居中
    const displayWidth = img.naturalWidth * clampedScale;
    const displayHeight = img.naturalHeight * clampedScale;
    setImageOffset({
      x: (containerRect.width - displayWidth) / 2,
      y: (containerRect.height - displayHeight) / 2
    });
  }, []);

  // 鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在调整手柄上
    const handle = getResizeHandle(x, y, cropArea);
    
    if (handle) {
      setDragState({
        isDragging: false,
        isResizing: true,
        resizeHandle: handle,
        startX: x,
        startY: y,
        startCrop: { ...cropArea }
      });
    } else if (isPointInCropArea(x, y, cropArea)) {
      // 点击在裁剪区域内，开始拖拽
      setDragState({
        isDragging: true,
        isResizing: false,
        resizeHandle: null,
        startX: x,
        startY: y,
        startCrop: { ...cropArea }
      });
    }
  }, [cropArea]);

  // 鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (dragState.isDragging) {
      // 拖拽移动裁剪区域
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;
      
      const newX = Math.max(0, Math.min(
        rect.width - cropArea.width,
        dragState.startCrop.x + deltaX
      ));
      const newY = Math.max(0, Math.min(
        rect.height - cropArea.height,
        dragState.startCrop.y + deltaY
      ));
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (dragState.isResizing && dragState.resizeHandle) {
      // 调整裁剪区域大小
      const deltaX = x - dragState.startX;
      const aspectRatioValue = getAspectRatioValue();
      
      let newCrop = { ...dragState.startCrop };
      
      switch (dragState.resizeHandle) {
        case 'se': // 右下角
          const newWidth = Math.max(50, dragState.startCrop.width + deltaX);
          const newHeight = newWidth / aspectRatioValue;
          
          newCrop.width = Math.min(newWidth, rect.width - newCrop.x);
          newCrop.height = Math.min(newHeight, rect.height - newCrop.y);
          
          // 如果受到高度限制，重新计算宽度
          if (newCrop.height !== newHeight) {
            newCrop.width = newCrop.height * aspectRatioValue;
          }
          break;
          
        case 'sw': // 左下角
          const newWidthSW = Math.max(50, dragState.startCrop.width - deltaX);
          const newHeightSW = newWidthSW / aspectRatioValue;
          
          newCrop.width = newWidthSW;
          newCrop.height = Math.min(newHeightSW, rect.height - newCrop.y);
          newCrop.x = Math.max(0, dragState.startCrop.x - (newCrop.width - dragState.startCrop.width));
          
          // 如果受到高度限制，重新计算
          if (newCrop.height !== newHeightSW) {
            newCrop.width = newCrop.height * aspectRatioValue;
            newCrop.x = dragState.startCrop.x + dragState.startCrop.width - newCrop.width;
          }
          break;
          
        case 'ne': // 右上角
          const newWidthNE = Math.max(50, dragState.startCrop.width + deltaX);
          const newHeightNE = newWidthNE / aspectRatioValue;
          
          newCrop.width = Math.min(newWidthNE, rect.width - newCrop.x);
          newCrop.height = newHeightNE;
          newCrop.y = Math.max(0, dragState.startCrop.y - (newCrop.height - dragState.startCrop.height));
          
          // 如果受到边界限制，重新计算
          if (newCrop.width !== newWidthNE) {
            newCrop.height = newCrop.width / aspectRatioValue;
            newCrop.y = dragState.startCrop.y + dragState.startCrop.height - newCrop.height;
          }
          break;
          
        case 'nw': // 左上角
          const newWidthNW = Math.max(50, dragState.startCrop.width - deltaX);
          const newHeightNW = newWidthNW / aspectRatioValue;
          
          newCrop.width = newWidthNW;
          newCrop.height = newHeightNW;
          newCrop.x = Math.max(0, dragState.startCrop.x - (newCrop.width - dragState.startCrop.width));
          newCrop.y = Math.max(0, dragState.startCrop.y - (newCrop.height - dragState.startCrop.height));
          break;
      }
      
      setCropArea(newCrop);
    }
  }, [dragState, cropArea, getAspectRatioValue]);

  // 鼠标释放事件
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
      startX: 0,
      startY: 0,
      startCrop: { x: 0, y: 0, width: 0, height: 0 }
    });
  }, []);

  // 辅助函数：检查点是否在裁剪区域内
  const isPointInCropArea = (x: number, y: number, crop: CropArea) => {
    return x >= crop.x && x <= crop.x + crop.width &&
           y >= crop.y && y <= crop.y + crop.height;
  };

  // 辅助函数：获取调整手柄
  const getResizeHandle = (x: number, y: number, crop: CropArea) => {
    const handleSize = 10;
    
    const handles = {
      nw: { x: crop.x, y: crop.y },
      ne: { x: crop.x + crop.width, y: crop.y },
      sw: { x: crop.x, y: crop.y + crop.height },
      se: { x: crop.x + crop.width, y: crop.y + crop.height }
    };
    
    for (const [handle, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= handleSize && Math.abs(y - pos.y) <= handleSize) {
        return handle;
      }
    }
    
    return null;
  };

  // 执行裁剪
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // 计算裁剪区域在原始图片上的坐标
    const scaleRatio = img.naturalWidth / (img.naturalWidth * scale);
    const sourceX = (cropArea.x - imageOffset.x) * scaleRatio;
    const sourceY = (cropArea.y - imageOffset.y) * scaleRatio;
    const sourceWidth = cropArea.width * scaleRatio;
    const sourceHeight = cropArea.height * scaleRatio;
    
    // 设置canvas尺寸
    const outputSize = 800; // 输出统一尺寸
    const aspectRatioValue = getAspectRatioValue();
    
    if (aspectRatioValue === 1) {
      canvas.width = outputSize;
      canvas.height = outputSize;
    } else {
      canvas.width = outputSize;
      canvas.height = outputSize / aspectRatioValue;
    }
    
    // 清空canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制裁剪后的图片
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );
    
    // 获取裁剪后的图片数据
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageData);
  }, [cropArea, scale, imageOffset, getAspectRatioValue, onCropComplete]);

  // 监听aspectRatio变化，重新初始化裁剪区域
  useEffect(() => {
    if (imageLoaded) {
      initializeCropArea();
    }
  }, [aspectRatio, imageLoaded, initializeCropArea]);

  return (
    <div className="image-cropper">
      <div className="cropper-controls">
        <div className="scale-control">
          <label>缩放: {Math.round(scale * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="scale-slider"
          />
        </div>
        
        <div className="crop-info">
          <span>裁剪比例: {aspectRatio}</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="cropper-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 隐藏的原始图片用于加载 */}
        <img
          ref={imageRef}
          src={image}
          alt="原始图片"
          style={{ display: 'none' }}
          onLoad={handleImageLoad}
        />
        
        {/* 显示的图片 */}
        {imageLoaded && (
          <div className="image-display">
            <img
              src={image}
              alt="待裁剪图片"
              className="display-image"
              style={{
                left: `${imageOffset.x}px`,
                top: `${imageOffset.y}px`,
                position: 'absolute',
                width: imageRef.current ? imageRef.current.naturalWidth * scale : 'auto',
                height: imageRef.current ? imageRef.current.naturalHeight * scale : 'auto',
              }}
              draggable={false}
            />
            
            {/* 裁剪蒙版 */}
            <div className="crop-overlay">
              {/* 暗色遮罩 */}
              <div className="overlay-top" style={{ height: `${cropArea.y}px` }} />
              <div 
                className="overlay-middle" 
                style={{ 
                  top: `${cropArea.y}px`, 
                  height: `${cropArea.height}px` 
                }}
              >
                <div className="overlay-left" style={{ width: `${cropArea.x}px` }} />
                <div className="overlay-right" style={{ 
                  left: `${cropArea.x + cropArea.width}px`,
                  width: `calc(100% - ${cropArea.x + cropArea.width}px)`
                }} />
              </div>
              <div 
                className="overlay-bottom" 
                style={{ 
                  top: `${cropArea.y + cropArea.height}px`,
                  height: `calc(100% - ${cropArea.y + cropArea.height}px)`
                }} 
              />
              
              {/* 裁剪边框 */}
              <div
                className="crop-border"
                style={{
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  width: `${cropArea.width}px`,
                  height: `${cropArea.height}px`
                }}
              >
                {/* 调整手柄 */}
                <div className="resize-handle nw" />
                <div className="resize-handle ne" />
                <div className="resize-handle sw" />
                <div className="resize-handle se" />
                
                {/* 网格线 */}
                <div className="grid-lines">
                  <div className="grid-line vertical" style={{ left: '33.33%' }} />
                  <div className="grid-line vertical" style={{ left: '66.66%' }} />
                  <div className="grid-line horizontal" style={{ top: '33.33%' }} />
                  <div className="grid-line horizontal" style={{ top: '66.66%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!imageLoaded && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>加载图片中...</p>
          </div>
        )}
      </div>
      
      {/* 隐藏的canvas用于生成裁剪结果 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="cropper-actions">
        <Button onClick={onBack} variant="secondary" size="medium">
          ← 重新选择图片
        </Button>
        
        <Button
          onClick={handleCrop}
          variant="primary"
          size="large"
          disabled={!imageLoaded}
        >
          ✂️ 确认裁剪
        </Button>
      </div>
      
      <div className="cropper-tips">
        <h4>💡 使用提示</h4>
        <ul>
          <li>拖拽裁剪框可以移动位置</li>
          <li>拖拽四个角可以调整大小</li>
          <li>使用滑块调整图片缩放比例</li>
          <li>网格线帮助您更好地构图</li>
        </ul>
      </div>
    </div>
  );
};
