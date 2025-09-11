// 音乐服务
import MistyMemoryDay from '../assets/bgm/Misty Memory (Day Version).mp3';
import MistyMemoryNight from '../assets/bgm/Misty Memory (Night Version).mp3';
import CountingSheep from '../assets/bgm/Counting Sheep.mp3';
import Effervescence from '../assets/bgm/Effervescence.mp3';
import SheepnadoDecima from '../assets/bgm/Sheepnado Decimates Nomadic City.mp3';

export type MusicType = 'lobby' | 'battle';
export type BattleMusicMode = 'random' | 'specific';
export type ThemeMode = 'auto' | 'day' | 'night';

// 音乐配置
export const MUSIC_CONFIG = {
  lobby: {
    day: MistyMemoryDay,
    night: MistyMemoryNight,
  },
  battle: [
    CountingSheep,
    Effervescence,
    SheepnadoDecima,
  ],
} as const;

// 判断是否为白天 (06:00-18:00)
export const isDayTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
};

// 音乐管理器类
export class MusicManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentMusicUrl: string | null = null;  // 记录当前播放的音乐URL
  private settings = {
    enabled: true,
    volume: 0.5,
    battleMusicMode: 'random' as BattleMusicMode,
    specificBattleMusic: CountingSheep,
    themeMode: 'auto' as ThemeMode,
  };

  constructor() {
    // 从本地存储加载设置
    this.loadSettings();
  }

  // 加载设置
  private loadSettings() {
    try {
      const saved = localStorage.getItem('musicSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('无法加载音乐设置:', error);
    }
  }

  // 保存设置
  private saveSettings() {
    try {
      localStorage.setItem('musicSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('无法保存音乐设置:', error);
    }
  }

  // 停止当前音乐
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.currentMusicUrl = null;  // 清除当前音乐URL记录
  }

  // 播放大厅音乐
  playLobbyMusic(forceTheme?: 'day' | 'night') {
    if (!this.settings.enabled) return;

    let theme: 'day' | 'night';
    
    if (forceTheme) {
      theme = forceTheme;
    } else if (this.settings.themeMode === 'auto') {
      theme = isDayTime() ? 'day' : 'night';
    } else {
      theme = this.settings.themeMode === 'day' ? 'day' : 'night';
    }

    const musicUrl = MUSIC_CONFIG.lobby[theme];
    
    // 检查是否已经在播放相同的大厅音乐
    if (this.isPlayingLobbyMusic() && this.currentMusicUrl === musicUrl) {
      console.log('🎵 大厅音乐已在播放，跳过重新播放');
      return;
    }
    
    this.playMusic(musicUrl);
  }

  // 播放战斗音乐
  playBattleMusic(specificMusic?: string) {
    if (!this.settings.enabled) return;

    let musicUrl: string;

    if (specificMusic) {
      musicUrl = specificMusic;
    } else if (this.settings.battleMusicMode === 'specific') {
      musicUrl = this.settings.specificBattleMusic;
    } else {
      // 随机选择
      const randomIndex = Math.floor(Math.random() * MUSIC_CONFIG.battle.length);
      musicUrl = MUSIC_CONFIG.battle[randomIndex];
    }

    this.playMusic(musicUrl);
  }

  // 播放音乐
  private playMusic(musicUrl: string) {
    // 如果正在播放相同的音乐，不需要重新播放
    if (this.currentMusicUrl === musicUrl && this.isPlaying()) {
      console.log('🎵 相同音乐正在播放，跳过重新播放');
      return;
    }

    // 停止当前音乐
    this.stop();

    try {
      this.currentAudio = new Audio(musicUrl);
      this.currentMusicUrl = musicUrl;  // 记录当前播放的音乐URL
      this.currentAudio.volume = this.settings.volume;
      this.currentAudio.loop = true;
      
      // 处理播放失败
      this.currentAudio.addEventListener('error', (e) => {
        console.warn('音乐播放失败:', e);
        this.currentMusicUrl = null;  // 播放失败时清除记录
      });

      // 处理音乐结束（虽然是循环的，但以防万一）
      this.currentAudio.addEventListener('ended', () => {
        this.currentMusicUrl = null;
      });

      this.currentAudio.play().catch(error => {
        console.warn('音乐自动播放被阻止:', error);
        this.currentMusicUrl = null;  // 播放失败时清除记录
      });
      
      console.log('🎵 开始播放音乐:', musicUrl.split('/').pop());
    } catch (error) {
      console.warn('创建音频对象失败:', error);
      this.currentMusicUrl = null;
    }
  }

  // 获取当前主题
  getCurrentTheme(): 'day' | 'night' {
    if (this.settings.themeMode === 'auto') {
      return isDayTime() ? 'day' : 'night';
    }
    return this.settings.themeMode === 'day' ? 'day' : 'night';
  }

  // 设置音乐开关
  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.stop();
    }
  }

  // 设置音量
  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.settings.volume;
    }
  }

  // 设置战斗音乐模式
  setBattleMusicMode(mode: BattleMusicMode) {
    this.settings.battleMusicMode = mode;
    this.saveSettings();
  }

  // 设置指定战斗音乐
  setSpecificBattleMusic(music: string) {
    this.settings.specificBattleMusic = music;
    this.saveSettings();
  }

  // 设置主题模式
  setThemeMode(mode: ThemeMode) {
    const oldMode = this.settings.themeMode;
    this.settings.themeMode = mode;
    this.saveSettings();
    
    // 如果主题模式发生变化且当前正在播放大厅音乐，切换到对应版本
    if (oldMode !== mode && this.isPlayingLobbyMusic()) {
      // 使用新的主题模式重新播放大厅音乐
      this.playLobbyMusic();
    }
  }

  // 获取设置
  getSettings() {
    return { ...this.settings };
  }

  // 获取当前播放状态
  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  // 检查是否正在播放大厅音乐（Misty Memory的日版或夜版）
  isPlayingLobbyMusic(): boolean {
    if (!this.currentMusicUrl || !this.isPlaying()) {
      return false;
    }
    
    return this.currentMusicUrl === MUSIC_CONFIG.lobby.day || 
           this.currentMusicUrl === MUSIC_CONFIG.lobby.night;
  }

  // 获取当前音乐类型
  getCurrentMusicType(): 'lobby' | 'battle' | null {
    if (!this.currentMusicUrl) {
      return null;
    }
    
    if (this.isPlayingLobbyMusic()) {
      return 'lobby';
    }
    
    if (MUSIC_CONFIG.battle.includes(this.currentMusicUrl as any)) {
      return 'battle';
    }
    
    return null;
  }

  // 获取当前音乐URL（供调试使用）
  getCurrentMusicUrl(): string | null {
    return this.currentMusicUrl;
  }

  // 获取当前音乐名称（供调试使用）
  getCurrentMusicName(): string | null {
    if (!this.currentMusicUrl) {
      return null;
    }
    
    // 从文件路径中提取文件名
    const fileName = this.currentMusicUrl.split('/').pop();
    if (fileName) {
      // 移除文件扩展名
      return fileName.replace(/\.[^/.]+$/, '');
    }
    
    return null;
  }

  // 获取详细状态信息（供调试使用）
  getDetailedStatus() {
    return {
      isEnabled: this.settings.enabled,
      isPlaying: this.isPlaying(),
      currentMusicType: this.getCurrentMusicType(),
      currentMusicName: this.getCurrentMusicName(),
      currentTheme: this.getCurrentTheme(),
      isPlayingLobbyMusic: this.isPlayingLobbyMusic(),
      volume: this.settings.volume,
      themeMode: this.settings.themeMode
    };
  }

  // 手动切换日夜主题
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'day' ? 'night' : 'day';
    this.setThemeMode(newTheme);
    
    // 如果当前正在播放大厅音乐，切换到对应的日/夜版本
    if (this.isPlayingLobbyMusic()) {
      this.playLobbyMusic(newTheme);
    }
    
    return newTheme;
  }
}

// 全局音乐管理器实例
export const musicManager = new MusicManager();

// 音乐选项配置
export const BATTLE_MUSIC_OPTIONS = [
  { value: CountingSheep, label: 'Counting Sheep' },
  { value: Effervescence, label: 'Effervescence' },
  { value: SheepnadoDecima, label: 'Sheepnado Decimates Nomadic City' },
];
