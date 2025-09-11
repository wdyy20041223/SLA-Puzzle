// 简单测试脚本，用于验证diagnose-full.js的修改是否成功

// 导入诊断工具的部分功能
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// 读取diagnose-full.js文件内容
const diagnoseContent = readFileSync(join(__dirname, 'diagnose-full.js'), 'utf8');

// 检查是否包含模拟模块定义
console.log('检查诊断工具修改结果:');
console.log('-----------------------------------');

// 检查是否移除了require导入语句
const hasRequireStatements = diagnoseContent.includes("require('./src/types')") || 
                           diagnoseContent.includes("require('./src/utils/rewardSystem')") ||
                           diagnoseContent.includes("require('./src/utils/puzzleGenerator')") ||
                           diagnoseContent.includes("require('./src/utils/experienceSystem')");

// 检查是否添加了模拟模块
const hasMockModules = diagnoseContent.includes('const mockModules = {') && 
                     diagnoseContent.includes('// 模拟奖励系统') &&
                     diagnoseContent.includes('// 模拟经验值系统');

console.log(`✓ 是否移除了外部模块导入: ${!hasRequireStatements}`);
console.log(`✓ 是否添加了模拟模块: ${hasMockModules}`);

console.log('\n测试完成！');
console.log('-----------------------------------');
if (!hasRequireStatements && hasMockModules) {
  console.log('✅ diagnose-full.js文件已成功修改为完全独立的JavaScript实现！');
} else {
  console.log('❌ diagnose-full.js文件修改不完整，请检查。');
}