/**
 * 管中窥豹特效测试脚本（更新版）
 * 验证特效逻辑是否正确实现 - 拼图块供应限制与动态补充
 */

// 模拟管中窥豹特效的初始化逻辑
function initializePartialEffectNew(totalPieces) {
    console.log(`🔍 初始化管中窥豹特效 - 总拼图块数: ${totalPieces}`);
    
    const halfCount = Math.floor(totalPieces / 2);
    const allPieceIds = Array.from({ length: totalPieces }, (_, i) => `piece_${i + 1}`);
    const shuffled = [...allPieceIds].sort(() => Math.random() - 0.5);
    
    const initialAvailable = shuffled.slice(0, halfCount);
    const remaining = shuffled.slice(halfCount);
    
    console.log(`初始可用拼图块数: ${halfCount}`);
    console.log(`剩余待补充拼图块数: ${remaining.length}`);
    console.log(`初始可用拼图块:`, initialAvailable);
    console.log(`待补充拼图块:`, remaining);
    
    return {
        availablePieces: new Set(initialAvailable),
        remainingPieces: remaining
    };
}

// 模拟正确放置后的补充机制
function correctPlacementSupplement(gameState, correctPieceId) {
    console.log(`✅ 正确放置拼图块: ${correctPieceId}`);
    
    if (gameState.remainingPieces.length > 0) {
        const nextPieceId = gameState.remainingPieces.shift();
        gameState.availablePieces.add(nextPieceId);
        
        console.log(`🎆 补充新拼图块: ${nextPieceId}`);
        console.log(`剩余待补充: ${gameState.remainingPieces.length}个`);
        console.log(`当前可用: ${gameState.availablePieces.size}个`);
    } else {
        console.log('ℹ️ 没有更多拼图块可补充');
    }
    
    return gameState;
}

// 模拟拼图块可用性检查
function isPieceAvailable(pieceId, hasPartialEffect, availablePieces) {
    if (hasPartialEffect && availablePieces) {
        return availablePieces.has(pieceId);
    }
    return true;
}

// 测试不同拼图大小的管中窥豹特效
function testPartialEffectNew() {
    console.log('='.repeat(60));
    console.log('🧪 管中窥豹特效测试开始（更新版）');
    console.log('='.repeat(60));
    
    // 测试各种拼图大小
    const puzzleSizes = [
        { name: '3×3拼图', pieces: 9 },
        { name: '4×4拼图', pieces: 16 },
        { name: '5×5拼图', pieces: 25 },
        { name: '3×4拼图', pieces: 12 }
    ];
    
    puzzleSizes.forEach(({ name, pieces }) => {
        console.log('\n' + '-'.repeat(40));
        console.log(`🎯 测试 ${name} (${pieces}块)`);
        
        const gameState = initializePartialEffectNew(pieces);
        
        // 模拟游戏过程
        console.log('\n🎮 游戏流程模拟:');
        let currentState = {
            availablePieces: new Set(gameState.availablePieces),
            remainingPieces: [...gameState.remainingPieces]
        };
        
        // 模拟正确放置3个拼图块
        for (let i = 1; i <= Math.min(3, pieces); i++) {
            const availableArray = Array.from(currentState.availablePieces);
            if (availableArray.length > 0) {
                const pieceToPlace = availableArray[0];
                currentState.availablePieces.delete(pieceToPlace);
                console.log(`\n步骤 ${i}: 放置拼图块 ${pieceToPlace}`);
                currentState = correctPlacementSupplement(currentState, pieceToPlace);
            }
        }
        
        console.log(`\n📊 最终状态: 可用${currentState.availablePieces.size}个, 待补充${currentState.remainingPieces.length}个`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ 特效规范验证（更新版）');
    console.log('='.repeat(60));
    
    // 验证特效规范
    const effects = [
        { id: 'partial', name: '管中窥豹', stars: 3 },
        { id: '管中窥豹', name: '管中窥豹', stars: 3 }
    ];
    
    effects.forEach(effect => {
        console.log(`\n📋 特效: ${effect.name}`);
        console.log(`   ID: ${effect.id}`);
        console.log(`   星级: ${effect.stars}星`);
        console.log(`   描述: 初始只提供一半数量的拼图块，正确放置后自动补充`);
        console.log(`   实现: 随机选择${Math.floor(9/2)}个初始可用（以3×3为例）`);
    });
    
    console.log('\n✅ 管中窥豹特效测试完成！');
}

// 特效兼容性测试（更新版）
function testEffectCompatibilityNew() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 特效兼容性测试（更新版）');
    console.log('='.repeat(60));
    
    // 模拟同时使用管中窥豹和作茧自缚特效
    const gameState1 = initializePartialEffectNew(9); // 3x3拼图
    const cornerSlots = new Set([0, 2, 6, 8]); // 作茧自缚的角落槽位
    
    console.log('管中窥豹可用拼图块:', Array.from(gameState1.availablePieces));
    console.log('作茧自缚角落槽位:', Array.from(cornerSlots));
    
    // 模拟拼图块可用性检查
    console.log('\n拼图块可用性测试:');
    gameState1.availablePieces.forEach(pieceId => {
        const canUsePartial = isPieceAvailable(pieceId, true, gameState1.availablePieces);
        console.log(`${pieceId}: 管中窥豹=${canUsePartial ? '✅' : '❌'}`);
    });
    
    const hiddenPieces = gameState1.remainingPieces.slice(0, 3);
    console.log('\n隐藏拼图块可用性测试:');
    hiddenPieces.forEach(pieceId => {
        const canUsePartial = isPieceAvailable(pieceId, true, gameState1.availablePieces);
        console.log(`${pieceId}: 管中窥豹=${canUsePartial ? '✅' : '❌'}`);
    });
}

// 运行测试
testPartialEffectNew();
testEffectCompatibilityNew();

// 导出测试函数（如果在Node.js环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePartialEffectNew,
        correctPlacementSupplement,
        isPieceAvailable,
        testPartialEffectNew,
        testEffectCompatibilityNew
    };
}