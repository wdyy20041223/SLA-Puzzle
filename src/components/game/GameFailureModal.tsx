import React from 'react';
import { Button } from '../common/Button';
import './GameFailureModal.css';

interface GameFailureModalProps {
  isVisible: boolean;
  onTryAgain: () => void;
  onBackToMenu: () => void;
  failureReason: string;
}

export const GameFailureModal: React.FC<GameFailureModalProps> = ({
  isVisible,
  onTryAgain,
  onBackToMenu,
  failureReason,
}) => {
  if (!isVisible) return null;

  return (
    <div className="game-failure-modal-overlay">
      <div className="game-failure-modal">
        <div className="modal-header">
          <h2 className="modal-title">挑战失败</h2>
          <div className="failure-icon">❌</div>
        </div>

        <div className="modal-body">
          <div className="failure-reason">
            <p className="reason-text">{failureReason}</p>
          </div>

          <div className="failure-tips">
            <h3>💡 提示</h3>
            <ul>
              <li>仔细观察拼图块的形状和图案</li>
              <li>注意拼图块的旋转和翻转状态</li>
              <li>可以查看答案来学习正确的位置</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <Button
            onClick={onTryAgain}
            variant="secondary"
            size="medium"
          >
            再试一次
          </Button>
          <Button
            onClick={onBackToMenu}
            variant="primary"
            size="medium"
          >
            返回菜单
          </Button>
        </div>
      </div>
    </div>
  );
};
