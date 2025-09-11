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
    // 停止当前音乐
    this.stop();

    try {
      this.currentAudio = new Audio(musicUrl);
      this.currentAudio.volume = this.settings.volume;
      this.currentAudio.loop = true;
      
      // 处理播放失败
      this.currentAudio.addEventListener('error', (e) => {
        console.warn('音乐播放失败:', e);
      });

      this.currentAudio.play().catch(error => {
        console.warn('音乐自动播放被阻止:', error);
      });
    } catch (error) {
      console.warn('创建音频对象失败:', error);
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
    this.settings.themeMode = mode;
    this.saveSettings();
  }

  // 获取设置
  getSettings() {
    return { ...this.settings };
  }

  // 获取当前播放状态
  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  // 手动切换日夜主题
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'day' ? 'night' : 'day';
    this.setThemeMode(newTheme);
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
