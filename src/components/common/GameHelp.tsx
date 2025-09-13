import React, { useState } from 'react';
import { Button } from './Button';
import './GameHelp.css';
import { createPortal } from 'react-dom';

interface GameHelpProps {
  onClose?: () => void;
}

export const GameHelp: React.FC<GameHelpProps> = ({ onClose }) => {
  return createPortal(
    <div className="game-help-modal">
      <div className="help-content">
        <div className="help-header">
          <h2>🧩 游戏帮助</h2>
          {onClose && (
            <Button onClick={onClose} variant="secondary" size="small">
              ×
            </Button>
          )}
        </div>

        <div className="help-body">
          <section className="help-section">
            <h3>🎯 游戏目标</h3>
            <p>将左侧的拼图块正确放置到右侧答题卡的对应位置，完成整幅图片的拼接。</p>
          </section>

          <section className="help-section">
            <h3>🎮 操作方法</h3>
            <div className="operation-list">
              <div className="operation-item">
                <span className="step">1</span>
                <div>
                  <strong>选择拼图块</strong>
                  <p>点击或拖拽左侧处理区的拼图块进行选择</p>
                </div>
              </div>
              <div className="operation-item">
                <span className="step">2</span>
                <div>
                  <strong>放置拼图块</strong>
                  <p>选中拼图块后，点击右侧答题卡的空白槽位，或拖拽到空白位置，这只计1步操作</p>
                </div>
              </div>
              <div className="operation-item">
                <span className="step">3</span>
                <div>
                  <strong>替换拼图块</strong>
                  <p>向已放置的拼图块的目标槽位放置新的拼图块，会将旧的拼图块替换出去，这只计1步操作</p>
                </div>
              </div>
              <div className="operation-item">
                <span className="step">4</span>
                <div>
                  <strong>移除拼图块</strong>
                  <p>点击已选中的已放置拼图块，将其移回处理区，这只计1步操作</p>
                </div>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>⌨️ 快捷键</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>R</kbd> <span>旋转当前选中拼图块</span>
              </div>
              <div className="shortcut-item">
                <kbd>F</kbd> <span>翻转当前拼图块</span>
              </div>
              <div className="shortcut-item">
                <kbd>H</kbd> <span>显示提示（高亮正确位置）</span>
              </div>
              <div className="shortcut-item">
                <kbd>ESC</kbd> <span>取消选中当前拼图</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+Z</kbd> <span>撤销上一步操作</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+S</kbd> <span>保存游戏进度</span>
              </div>
              <div className="shortcut-item">
                <kbd>A</kbd> <span>显示答案</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>💡 游戏技巧</h3>
            <ul className="tips-list">
              <li>观察右侧答题卡的背景预览图，帮助判断拼图块位置</li>
              <li>拼图块编号对应其在原图中的位置（从左到右，从上到下）</li>
              <li>绿色勾号表示放置正确，红色叉号表示放置错误</li>
              <li>善用撤销功能纠正错误操作</li>
              <li>从边缘和角落的拼图块开始拼接更容易</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>🏆 难度等级</h3>
            <div className="difficulty-list">
              <div className="difficulty-item easy">
                <strong>简单 (3×3)</strong> - 9块拼图，适合新手
              </div>
              <div className="difficulty-item medium">
                <strong>中等 (4×4)</strong> - 16块拼图，适度挑战
              </div>
              <div className="difficulty-item hard">
                <strong>困难 (5×5)</strong> - 25块拼图，需要耐心
              </div>
              <div className="difficulty-item expert">
                <strong>专家 (6×6)</strong> - 36块拼图，终极挑战
              </div>
            </div>
          </section>
        </div>

        {onClose && (
          <div className="help-footer">
            <Button onClick={onClose} variant="primary">
              关闭
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export const GameHelpButton: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowHelp(true)} 
        variant="secondary" 
        size="small"
        className="help-button"
      >
        ❓ 帮助
      </Button>
      
      {showHelp && (
        <GameHelp onClose={() => setShowHelp(false)} />
      )}
    </>
  );
};