// 错误格式化工具测试脚本
// 这个测试文件完全独立，不依赖任何外部模块

// 定义ValidationErrorDetail接口
class ValidationErrorDetail {
  constructor(field, message, value) {
    this.field = field;
    this.message = message;
    this.value = value;
  }
}

// 实现错误格式化工具的所有函数
function getFieldDisplayName(field) {
  const fieldNames = {
    username: '用户名',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    avatar: '头像',
    avatarFrame: '头像框',
    coins: '金币',
    experience: '经验值',
    puzzleName: '拼图名称',
    difficulty: '难度',
    pieceShape: '拼图形状',
    gridSize: '网格大小',
    totalPieces: '拼图块数量',
    completionTime: '完成时间',
    moves: '移动次数',
    coinsEarned: '获得金币',
    experienceEarned: '获得经验',
    achievementId: '成就ID',
    progress: '进度',
    page: '页码',
    limit: '每页数量',
    sortBy: '排序字段',
  };

  return fieldNames[field] || field;
}

/**
 * 格式化验证错误信息
 */
function formatValidationErrors(details) {
  if (!details || !Array.isArray(details)) {
    return '输入数据有误，请检查后重试';
  }

  const errorMessages = details.map(error => {
    const fieldName = getFieldDisplayName(error.field);
    return `${fieldName}: ${error.message}`;
  });

  return errorMessages.join('\n');
}

/**
 * 格式化API错误信息
 */
function formatApiError(error, code, details) {
  // 如果是验证错误，格式化详细信息
  if (code === 'VALIDATION_ERROR' && details) {
    return formatValidationErrors(details);
  }

  // 其他常见错误的中文化
  const errorMessages = {
    'USER_ALREADY_EXISTS': '用户名或邮箱已被使用',
    'INVALID_CREDENTIALS': '用户名或密码错误',
    'UNAUTHORIZED': '未授权访问，请先登录',
    'FORBIDDEN': '禁止访问',
    'NOT_FOUND': '资源未找到',
    'DUPLICATE_ENTRY': '数据重复，该记录已存在',
    'FOREIGN_KEY_ERROR': '引用的数据不存在',
    'DATABASE_CONNECTION_ERROR': '数据库连接失败，请稍后重试',
    'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后重试',
    'NETWORK_ERROR': '网络连接失败，请检查网络后重试',
  };

  return errorMessages[code || ''] || error || '操作失败，请稍后重试';
}

