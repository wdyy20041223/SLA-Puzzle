import React from 'react';
import { Button } from './Button';
import './OriginalImagePreview.css';

interface OriginalImagePreviewProps {
  imageUrl: string;
  isVisible: boolean;
  onClose: () => void;
}

export const OriginalImagePreview: React.FC<OriginalImagePreviewProps> = ({
  imageUrl,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="original-image-preview-overlay">
      <div className="original-image-preview-modal">
        <div className="modal-header">
          <h3>原图预览</h3>
          <Button onClick={onClose} variant="secondary" size="small">×</Button>
        </div>
        <div className="modal-body">
          <img 
            src={imageUrl} 
            alt="Original puzzle"
            className="original-image"
          />
        </div>
        <div className="modal-footer">
          <Button onClick={onClose} variant="primary">关闭</Button>
        </div>
      </div>
    </div>
  );
};