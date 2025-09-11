import React from 'react';

interface SavedPuzzle {
  id: string;
  name: string;
  data: any;
  date: string;
}

const getSavedPuzzles = (): SavedPuzzle[] => {
  const data = localStorage.getItem('savedPuzzles');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const cardShadow = '0 4px 16px 0 rgba(0,0,0,0.08), 0 1.5px 4px 0 rgba(0,0,0,0.06)';


import { useState } from 'react';

interface SavedPuzzlesPageProps {
  onBackToMenu?: () => void;
  onOpenEditor?: (step: 'upload' | 'crop' | 'settings' | 'preview') => void;
}

const SavedPuzzlesPage: React.FC<SavedPuzzlesPageProps> = ({ onBackToMenu, onOpenEditor }) => {
  const [puzzles, setPuzzles] = useState(getSavedPuzzles());

  // 删除存档
  const handleDelete = (id: string) => {
    const filtered = puzzles.filter(p => p.id !== id);
    setPuzzles(filtered);
    localStorage.setItem('savedPuzzles', JSON.stringify(filtered));
  };

  // 返回菜单
  const handleBack = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      // 兼容直接页面跳转（如刷新后）
      window.location.reload();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 48,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 32,
          color: '#2d3748',
          letterSpacing: 2,
        }}>🗂️ 本地拼图编辑器配置</h2>
        <button
          onClick={handleBack}
          style={{
            marginBottom: 32,
            background: 'linear-gradient(90deg,#60a5fa,#38bdf8)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
          }}
        >
          ← 返回菜单
        </button>
        {puzzles.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 16,
            boxShadow: cardShadow,
            padding: '48px 0',
            width: '100%',
            textAlign: 'center',
            color: '#888',
            fontSize: 18,
          }}>
            暂无存档
          </div>
        ) : (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}>
            {puzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: cardShadow,
                  padding: '28px 36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 28,
                  minHeight: 100,
                  position: 'relative',
                }}
              >
                {puzzle.data?.croppedImageData ? (
                  <img
                    src={puzzle.data.croppedImageData}
                    alt={puzzle.name}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                      background: '#f3f3f3',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a0aec0',
                    fontSize: 32,
                  }}>🧩</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 20,
                    color: '#374151',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{puzzle.name}</div>
                  <div style={{
                    fontSize: 14,
                    color: '#718096',
                  }}>{puzzle.date}</div>
                  {/* 拼图信息 */}
                  <div style={{
                    fontSize: 13,
                    color: '#374151',
                    marginTop: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    lineHeight: 1.1,
                  }}>
                    <span>难度：{puzzle.data?.difficulty || '未知'}</span>
                    <span>形状：{puzzle.data?.pieceShape || '未知'}</span>
                    <span>
                      拼图块数：{
                        (() => {
                          // 通过难度和形状推断块数，或直接显示配置
                          const d = puzzle.data?.difficulty;
                          if (puzzle.data?.gridSize) {
                            // gridSize: {rows, cols}
                            return `${puzzle.data.gridSize.rows * puzzle.data.gridSize.cols} (${puzzle.data.gridSize.rows}x${puzzle.data.gridSize.cols})`;
                          }
                          if (d === 'easy') return '9 (3x3)';
                          if (d === 'medium') return '16 (4x4)';
                          if (d === 'hard') return '25 (5x5)';
                          if (d === 'expert') return '36 (6x6)';
                          return '未知';
                        })()
                      }
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(puzzle.id)}
                  style={{
                    background: 'linear-gradient(90deg,#f87171,#fbbf24)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginLeft: 8,
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                    transition: 'background 0.2s',
                  }}
                  title="删除此存档"
                >
                  删除存档
                </button>
                <button
                  onClick={() => {
                    if (onOpenEditor) {
                      onOpenEditor('settings');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(90deg,#38bdf8,#60a5fa)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginLeft: 8,
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                    transition: 'background 0.2s',
                  }}
                  title="打开拼图编辑器"
                >
                  打开拼图编辑器
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPuzzlesPage;