// 测试函数
function runTests() {
  console.log('\n====================================');
  console.log('      🛠️  错误格式化工具测试       ');
  console.log('====================================\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // 测试1: 测试字段显示名称转换
  function testGetFieldDisplayName() {
    console.log('\n🔍 测试1: 测试字段显示名称转换');
    const testCases = [
      { input: 'username', expected: '用户名' },
      { input: 'email', expected: '邮箱' },
      { input: 'password', expected: '密码' },
      { input: 'puzzleName', expected: '拼图名称' },
      { input: 'difficulty', expected: '难度' },
      { input: 'nonExistentField', expected: 'nonExistentField' } // 不存在的字段应返回原名称
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = getFieldDisplayName(test.input);
      console.log(`  测试输入: ${test.input}, 预期: ${test.expected}, 实际: ${result}`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: ${test.input} 的显示名称不匹配`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试1通过: 所有字段显示名称转换正常');
    } else {
      testsFailed++;
      console.error('❌ 测试1失败: 字段显示名称转换存在问题');
    }
  }
  
  // 测试2: 测试验证错误格式化（有效输入）
  function testFormatValidationErrorsValid() {
    console.log('\n🔍 测试2: 测试验证错误格式化（有效输入）');
    
    const validationErrors = [
      { field: 'username', message: '不能为空', value: '' },
      { field: 'password', message: '至少包含6个字符', value: '123' },
      { field: 'email', message: '格式不正确', value: 'invalid-email' }
    ];
    
    const expected = '用户名: 不能为空\n密码: 至少包含6个字符\n邮箱: 格式不正确';
    const result = formatValidationErrors(validationErrors);
    
    console.log(`  预期结果:`);
    console.log(`  ${expected.replace(/\n/g, '\n  ')}`);
    console.log(`  实际结果:`);
    console.log(`  ${result.replace(/\n/g, '\n  ')}`);
    
    if (result === expected) {
      testsPassed++;
      console.log('✅ 测试2通过: 验证错误格式化功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试2失败: 验证错误格式化存在问题');
    }
  }
  
  // 测试3: 测试验证错误格式化（边界条件）
  function testFormatValidationErrorsEdgeCases() {
    console.log('\n🔍 测试3: 测试验证错误格式化（边界条件）');
    
    const testCases = [
      { input: null, expected: '输入数据有误，请检查后重试' },
      { input: undefined, expected: '输入数据有误，请检查后重试' },
      { input: {}, expected: '输入数据有误，请检查后重试' },
      { input: [], expected: '' }, // 空数组应该返回空字符串
      { input: 'not-an-array', expected: '输入数据有误，请检查后重试' }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = formatValidationErrors(test.input);
      console.log(`  测试输入类型: ${typeof test.input}, 预期: "${test.expected}", 实际: "${result}"`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: 输入类型 ${typeof test.input} 的格式化结果不匹配`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试3通过: 验证错误格式化边界条件处理正常');
    } else {
      testsFailed++;
      console.error('❌ 测试3失败: 验证错误格式化边界条件处理存在问题');
    }
  }
  
  // 测试4: 测试API错误格式化（常见错误代码）
  function testFormatApiErrorCommonCodes() {
    console.log('\n🔍 测试4: 测试API错误格式化（常见错误代码）');
    
    const testCases = [
      { code: 'USER_ALREADY_EXISTS', expected: '用户名或邮箱已被使用' },
      { code: 'INVALID_CREDENTIALS', expected: '用户名或密码错误' },
      { code: 'UNAUTHORIZED', expected: '未授权访问，请先登录' },
      { code: 'FORBIDDEN', expected: '禁止访问' },
      { code: 'NOT_FOUND', expected: '资源未找到' },
      { code: 'DUPLICATE_ENTRY', expected: '数据重复，该记录已存在' },
      { code: 'RATE_LIMIT_EXCEEDED', expected: '请求过于频繁，请稍后重试' }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = formatApiError('原始错误信息', test.code);
      console.log(`  错误代码: ${test.code}, 预期: "${test.expected}", 实际: "${result}"`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: 错误代码 ${test.code} 的格式化结果不匹配`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试4通过: API错误格式化（常见错误代码）功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试4失败: API错误格式化（常见错误代码）存在问题');
    }
  }
  
  // 测试5: 测试API错误格式化（验证错误）
  function testFormatApiErrorValidation() {
    console.log('\n🔍 测试5: 测试API错误格式化（验证错误）');
    
    const validationDetails = [
      { field: 'puzzleName', message: '不能为空', value: '' },
      { field: 'difficulty', message: '必须在1-5之间', value: 6 }
    ];
    
    const expected = '拼图名称: 不能为空\n难度: 必须在1-5之间';
    const result = formatApiError('验证失败', 'VALIDATION_ERROR', validationDetails);
    
    console.log(`  预期结果:`);
    console.log(`  ${expected.replace(/\n/g, '\n  ')}`);
    console.log(`  实际结果:`);
    console.log(`  ${result.replace(/\n/g, '\n  ')}`);
    
    if (result === expected) {
      testsPassed++;
      console.log('✅ 测试5通过: API错误格式化（验证错误）功能正常');
    } else {
      testsFailed++;
      console.error('❌ 测试5失败: API错误格式化（验证错误）存在问题');
    }
  }
  
  // 测试6: 测试API错误格式化（边界条件和默认行为）
  function testFormatApiErrorEdgeCases() {
    console.log('\n🔍 测试6: 测试API错误格式化（边界条件和默认行为）');
    
    const testCases = [
      { error: '自定义错误消息', code: null, expected: '自定义错误消息' },
      { error: '自定义错误消息', code: 'UNKNOWN_CODE', expected: '自定义错误消息' },
      { error: null, code: 'UNKNOWN_CODE', expected: '操作失败，请稍后重试' },
      { error: undefined, code: undefined, expected: '操作失败，请稍后重试' },
      { error: '', code: '', expected: '操作失败，请稍后重试' }
    ];
    
    let passed = true;
    
    for (const test of testCases) {
      const result = formatApiError(test.error, test.code);
      console.log(`  错误消息: "${test.error}", 错误代码: "${test.code}", 预期: "${test.expected}", 实际: "${result}"`);
      if (result !== test.expected) {
        passed = false;
        console.error(`  ❌ 测试失败: 边界条件测试失败`);
      }
    }
    
    if (passed) {
      testsPassed++;
      console.log('✅ 测试6通过: API错误格式化边界条件处理正常');
    } else {
      testsFailed++;
      console.error('❌ 测试6失败: API错误格式化边界条件处理存在问题');
    }
  }
  
  // 运行所有测试
  testGetFieldDisplayName();
  testFormatValidationErrorsValid();
  testFormatValidationErrorsEdgeCases();
  testFormatApiErrorCommonCodes();
  testFormatApiErrorValidation();
  testFormatApiErrorEdgeCases();
  
  // 打印测试总结
  console.log('\n====================================');
  console.log(`  测试总结: 共 ${testsPassed + testsFailed} 个测试，通过 ${testsPassed} 个，失败 ${testsFailed} 个`);
  console.log('====================================\n');
  
  return testsFailed === 0;
}

// 运行测试
const success = runTests();
process.exit(success ? 0 : 1);