// 重定向到 apiService - 确保所有数据交互都通过API进行
// 不再使用 localStorage，所有数据都通过数据库操作

import { apiService } from './apiService';

export interface CloudStorageResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 云存储服务 - 完全基于API的数据操作
class CloudStorageService {
  
  // 获取用户数据 - 只从API获取
  async getUsers(): Promise<CloudStorageResponse<any[]>> {
    try {
      const response = await apiService.getUserProfile();
      if (response.success && response.data) {
        return {
          success: true,
          data: [response.data.user],
        };
      }
      return {
        success: false,
        error: response.error || '获取用户数据失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 保存用户数据 - 只通过API保存
  async saveUsers(users: any[]): Promise<CloudStorageResponse<any[]>> {
    if (!users.length) {
      return { success: false, error: '没有用户数据需要保存' };
    }

    try {
      const user = users[0];
      const response = await apiService.updateUserProfile({
        avatar: user.avatar,
        avatarFrame: user.avatarFrame,
        coins: user.coins,
        experience: user.experience,
        level: user.level,
        totalScore: user.totalScore,
        gamesCompleted: user.gamesCompleted,
        ownedItems: user.ownedItems,
        achievements: user.achievements,
        bestTimes: user.bestTimes,
      });
      
      if (response.success) {
        return { success: true, data: users };
      }
      
      return {
        success: false,
        error: response.error || '保存用户数据失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 添加用户 - 通过注册API
  async addUser(user: any): Promise<CloudStorageResponse<any[]>> {
    try {
      const response = await apiService.register({
        username: user.username,
        password: user.password,
        confirmPassword: user.password,
      });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: [response.data.user],
        };
      }
      
      return {
        success: false,
        error: response.error || '注册失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 更新用户 - 通过API更新
  async updateUser(userId: string, updateData: Partial<any>): Promise<CloudStorageResponse<any[]>> {
    try {
      const response = await apiService.updateUserProfile(updateData);
      
      if (response.success) {
        // 获取更新后的用户数据
        const userResponse = await apiService.getUserProfile();
        if (userResponse.success && userResponse.data) {
          return {
            success: true,
            data: [userResponse.data.user],
          };
        }
      }
      
      return {
        success: false,
        error: response.error || '更新用户数据失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 验证用户 - 通过登录API
  async validateUser(username: string, password: string): Promise<CloudStorageResponse<any>> {
    try {
      const response = await apiService.login({ username, password });
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.user,
        };
      }
      return {
        success: false,
        error: response.error || '登录失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 检查用户名是否存在 - 这个功能需要后端提供专门的API
  async checkUsernameExists(username: string): Promise<CloudStorageResponse<boolean>> {
    try {
      // 注意：这里需要后端提供专门的检查用户名API，而不是尝试注册
      // 暂时返回false，表示用户名可用
      console.warn('checkUsernameExists: 需要后端提供专门的用户名检查API');
      return { success: true, data: false };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  // 同步本地到云端 - 不再需要，所有数据都在云端
  async syncLocalToCloud(): Promise<CloudStorageResponse<any[]>> {
    try {
      const response = await apiService.getUserProfile();
      if (response.success && response.data) {
        return {
          success: true,
          data: [response.data.user],
        };
      }
      return {
        success: false,
        error: response.error || '同步失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }
}

export const cloudStorage = new CloudStorageService();
