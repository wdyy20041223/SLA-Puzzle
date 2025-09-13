import { useCallback, useRef } from 'react';

interface UseMobileDragOptions {
  onDragStart?: (id: string, position: { x: number; y: number }) => void;
  onDragMove?: (id: string, position: { x: number; y: number }) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
  onDoubleTap?: (id: string) => void;
  containerRef?: React.RefObject<HTMLElement>;
}

interface DragState {
  isDragging: boolean;
  dragId: string | null;
  startPosition: { x: number; y: number };
  dragOffset: { x: number; y: number };
  lastTapTime: number;
}

export const useMobileDrag = (options: UseMobileDragOptions = {}) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    onDoubleTap,
    containerRef
  } = options;

  const dragState = useRef<DragState>({
    isDragging: false,
    dragId: null,
    startPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    lastTapTime: 0
  });

  // 检测是否为触摸设备
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 获取触摸位置
  const getTouchPosition = useCallback((e: TouchEvent) => {
    const touch = e.touches[0] || e.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }, []);

  // 获取相对容器的位置
  const getRelativePosition = useCallback((position: { x: number; y: number }) => {
    if (!containerRef?.current) return position;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: position.x - containerRect.left,
      y: position.y - containerRect.top
    };
  }, [containerRef]);

  // 触摸开始处理
  const handleTouchStart = useCallback((e: TouchEvent, id: string, elementRect?: DOMRect) => {
    e.preventDefault();
    
    const touchPosition = getTouchPosition(e);
    const currentTime = Date.now();
    
    // 双击检测
    const timeSinceLastTap = currentTime - dragState.current.lastTapTime;
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // 双击事件
      onDoubleTap?.(id);
      dragState.current.lastTapTime = 0;
      return;
    }
    
    dragState.current.lastTapTime = currentTime;
    
    // 计算拖拽偏移
    if (elementRect) {
      dragState.current.dragOffset = {
        x: touchPosition.x - elementRect.left,
        y: touchPosition.y - elementRect.top
      };
    } else {
      dragState.current.dragOffset = { x: 0, y: 0 };
    }
    
    dragState.current.startPosition = touchPosition;
    dragState.current.dragId = id;
    
    // 延迟检查是否开始拖拽
    setTimeout(() => {
      if (dragState.current.lastTapTime === currentTime && !dragState.current.isDragging) {
        dragState.current.isDragging = true;
        
        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        
        const relativePosition = getRelativePosition({
          x: touchPosition.x - dragState.current.dragOffset.x,
          y: touchPosition.y - dragState.current.dragOffset.y
        });
        
        onDragStart?.(id, relativePosition);
        
        // 添加全局事件监听
        document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        document.addEventListener('touchend', handleGlobalTouchEnd);
      }
    }, 150); // 延迟150ms，区分点击和拖拽
  }, [getTouchPosition, getRelativePosition, onDragStart, onDoubleTap]);

  // 全局触摸移动处理
  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.current.isDragging || !dragState.current.dragId) return;
    
    e.preventDefault();
    
    const touchPosition = getTouchPosition(e);
    const relativePosition = getRelativePosition({
      x: touchPosition.x - dragState.current.dragOffset.x,
      y: touchPosition.y - dragState.current.dragOffset.y
    });
    
    onDragMove?.(dragState.current.dragId, relativePosition);
  }, [getTouchPosition, getRelativePosition, onDragMove]);

  // 全局触摸结束处理
  const handleGlobalTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragState.current.isDragging || !dragState.current.dragId) return;
    
    e.preventDefault();
    
    const touchPosition = getTouchPosition(e);
    const relativePosition = getRelativePosition({
      x: touchPosition.x - dragState.current.dragOffset.x,
      y: touchPosition.y - dragState.current.dragOffset.y
    });
    
    onDragEnd?.(dragState.current.dragId, relativePosition);
    
    // 恢复页面滚动
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // 移除全局事件监听
    document.removeEventListener('touchmove', handleGlobalTouchMove);
    document.removeEventListener('touchend', handleGlobalTouchEnd);
    
    // 重置状态
    dragState.current.isDragging = false;
    dragState.current.dragId = null;
  }, [getTouchPosition, getRelativePosition, onDragEnd]);

  // 创建触摸事件处理器
  const createTouchHandlers = useCallback((id: string) => {
    if (!isTouchDevice) return {};
    
    return {
      onTouchStart: (e: React.TouchEvent) => {
        const elementRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        handleTouchStart(e.nativeEvent, id, elementRect);
      }
    };
  }, [isTouchDevice, handleTouchStart]);

  // 简单的触摸开始处理（不需要元素位置）
  const createSimpleTouchHandlers = useCallback((id: string) => {
    if (!isTouchDevice) return {};
    
    return {
      onTouchStart: (e: React.TouchEvent) => {
        handleTouchStart(e.nativeEvent, id);
      }
    };
  }, [isTouchDevice, handleTouchStart]);

  return {
    isTouchDevice,
    createTouchHandlers,
    createSimpleTouchHandlers,
    isDragging: dragState.current.isDragging,
    dragId: dragState.current.dragId
  };
};
