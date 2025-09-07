import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '../types';
import { cloudStorage } from '../services/cloudStorage';

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
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
        totalScore: 0,
        gamesCompleted: 0,
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

  const value: AuthContextType = {
    authState,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
