import React from 'react';
import { Asset } from '../../types';
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
  const handleClick = () => {
    if (isLocked) {
      alert(lockMessage);
      return;
    }
    onSelect(asset);
  };

  return (
    <div
      className={`asset-card ${isLocked ? 'locked' : ''}`}
      onClick={handleClick}
    >
      <div className="asset-thumbnail">
        {asset.thumbnail.endsWith('.svg') ? (
          <div className="svg-thumbnail">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              loading="lazy"
              className={`svg-image ${isLocked ? 'locked' : ''}`}
            />
          </div>
        ) : (
          <img
            src={asset.thumbnail}
            alt={asset.name}
            loading="lazy"
            className={isLocked ? 'locked' : ''}
          />
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