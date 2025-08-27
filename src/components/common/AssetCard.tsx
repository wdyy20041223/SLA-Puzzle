import React from 'react';
import { Asset } from '../../types';
import './AssetCard.css';

interface AssetCardProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onSelect,
  onDelete,
}) => {
  return (
    <div className="asset-card" onClick={() => onSelect(asset)}>
      <div className="asset-thumbnail">
        {asset.thumbnail.endsWith('.svg') ? (
          <div className="svg-thumbnail">
            <img 
              src={asset.thumbnail} 
              alt={asset.name}
              loading="lazy"
              className="svg-image"
            />
          </div>
        ) : (
          <img 
            src={asset.thumbnail} 
            alt={asset.name}
            loading="lazy"
          />
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