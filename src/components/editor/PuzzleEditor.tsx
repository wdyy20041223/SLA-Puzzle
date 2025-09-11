import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../common/Button';
import { ImageCropper } from './ImageCropper';
import { DifficultySettings } from './DifficultySettings';
import { PreviewModal } from './PreviewModal';
import { DifficultyLevel, PieceShape } from '../../types';
import './PuzzleEditor.css';

interface PuzzleEditorProps {
  onBackToMenu: () => void;
}

type EditorStep = 'upload' | 'crop' | 'settings' | 'preview';
type AspectRatio = '1:1' | '16:9';

interface CustomPuzzleConfig {
  name: string;
  image: string;
  difficulty: DifficultyLevel;
  pieceShape: PieceShape;
  aspectRatio: AspectRatio;
  croppedImageData?: string;
}

export const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ onBackToMenu }) => {
  const [currentStep, setCurrentStep] = useState<EditorStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [customPuzzleConfig, setCustomPuzzleConfig] = useState<CustomPuzzleConfig>({
    name: '',
    image: '',
    difficulty: 'medium',
    pieceShape: 'square',
    aspectRatio: '1:1'
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          setUploadedImage(imageData);
          setCustomPuzzleConfig(prev => ({
            ...prev,
            image: imageData,
            name: file.name.replace(/\.[^/.]+$/, '') // 去掉文件扩展名
          }));
          setCurrentStep('crop');
        };
        reader.readAsDataURL(file);
      } else {
        alert('请选择有效的图片文件！');
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const file = files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setCustomPuzzleConfig(prev => ({
          ...prev,
          image: imageData,
          name: file.name.replace(/\.[^/.]+$/, '')
        }));
        setCurrentStep('crop');
      };
      reader.readAsDataURL(file);
    } else {
      alert('请拖拽有效的图片文件！');
    }
  }, []);

  const handleCropComplete = useCallback((croppedImageData: string) => {
    setCustomPuzzleConfig(prev => ({
      ...prev,
      croppedImageData,
      aspectRatio: selectedAspectRatio
    }));
    setCurrentStep('settings');
  }, [selectedAspectRatio]);

  const handleDifficultySettingsComplete = useCallback((
    difficulty: DifficultyLevel,
    pieceShape: PieceShape
  ) => {
    setCustomPuzzleConfig(prev => ({
      ...prev,
      difficulty,
      pieceShape
    }));
    setCurrentStep('preview');
  }, []);

  const handleSavePuzzle = useCallback(() => {
    // 这里是预留功能，暂时只显示提示
    alert('保存功能正在开发中！此拼图配置将保存到本地存储。');
    console.log('保存拼图配置:', customPuzzleConfig);
  }, [customPuzzleConfig]);

  const handleSharePuzzle = useCallback(() => {
    // 这里是预留功能，暂时只显示提示
    alert('分享功能正在开发中！将来可以导出配置文件或生成分享链接。');
    console.log('分享拼图配置:', customPuzzleConfig);
  }, [customPuzzleConfig]);

  const handleStartGame = useCallback(() => {
    // 这里是预留功能，将来会集成到游戏系统中
    alert('开始游戏功能正在开发中！此拼图将加载到游戏中。');
    console.log('开始自定义拼图游戏:', customPuzzleConfig);
  }, [customPuzzleConfig]);

  const handleRestart = useCallback(() => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setCustomPuzzleConfig({
      name: '',
      image: '',
      difficulty: 'medium',
      pieceShape: 'square',
      aspectRatio: '1:1'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const renderUploadStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>📸 上传图片</h2>
        <p>选择您想要制作成拼图的图片</p>
      </div>
      
      <div className="upload-step">
        <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
          <div className="upload-content">
            <div className="upload-icon">🖼️</div>
            <h3>拖拽图片到此处</h3>
            <p>或者点击下方按钮选择文件</p>
            <p className="upload-hint">支持 JPG、PNG、GIF 等常见图片格式</p>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="primary"
              size="large"
              className="upload-btn"
            >
              📁 选择图片文件
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        
        <div className="format-info">
          <h4>💡 推荐图片格式</h4>
          <ul>
            <li>图片分辨率建议 800x800 以上</li>
            <li>文件大小建议不超过 10MB</li>
            <li>图片内容细节丰富、色彩对比明显的图片效果更佳</li>
            <li>避免纯色背景或过于简单的图案</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCropStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>✂️ 裁剪图片</h2>
        <p>调整裁剪区域，制作完美的拼图素材</p>
      </div>
      
      <div className="crop-step">
        <div className="crop-main">
          {uploadedImage && (
            <ImageCropper
              image={uploadedImage}
              aspectRatio={selectedAspectRatio}
              onCropComplete={handleCropComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}
        </div>
        
        <div className="crop-sidebar">
          <div className="aspect-ratio-selector">
            <h3>选择画幅比例</h3>
            <div className="ratio-options">
              <button
                className={`ratio-btn ${selectedAspectRatio === '1:1' ? 'active' : ''}`}
                onClick={() => setSelectedAspectRatio('1:1')}
              >
                <span className="ratio-icon">⬜</span>
                <span className="ratio-label">1:1 正方形</span>
                <span className="ratio-desc">经典拼图比例</span>
              </button>
              <button
                className={`ratio-btn ${selectedAspectRatio === '16:9' ? 'active' : ''}`}
                onClick={() => setSelectedAspectRatio('16:9')}
              >
                <span className="ratio-icon">📺</span>
                <span className="ratio-label">16:9 宽屏</span>
                <span className="ratio-desc">适合风景图片</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>⚙️ 拼图设置</h2>
        <p>设置拼图的难度和拼块形状</p>
      </div>
      
      <div className="settings-step-single">
        <DifficultySettings
          onComplete={handleDifficultySettingsComplete}
          onBack={() => setCurrentStep('crop')}
          onPreviewClick={() => setIsPreviewModalOpen(true)}
          hasPreviewImage={!!customPuzzleConfig.croppedImageData}
        />
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>🎯 拼图预览</h2>
        <p>您的自定义拼图已准备就绪！</p>
      </div>
      
      <div className="preview-step">
        <div className="preview-main">
          <div className="puzzle-summary">
            <div className="summary-image">
              {customPuzzleConfig.croppedImageData && (
                <img
                  src={customPuzzleConfig.croppedImageData}
                  alt={customPuzzleConfig.name}
                  className="final-preview"
                />
              )}
            </div>
            
            <div className="summary-details">
              <h3>📋 拼图信息</h3>
              <div className="detail-item">
                <span className="detail-label">名称:</span>
                <span className="detail-value">{customPuzzleConfig.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">画幅比例:</span>
                <span className="detail-value">{customPuzzleConfig.aspectRatio}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">难度等级:</span>
                <span className="detail-value">
                  {customPuzzleConfig.difficulty === 'easy' && '简单 (3×3)'}
                  {customPuzzleConfig.difficulty === 'medium' && '中等 (4×4)'}
                  {customPuzzleConfig.difficulty === 'hard' && '困难 (5×5)'}
                  {customPuzzleConfig.difficulty === 'expert' && '专家 (6×6)'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">拼块形状:</span>
                <span className="detail-value">
                  {customPuzzleConfig.pieceShape === 'square' && '⬜ 方形'}
                  {customPuzzleConfig.pieceShape === 'triangle' && '🔺 三角形'}
                  {customPuzzleConfig.pieceShape === 'irregular' && '🧩 异形'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="preview-actions">
            <div className="navigation-group">
              <Button
                onClick={() => setCurrentStep('settings')}
                variant="secondary"
                size="medium"
              >
                ← 返回设置
              </Button>
              
              <Button
                onClick={handleRestart}
                variant="secondary"
                size="medium"
              >
                🔄 重新开始
              </Button>
            </div>
          </div>
        </div>
        
        <div className="preview-sidebar">
          <div className="action-group">
            <Button
              onClick={handleStartGame}
              variant="primary"
              size="large"
              className="start-game-btn"
            >
              🎮 开始游戏
            </Button>
            
            <Button
              onClick={handleSavePuzzle}
              variant="secondary"
              size="large"
              className="save-btn"
            >
              💾 保存拼图
            </Button>
            
            <Button
              onClick={handleSharePuzzle}
              variant="secondary"
              size="large"
              className="share-btn"
            >
              🔗 分享拼图
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const getStepProgress = () => {
    const steps = ['upload', 'crop', 'settings', 'preview'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <div className="puzzle-editor">
      <div className="editor-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>🎨 拼图编辑器</h1>
        </div>
        
        <div className="header-progress">
          <div className="progress-indicator">
            <span className="progress-text">步骤 {getStepProgress()}/4</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(getStepProgress() / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="editor-content">
              {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'crop' && renderCropStep()}
      {currentStep === 'settings' && renderSettingsStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      
      {/* 预览模态框 */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageSrc={customPuzzleConfig.croppedImageData || ''}
        imageTitle={`${customPuzzleConfig.name} - 拼图预览`}
        showPuzzleGrid={true}
        gridSize={customPuzzleConfig.difficulty === 'easy' ? '3x3' : 
                  customPuzzleConfig.difficulty === 'medium' ? '4x4' :
                  customPuzzleConfig.difficulty === 'hard' ? '5x5' : '6x6'}
      />
      </div>
    </div>
  );
};
