import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../../types';
import { ImageCache } from '../../utils/imageOptimizer';
import './AssetCard.css';

interface AssetCardProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  isLocked?: boolean;
  lockMessage?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onSelect,
  onDelete,
  isLocked = false,
  lockMessage = '需要购买解锁',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1 
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 加载图片
  useEffect(() => {
    if (isInView && asset.thumbnail) {
      ImageCache.getImage(asset.thumbnail)
        .then(src => {
          setImageSrc(src);
          setImageLoaded(true);
        })
        .catch(() => {
          setImageError(true);
        });
    }
  }, [isInView, asset.thumbnail]);

  const handleClick = () => {
    if (isLocked) {
      alert(lockMessage);
      return;
    }
    onSelect(asset);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      ref={cardRef}
      className={`asset-card ${isLocked ? 'locked' : ''} ${imageLoaded ? 'loaded' : 'loading'}`}
      onClick={handleClick}
    >
      <div className="asset-thumbnail">
        {!isInView ? (
          // 占位符，在图片进入视口前显示
          <div className="image-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🖼️</div>
              <div className="placeholder-text">加载中...</div>
            </div>
          </div>
        ) : asset.thumbnail.endsWith('.svg') ? (
          <div className="svg-thumbnail">
            <img
              ref={imgRef}
              src={imageSrc || asset.thumbnail}
              alt={asset.name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`svg-image ${isLocked ? 'locked' : ''} ${imageLoaded ? 'loaded' : 'loading'}`}
            />
          </div>
        ) : (
          <img
            ref={imgRef}
            src={imageSrc || asset.thumbnail}
            alt={asset.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`${isLocked ? 'locked' : ''} ${imageLoaded ? 'loaded' : 'loading'}`}
          />
        )}

        {/* 加载状态指示器 */}
        {isInView && !imageLoaded && !imageError && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* 错误状态指示器 */}
        {imageError && (
          <div className="error-indicator">
            <div className="error-icon">⚠️</div>
            <div className="error-text">加载失败</div>
          </div>
        )}

        {/* 锁定覆盖层 */}
        {isLocked && (
          <div className="lock-overlay">
            <div className="lock-icon">🔒</div>
            <div className="lock-text">需要购买</div>
          </div>
        )}

        {/* NEW标签 */}
        {asset.isNew && (
          <div className="new-badge-small">NEW</div>
        )}

        <div className="asset-overlay">
          <div className="asset-info">
            <h4>{asset.name}</h4>
            <p>{asset.category}</p>
            <p>{asset.width} × {asset.height}</p>
          </div>
        </div>
      </div>
      <div className="asset-footer">
        <span className="asset-tags">
          {asset.tags.slice(0, 2).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </span>
        {onDelete && (
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset.id);
            }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};