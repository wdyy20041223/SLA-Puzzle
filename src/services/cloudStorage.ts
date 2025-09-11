export interface CloudStorageResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 增强的云存储服务 - 支持跨设备数据同步
class CloudStorageService {
  private readonly STORAGE_KEY = 'puzzle_users';

  // 生成设备标识
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('puzzle_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('puzzle_device_id', deviceId);
    }
    return deviceId;
  }

  // 获取本地用户数据
  private getLocalUsers(): any[] {
    try {
      const users = localStorage.getItem(this.STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error reading local users:', error);
      return [];
    }
  }

  // 保存本地用户数据
  private saveLocalUsers(users: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
      // 同时保存到一个全局同步存储中，模拟云端数据
      this.saveToGlobalStorage(users);
    } catch (error) {
      console.error('Error saving local users:', error);
    }
  }

  // 模拟云端存储 - 使用sessionStorage作为简单的"云端"
  private saveToGlobalStorage(users: any[]): void {
    try {
      const globalData = {
        users,
        timestamp: Date.now(),
        deviceId: this.getDeviceId(),
      };
      
      // 使用sessionStorage模拟云端，实际应用中这里应该是HTTP请求
      sessionStorage.setItem('puzzle_cloud_data', JSON.stringify(globalData));
      
      // 同时保存到一个跨标签页共享的storage
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('puzzle_sync');
        channel.postMessage({
          type: 'DATA_SYNC',
          data: globalData,
        });
      }
    } catch (error) {
      console.warn('Failed to save to global storage:', error);
    }
  }

  // 从全局存储获取数据
  private getFromGlobalStorage(): any[] {
    try {
      const cloudData = sessionStorage.getItem('puzzle_cloud_data');
      if (cloudData) {
        const parsed = JSON.parse(cloudData);
        return parsed.users || [];
      }
      return [];
    } catch (error) {
      console.warn('Failed to get from global storage:', error);
      return [];
    }
  }

  // 同步数据 - 合并本地和"云端"数据
  private syncData(): any[] {
    const localUsers = this.getLocalUsers();
    const globalUsers = this.getFromGlobalStorage();

    // 简单的合并策略：按用户名去重，保留最新的数据
    const mergedUsers = [...localUsers];
    
    globalUsers.forEach(globalUser => {
      const existingIndex = mergedUsers.findIndex(u => u.username === globalUser.username);
      if (existingIndex === -1) {
        // 新用户，直接添加（确保有新字段）
        mergedUsers.push(this.migrateUserData(globalUser));
      } else {
        // 已存在用户，比较时间戳，保留最新的
        const existing = mergedUsers[existingIndex];
        const globalTime = new Date(globalUser.lastLoginAt || globalUser.createdAt).getTime();
        const localTime = new Date(existing.lastLoginAt || existing.createdAt).getTime();
        
        if (globalTime > localTime) {
          mergedUsers[existingIndex] = this.migrateUserData(globalUser);
        } else {
          mergedUsers[existingIndex] = this.migrateUserData(existing);
        }
      }
    });

    // 确保所有本地用户也被迁移
    for (let i = 0; i < mergedUsers.length; i++) {
      mergedUsers[i] = this.migrateUserData(mergedUsers[i]);
    }

    // 保存合并后的数据
    this.saveLocalUsers(mergedUsers);
    
    return mergedUsers;
  }

  // 迁移用户数据，添加新字段
  private migrateUserData(user: any): any {
    return {
      ...user,
      experience: user.experience ?? 0,
      coins: user.coins ?? 100, // 如果没有金币字段，给默认值100
      achievements: user.achievements ?? [], // 如果没有成就字段，给空数组
      bestTimes: user.bestTimes ?? {}, // 如果没有最佳时间字段，给空对象
      dailyStreak: user.dailyStreak ?? 0, // 如果没有连击天数字段，给默认值0
      challengeHistory: user.challengeHistory ?? [], // 如果没有挑战历史字段，给空数组
      lastDailyChallengeDate: user.lastDailyChallengeDate ?? null, // 如果没有上次挑战日期字段，给null
    };
  }

  // 获取所有用户数据
  async getUsers(): Promise<CloudStorageResponse<any[]>> {
    try {
      // 先同步数据，然后返回最新的用户列表
      const users = this.syncData();
      return {
        success: true,
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users',
      };
    }
  }

  // 保存用户数据
  async saveUsers(users: any[]): Promise<CloudStorageResponse<any[]>> {
    try {
      this.saveLocalUsers(users);
      return {
        success: true,
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save users',
      };
    }
  }

  // 添加新用户
  async addUser(user: any): Promise<CloudStorageResponse<any[]>> {
    const usersResponse = await this.getUsers();
    
    if (!usersResponse.success) {
      return usersResponse;
    }

    const users = usersResponse.data || [];
    users.push(user);
    
    return this.saveUsers(users);
  }

  // 更新用户数据
  async updateUser(userId: string, updateData: Partial<any>): Promise<CloudStorageResponse<any[]>> {
    const usersResponse = await this.getUsers();
    
    if (!usersResponse.success) {
      return usersResponse;
    }

    const users = usersResponse.data || [];
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    users[userIndex] = { ...users[userIndex], ...updateData };
    
    return this.saveUsers(users);
  }

  // 验证用户登录
  async validateUser(username: string, password: string): Promise<CloudStorageResponse<any>> {
    const usersResponse = await this.getUsers();
    
    if (!usersResponse.success) {
      return usersResponse;
    }

    const users = usersResponse.data || [];
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      // 更新最后登录时间
      await this.updateUser(user.id, { lastLoginAt: new Date() });
      
      return {
        success: true,
        data: user,
      };
    }

    return {
      success: false,
      error: 'Invalid credentials',
    };
  }

  // 检查用户名是否已存在
  async checkUsernameExists(username: string): Promise<CloudStorageResponse<boolean>> {
    const usersResponse = await this.getUsers();
    
    if (!usersResponse.success) {
      return {
        success: false,
        error: usersResponse.error,
      };
    }

    const users = usersResponse.data || [];
    const exists = users.some((u: any) => u.username === username);
    
    return {
      success: true,
      data: exists,
    };
  }

  // 同步本地数据到云端（用于迁移现有用户）
  async syncLocalToCloud(): Promise<CloudStorageResponse<any[]>> {
    try {
      const localUsers = localStorage.getItem('puzzle_users');
      if (localUsers) {
        const users = JSON.parse(localUsers);
        if (users.length > 0) {
          console.log('Syncing local users to cloud:', users.length);
          return this.saveUsers(users);
        }
      }
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync error',
      };
    }
  }
}

export const cloudStorage = new CloudStorageService();