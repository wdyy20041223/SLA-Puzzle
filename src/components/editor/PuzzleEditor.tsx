import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../common/Button';
import { ImageCropper } from './ImageCropper';
import { DifficultySettings } from './DifficultySettings';
import { PreviewModal } from './PreviewModal';
import { DifficultyLevel, PieceShape } from '../../types';
import './PuzzleEditor.css';

import { PuzzleConfig } from '../../types';

interface PuzzleEditorProps {
  onBackToMenu: () => void;
  onStartGame?: (config: PuzzleConfig) => void;
  onOpenLocalImageEditorConfig?: () => void;
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

export const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ onBackToMenu, onStartGame, onOpenLocalImageEditorConfig }) => {
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
  // 新增：用于实时记录设置页的难度和形状选择
  const [tempDifficulty, setTempDifficulty] = useState<DifficultyLevel>('medium');
  const [tempPieceShape, setTempPieceShape] = useState<PieceShape>('square');
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

  // 传递给 DifficultySettings 的回调，确认时才写入主配置
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

  // 新增：用于 DifficultySettings 实时同步选择
  const handleTempDifficultyChange = useCallback((difficulty: DifficultyLevel) => {
    setTempDifficulty(difficulty);
  }, []);
  const handleTempPieceShapeChange = useCallback((shape: PieceShape) => {
    setTempPieceShape(shape);
  }, []);

  const handleSavePuzzle = useCallback(() => {
    if (!customPuzzleConfig.croppedImageData || !customPuzzleConfig.name) {
      alert('请先完成拼图设置并裁剪图片！');
      return;
    }
    // 构造存档对象
    const archive = {
      id: Date.now(),
      name: customPuzzleConfig.name,
      difficulty: customPuzzleConfig.difficulty,
      pieceShape: customPuzzleConfig.pieceShape,
      aspectRatio: customPuzzleConfig.aspectRatio,
      image: customPuzzleConfig.croppedImageData,
      savedAt: new Date().toLocaleString(),
    };
    // 读取已有存档
    const archives = JSON.parse(localStorage.getItem('puzzle_editor_archives') || '[]');
    archives.unshift(archive); // 新存档放最前
    localStorage.setItem('puzzle_editor_archives', JSON.stringify(archives));
    // 通知主App切换到本地图片编辑器配置页面
    if (typeof onOpenLocalImageEditorConfig === 'function') {
      onOpenLocalImageEditorConfig();
    }
  }, [customPuzzleConfig, onOpenLocalImageEditorConfig]);

  const handleSharePuzzle = useCallback(() => {
    // 这里是预留功能，暂时只显示提示
    alert('分享功能正在开发中！将来可以导出配置文件或生成分享链接。');
    console.log('分享拼图配置:', customPuzzleConfig);
  }, [customPuzzleConfig]);

  const handleStartGame = useCallback(async () => {
    if (!customPuzzleConfig.croppedImageData || !customPuzzleConfig.name) {
      alert('请先完成拼图设置并裁剪图片！');
      return;
    }
    // 生成PuzzleConfig
    const gridSize =
      customPuzzleConfig.difficulty === 'easy' ? { rows: 3, cols: 3 } :
      customPuzzleConfig.difficulty === 'medium' ? { rows: 4, cols: 4 } :
      customPuzzleConfig.difficulty === 'hard' ? { rows: 5, cols: 5 } :
      { rows: 6, cols: 6 };
    try {
      const { PuzzleGenerator } = await import('../../utils/puzzleGenerator');
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: customPuzzleConfig.croppedImageData,
        gridSize,
        pieceShape: customPuzzleConfig.pieceShape,
        name: customPuzzleConfig.name || '自定义拼图',
      });
      if (typeof onStartGame === 'function') {
        onStartGame(puzzleConfig);
      }
    } catch (e) {
      alert('生成拼图失败！');
      console.error(e);
    }
  }, [customPuzzleConfig, onStartGame]);

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
          // 新增：传递当前选择和变更回调
          selectedDifficulty={tempDifficulty}
          selectedShape={tempPieceShape}
          onDifficultyChange={handleTempDifficultyChange}
          onShapeChange={handleTempPieceShapeChange}
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
      
      {/* 预览模态框：设置页时用实时选择，否则用主配置 */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageSrc={customPuzzleConfig.croppedImageData || ''}
        imageTitle={`${customPuzzleConfig.name} - 拼图预览`}
        showPuzzleGrid={true}
        gridSize={
          currentStep === 'settings'
            ? (tempDifficulty === 'easy' ? '3x3' : tempDifficulty === 'medium' ? '4x4' : tempDifficulty === 'hard' ? '5x5' : '6x6')
            : (customPuzzleConfig.difficulty === 'easy' ? '3x3' : customPuzzleConfig.difficulty === 'medium' ? '4x4' : customPuzzleConfig.difficulty === 'hard' ? '5x5' : '6x6')
        }
      />
      </div>
    </div>
  );
};
