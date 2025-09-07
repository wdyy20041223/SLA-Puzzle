import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials, GameCompletionResult } from '../types';
import { cloudStorage } from '../services/cloudStorage';
import { calculateLevelFromExp } from '../utils/experienceSystem';

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUserRewards: (coins: number, experience: number) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  handleGameCompletion: (result: GameCompletionResult) => Promise<boolean>;
  resetUserProgress: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // 添加防重复提交的状态
  const [processingGameCompletion, setProcessingGameCompletion] = useState(false);

  useEffect(() => {
    // 检查是否有保存的登录状态
    const savedUser = localStorage.getItem('puzzle_current_user');
    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        localStorage.removeItem('puzzle_current_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 使用云存储服务获取用户数据
      const usersResponse = await cloudStorage.getUsers();
      
      if (!usersResponse.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '无法连接到服务器，请稍后重试',
        }));
        return false;
      }

      const users = usersResponse.data || [];
      const user = users.find((u: any) => 
        u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;

        // 更新最后登录时间
        userWithoutPassword.lastLoginAt = new Date();
        
        // 更新云端用户数据
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, lastLoginAt: new Date() } : u
        );
        
        await cloudStorage.saveUsers(updatedUsers);
        localStorage.setItem('puzzle_current_user', JSON.stringify(userWithoutPassword));

        setAuthState({
          isAuthenticated: true,
          user: userWithoutPassword,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '用户名或密码错误',
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: '登录失败，请稍后重试',
      }));
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 验证输入
      if (credentials.password !== credentials.confirmPassword) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '两次输入的密码不一致',
        }));
        return false;
      }

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 使用云存储服务获取用户数据
      const usersResponse = await cloudStorage.getUsers();
      
      if (!usersResponse.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '无法连接到服务器，请稍后重试',
        }));
        return false;
      }

      const users = usersResponse.data || [];
      
      // 检查用户名是否已存在
      if (users.some((u: any) => u.username === credentials.username)) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '该用户名已被使用',
        }));
        return false;
      }

      // 创建新用户
      const newUser = {
        id: Date.now().toString(),
        username: credentials.username,
        password: credentials.password, // 在实际项目中应该加密存储
        createdAt: new Date(),
        lastLoginAt: new Date(),
        level: 1,
        experience: 0,
        coins: 500, // 初始金币，给多一点用于测试购买
        totalScore: 0,
        gamesCompleted: 0,
        achievements: [], // 初始成就列表
        bestTimes: {}, // 初始最佳时间记录
        ownedItems: ['avatar_cat', 'decoration_frame'], // 初始拥有一些物品用于测试
      };

      users.push(newUser);
      
      // 保存到云存储
      const saveResponse = await cloudStorage.saveUsers(users);
      
      if (!saveResponse.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '注册失败，请稍后重试',
        }));
        return false;
      }

      // 自动登录新注册的用户
      const { password, ...userWithoutPassword } = newUser;
      localStorage.setItem('puzzle_current_user', JSON.stringify(userWithoutPassword));

      setAuthState({
        isAuthenticated: true,
        user: userWithoutPassword,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: '注册失败，请稍后重试',
      }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('puzzle_current_user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const updateUserRewards = async (coins: number, experience: number): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    try {
      const usersResponse = await cloudStorage.getUsers();
      if (!usersResponse.success) {
        return false;
      }

      const users = usersResponse.data || [];
      const currentUser = authState.user;
      const newCoins = currentUser.coins + coins;
      const newExperience = currentUser.experience + experience;
      const newLevel = calculateLevelFromExp(newExperience);

      // 更新用户数据
      const updatedUser = {
        ...currentUser,
        coins: newCoins,
        experience: newExperience,
        level: newLevel,
      };

      // 更新用户列表
      const updatedUsers = users.map((u: any) => 
        u.id === currentUser.id ? { ...u, ...updatedUser } : u
      );

      // 保存到云端
      const saveResponse = await cloudStorage.saveUsers(updatedUsers);
      if (!saveResponse.success) {
        return false;
      }

      // 更新本地状态
      localStorage.setItem('puzzle_current_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      return true;
    } catch (error) {
      console.error('更新用户奖励失败:', error);
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    try {
      const currentUser = authState.user;
      
      // 获取用户列表
      const usersResponse = await cloudStorage.getUsers();
      if (!usersResponse.success) {
        return false;
      }
      const users = usersResponse.data || [];
      
      // 更新用户信息
      const updatedUser = {
        ...currentUser,
        ...updates,
      };

      // 更新用户列表
      const updatedUsers = users.map((u: any) => 
        u.id === currentUser.id ? { ...u, ...updatedUser } : u
      );

      // 保存到云端
      const saveResponse = await cloudStorage.saveUsers(updatedUsers);
      if (!saveResponse.success) {
        return false;
      }

      // 更新本地状态
      localStorage.setItem('puzzle_current_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      return true;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      return false;
    }
  };

  const handleGameCompletion = async (result: GameCompletionResult): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user || processingGameCompletion) {
      return false;
    }

    setProcessingGameCompletion(true);

    try {
      const usersResponse = await cloudStorage.getUsers();
      if (!usersResponse.success) {
        return false;
      }

      const users = usersResponse.data || [];
      const currentUser = authState.user;
      
      // 更新游戏统计
      const newCoins = currentUser.coins + result.rewards.coins;
      const newExperience = currentUser.experience + result.rewards.experience;
      const newLevel = calculateLevelFromExp(newExperience);
      const newGamesCompleted = currentUser.gamesCompleted + 1;

      // 更新最佳时间记录
      const bestTimes = { ...currentUser.bestTimes };
      const difficultyKey = `${result.difficulty}_time`;
      if (!bestTimes[difficultyKey] || result.completionTime < bestTimes[difficultyKey]) {
        bestTimes[difficultyKey] = result.completionTime;
      }

      // 更新成就列表
      const achievements = [...(currentUser.achievements || [])];
      if (result.rewards.achievements) {
        result.rewards.achievements.forEach(achievement => {
          if (!achievements.includes(achievement.id)) {
            achievements.push(achievement.id);
          }
        });
      }

      // 更新最近游戏结果（用于连续成就追踪）
      const recentGameResults = [...((currentUser as any).recentGameResults || [])];
      recentGameResults.push({
        moves: result.moves,
        totalPieces: result.totalPieces || 0, // 使用结果中的totalPieces
        timestamp: new Date()
      });

      // 只保留最近10次游戏结果
      if (recentGameResults.length > 10) {
        recentGameResults.splice(0, recentGameResults.length - 10);
      }

      // 更新用户数据
      const updatedUser = {
        ...currentUser,
        coins: newCoins,
        experience: newExperience,
        level: newLevel,
        gamesCompleted: newGamesCompleted,
        achievements,
        bestTimes,
        recentGameResults,
        lastLoginAt: new Date(),
      };

      // 更新用户列表
      const updatedUsers = users.map((u: any) => 
        u.id === currentUser.id ? { ...u, ...updatedUser } : u
      );

      // 保存到云端
      const saveResponse = await cloudStorage.saveUsers(updatedUsers);
      if (!saveResponse.success) {
        return false;
      }

      // 更新本地状态
      localStorage.setItem('puzzle_current_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      return true;
    } catch (error) {
      console.error('处理游戏完成失败:', error);
      return false;
    } finally {
      setProcessingGameCompletion(false);
    }
  };

  // 重置用户进度（等级、金币、经验、成就等）
  const resetUserProgress = async (): Promise<boolean> => {
    try {
      const currentUser = authState.user;
      if (!currentUser) {
        console.error('没有当前用户');
        return false;
      }

      // 获取所有用户
      const usersResponse = await cloudStorage.getUsers();
      if (!usersResponse.success) {
        console.error('获取用户列表失败:', usersResponse.error);
        return false;
      }

      const users = usersResponse.data || [];

      // 重置用户数据到初始状态
      const resetUser = {
        ...currentUser,
        experience: 0,
        coins: 100, // 重置为初始金币数量
        level: 1, // 重置为1级
        gamesCompleted: 0,
        achievements: [], // 清空成就
        bestTimes: {}, // 清空最佳时间记录
        totalTimePlayed: 0,
        lastLoginAt: new Date(),
      };

      // 更新用户列表
      const updatedUsers = users.map((u: any) => 
        u.id === currentUser.id ? { ...u, ...resetUser } : u
      );

      // 保存到云端
      const saveResponse = await cloudStorage.saveUsers(updatedUsers);
      if (!saveResponse.success) {
        console.error('保存重置数据失败:', saveResponse.error);
        return false;
      }

      // 更新本地状态
      localStorage.setItem('puzzle_current_user', JSON.stringify(resetUser));
      setAuthState(prev => ({
        ...prev,
        user: resetUser,
      }));

      console.log('用户进度重置成功');
      return true;
    } catch (error) {
      console.error('重置用户进度失败:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    authState,
    login,
    register,
    logout,
    clearError,
    updateUserRewards,
    updateUserProfile,
    handleGameCompletion,
    resetUserProgress,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
