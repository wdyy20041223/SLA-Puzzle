/**
 * 云端登录测试文件
 * 用于测试云端登录时每日挑战功能是否正常
 */

import { cloudStorage } from '../services/cloudStorage';

// 测试云端用户数据初始化
export async function testCloudUserInitialization() {
  console.log('开始测试云端用户数据初始化...');
  
  try {
    // 创建测试用户
    const testUser = {
      id: 'test-user-001',
      username: 'testuser',
      password: 'testpass123',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      coins: 100,
      experience: 0,
      level: 1,
      gamesCompleted: 0,
      achievements: [],
      dailyStreak: 0,
      challengeHistory: []
    };
    
    // 添加用户到云存储
    const addResponse = await cloudStorage.addUser(testUser);
    console.log('添加用户结果:', addResponse);
    
    if (!addResponse.success) {
      console.error('添加用户失败:', addResponse.error);
      return false;
    }
    
    // 验证用户登录
    const loginResponse = await cloudStorage.validateUser('testuser', 'testpass123');
    console.log('用户登录验证结果:', loginResponse);
    
    if (!loginResponse.success) {
      console.error('用户登录验证失败:', loginResponse.error);
      return false;
    }
    
    // 获取用户数据
    const usersResponse = await cloudStorage.getUsers();
    console.log('获取用户数据结果:', usersResponse);
    
    if (!usersResponse.success) {
      console.error('获取用户数据失败:', usersResponse.error);
      return false;
    }
    
    const users = usersResponse.data || [];
    const user = users.find((u: any) => u.username === 'testuser');
    
    if (!user) {
      console.error('未找到测试用户');
      return false;
    }
    
    console.log('测试用户数据:', user);
    
    // 验证用户数据结构
    const requiredFields = ['id', 'username', 'coins', 'experience', 'dailyStreak', 'challengeHistory'];
    for (const field of requiredFields) {
      if (!(field in user)) {
        console.error(`用户数据缺少必要字段: ${field}`);
        return false;
      }
    }
    
    console.log('云端用户数据初始化测试通过');
    return true;
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return false;
  }
}

// 测试每日挑战数据更新
export async function testDailyChallengeUpdate() {
  console.log('开始测试每日挑战数据更新...');
  
  try {
    // 获取用户数据
    const usersResponse = await cloudStorage.getUsers();
    if (!usersResponse.success) {
      console.error('获取用户数据失败:', usersResponse.error);
      return false;
    }
    
    const users = usersResponse.data || [];
    const userIndex = users.findIndex((u: any) => u.username === 'testuser');
    
    if (userIndex === -1) {
      console.error('未找到测试用户');
      return false;
    }
    
    const user = users[userIndex];
    const today = new Date().toISOString().split('T')[0];
    
    // 模拟完成一个挑战
    const challengeRecord = {
      id: `daily-${today}-0`,
      date: today,
      title: '测试挑战',
      description: '测试挑战描述',
      difficulty: 'easy',
      puzzleImage: '/test/image.png',
      gridSize: '3x3',
      time: 120,
      moves: 15,
      completed: true,
      isPerfect: true,
      attempts: 1
    };
    
    // 更新用户挑战历史
    if (!user.challengeHistory) {
      user.challengeHistory = [];
    }
    
    user.challengeHistory.push(challengeRecord);
    user.dailyStreak = (user.dailyStreak || 0) + 1;
    user.coins += 50; // 完成奖励
    user.experience += 30; // 经验奖励
    
    // 保存更新后的用户数据
    users[userIndex] = user;
    const saveResponse = await cloudStorage.saveUsers(users);
    
    console.log('保存用户数据结果:', saveResponse);
    
    if (!saveResponse.success) {
      console.error('保存用户数据失败:', saveResponse.error);
      return false;
    }
    
    console.log('每日挑战数据更新测试通过');
    return true;
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return false;
  }
}

// 运行所有测试
export async function runAllTests() {
  console.log('开始运行云端登录相关测试...');
  
  const test1Result = await testCloudUserInitialization();
  const test2Result = await testDailyChallengeUpdate();
  
  console.log('\n测试结果汇总:');
  console.log('云端用户数据初始化:', test1Result ? '通过' : '失败');
  console.log('每日挑战数据更新:', test2Result ? '通过' : '失败');
  
  if (test1Result && test2Result) {
    console.log('\n所有测试通过！云端登录时每日挑战功能应该可以正常工作。');
    return true;
  } else {
    console.log('\n部分测试失败，请检查相关代码。');
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (typeof window === 'undefined') {
  runAllTests().then(success => {
    if (success) {
      console.log('测试完成');
    } else {
      console.error('测试失败');
    }
  });
}