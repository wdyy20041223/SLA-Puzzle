// 测试俄罗斯方块拼图生成的脚本
import { PuzzleGenerator } from './src/utils/puzzleGenerator.ts';

async function testTetrisPuzzle() {
    try {
        console.log('开始测试俄罗斯方块拼图生成...');

        // 使用测试图片
        const imageData = './test.jpg'; // 确保有这个测试图片

        // 生成3x3俄罗斯方块拼图
        const puzzleConfig = await PuzzleGenerator.generatePuzzle({
            imageData,
            gridSize: { rows: 3, cols: 3 },
            pieceShape: 'tetris',
            name: '测试俄罗斯方块拼图',
        });

        console.log('3x3 俄罗斯方块拼图生成成功：');
        console.log(`拼图名称: ${puzzleConfig.name}`);
        console.log(`拼图块数量: ${puzzleConfig.pieces.length}`);
        console.log(`网格大小: ${puzzleConfig.gridSize.rows}x${puzzleConfig.gridSize.cols}`);
        console.log(`难度: ${puzzleConfig.difficulty}`);

        // 显示每个拼图块的信息
        puzzleConfig.pieces.forEach((piece, index) => {
            console.log(`拼图块 ${index + 1}:`);
            console.log(`  ID: ${piece.id}`);
            console.log(`  俄罗斯方块形状: ${piece.tetrisShape}`);
            console.log(`  占用位置:`, piece.occupiedPositions);
            console.log(`  正确槽位:`, piece.correctSlots);
            console.log(`  尺寸: ${piece.width}x${piece.height}`);
            console.log(`  单元格图像数量: ${piece.cellImages ? Object.keys(piece.cellImages).length : 0}`);
        });

        // 验证俄罗斯方块布局
        const totalCells = puzzleConfig.gridSize.rows * puzzleConfig.gridSize.cols;
        let occupiedCells = new Set();

        puzzleConfig.pieces.forEach(piece => {
            if (piece.occupiedPositions) {
                piece.occupiedPositions.forEach(([row, col]) => {
                    const cellIndex = row * puzzleConfig.gridSize.cols + col;
                    if (occupiedCells.has(cellIndex)) {
                        console.error(`错误：格子 ${row},${col} (索引 ${cellIndex}) 被重复占用！`);
                    }
                    occupiedCells.add(cellIndex);
                });
            }
        });

        if (occupiedCells.size === totalCells) {
            console.log('✅ 俄罗斯方块布局验证通过：所有格子都被正确占用');
        } else {
            console.error(`❌ 俄罗斯方块布局验证失败：期望占用${totalCells}个格子，实际占用${occupiedCells.size}个格子`);
        }

    } catch (error) {
        console.error('测试俄罗斯方块拼图失败：', error);
        console.error('错误堆栈：', error.stack);
    }
}

// 运行测试
testTetrisPuzzle();
